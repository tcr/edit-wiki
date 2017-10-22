// Methods required for Graphcool.

import {
  commitMutation
} from 'react-relay';

function clone(a) {
  return JSON.parse(JSON.stringify(a));
}


export function fetchAuthenticatedQuery(
  operation,
  variables,
  auth,
) {
  // Clone the variables set.
  // Populate mutations with a random clientMutationId.
  let vars = clone(variables);
  if (operation.text.match(/^[\s\n\r]*mutation/)) {
    Object.keys(vars).forEach((key) => {
      vars[key].clientMutationId = String('random:' + Math.random());
    });
  }

  return fetch(
    `https://api.graph.cool/relay/v1/${process.env.GRAPHCOOL_PROJECT_ID}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth.header(),
      },
      body: JSON.stringify({
        query: operation.text,
        variables: vars,
      }),
    }
  ).then(response => {
    return response.json();
  });
}


export function commitMutationBatch(environment, mutation, list, callback) {
  if (list.length === 0) {
    return;
  }

  if (typeof mutation == 'function') {
    mutation = mutation();
  }
  mutation = clone(mutation);

  let fsel = clone(mutation.fragment.selections[0]);
  let qsel = clone(mutation.query.selections[0]);

  let sel_text = mutation.text.replace(/^[^{]*?\{/, '').replace(/}[^}]*?$/, '');

  let query = '';
  let i = 0;
  let inputs = [];
  let defns = [];
  let fsels = [];
  let qsels = [];
  for (let item of list) {
    query += sel_text.replace('__template', `u${i}`).replace('__template_input', `i${i}`);

    let c1 = clone(fsel);
    c1.alias = `u${i}`;
    c1.args[0].variableName = `i${i}`;
    fsels.push(c1);

    let c2 = clone(qsel);
    c2.alias = `u${i}`;
    c2.args[0].variableName = `i${i}`;
    qsels.push(c2);

    let argType = mutation.query.argumentDefinitions[0].type;
    defns.push({
      kind: 'LocalArgument',
      name: `i${i}`,
      type: argType,
      defaultValue: null,
    });
    inputs.push(`$i${i}: ${argType}`);
    i += 1;
  }

  mutation.text = `mutation ${mutation.name}(${inputs.join(', ')}) {
    ${query}
  }`;
  mutation.query.argumentDefinitions = defns;
  mutation.fragment.argumentDefinitions = defns;
  mutation.fragment.selections = fsels;
  mutation.query.selections = qsels;

  return commitMutation(
    environment,
    {
      mutation,
      variables: list.reduce((ret, item, i) => {
        ret[`i${i}`] = callback(item).variables;
        return ret;
      }, {}),
      updater: (store) => {
        list.forEach((item, i) => {
          let updater = callback(item).updater;
          if (updater) {
            updater(store);
          }
        })
      },
      optimisticUpdater: (store) => {
        list.forEach((item) => {
          let updater = callback(item).optimisticUpdater;
          if (updater) {
            updater(store);
          }
        })
      },
      optimisticResponse: (() => {
        if (list.length == 1) {
          return {
            [qsel.name]: callback(list[0]).optimisticResponse
          };
        }
        return list.reduce((ret, item, _i) => {
          ret[`u${_i}`] = callback(item).optimisticResponse;
          return ret;
        }, {});
      })(),
    }
  );
}
