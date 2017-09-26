/**
 * This file provided by Facebook is for non-commercial testing and evaluation
 * purposes only.  Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import 'todomvc-common';

import React from 'react';
import ReactDOM from 'react-dom';

import {
  QueryRenderer,
  graphql,
} from 'react-relay';
import {
  Environment,
  Network,
  RecordSource,
  Store,
} from 'relay-runtime';

import TodoApp from './components/TodoApp';

const mountNode = document.getElementById('root');

function fetchQuery(
  operation,
  variables,
) {
  operation.text = operation.text.replace(/\b(start|end)Cursor\b/g, '');
  return fetch('https://us-west-2.api.scaphold.io/graphql/pure-morning', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AUTH_TOKEN}`,
    },
    body: JSON.stringify({
      query: operation.text,
      variables,
    }),
  }).then(response => {
    return response.json();
  })
  .then(json => {
    let j = JSON.stringify(json);
    let j2 = j.replace(/"pageInfo":{/g, `"pageInfo":{"endCursor":null,"startCursor":null,`);
    let j3 = JSON.parse(j2);
    return Promise.resolve(j3);
  })
}

const network = Network.create(fetchQuery);

const modernEnvironment = new Environment({
  network,
  store: new Store(new RecordSource()),
});

ReactDOM.render(
  <QueryRenderer
    environment={modernEnvironment}
    query={graphql`
      query appQuery {
        viewer {
          user {
            ...TodoApp_viewer
          }
        }
      }
    `}
    variables={{}}
    render={({error, props}) => {
      if (props) {
        return <TodoApp viewer={props.viewer.user} />;
      } else {
        return <div>Loading</div>;
      }
    }}
  />,
  mountNode
);
