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
import Auth from './auth';

import CreateUserMutation from './mutations/CreateUserMutation';
import LoginUserMutation from './mutations/LoginUserMutation';

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

let glob = '';

function fetchQuery(
  operation,
  variables,
) {
  // console.log(`Bearer ${localStorage.getItem('id_token')}`);
  // operation.text = operation.text.replace(/\b(start|end)Cursor\b/g, '');

  let headers = {
    'Content-Type': 'application/json',
  };
  let glob = localStorage.getItem('graphcool_token');
  if (glob != '' && glob) {
    headers['Authorization'] = `Bearer ${glob}`;
  }

  let v = JSON.parse(JSON.stringify(variables));

  if (operation.text.match(/^[\s\n\r]*mutation/)) {
    Object.keys(variables).forEach((key) => {
      v[key].clientMutationId = String('random:' + Math.random());
    });
  }

  return fetch('https://api.graph.cool/relay/v1/cj8kg5jub004a0103tjgfa9y3', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: operation.text,
      variables: v,
    }),
  }).then(response => {
    return response.json();
  });
}

const network = Network.create(fetchQuery);

const modernEnvironment = new Environment({
  network,
  store: new Store(new RecordSource()),
});

const auth = new Auth();
auth.handleAuthentication();
// auth.logout();

class Root extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      authed: false,
    };
  }

  render() {
    if (auth.isAuthenticated()) {
      // glob = `Bearer ${localStorage.getItem('id_token')}`;
      console.log('-id_token->', localStorage.getItem('id_token'));
      // if (!this.state.authed) {
        // CreateUserMutation.commit(
        //   modernEnvironment,
        //   localStorage.getItem('id_token'),
        //   () => {
        //     this.setState({authed: true});
        //   });
        // return (
        //   <div>Loading...</div>
        // );
      // } else {
        return (
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
                return <div>Waiting on Relay...</div>;
              }
            }}
          />
        );
      // }
    } else {
      return (
        <div>
          <button onClick={() => auth.login()}>Authenticate</button>
        </div>
      );
    }
  }
}

ReactDOM.render(
  <Root />,
  mountNode,
);