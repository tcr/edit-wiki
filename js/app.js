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

import routes from './routes';
import Auth from './auth';

import BrowserProtocol from 'farce/lib/BrowserProtocol';
import queryMiddleware from 'farce/lib/queryMiddleware';
import createFarceRouter from 'found/lib/createFarceRouter';
import createRender from 'found/lib/createRender';
import { Resolver } from 'found-relay';

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

const environment = new Environment({
  network,
  store: new Store(new RecordSource()),
});

const auth = new Auth();
auth.handleAuthentication();
// auth.logout();

const Router = createFarceRouter({
  historyProtocol: new BrowserProtocol(),
  historyMiddlewares: [queryMiddleware],
  routeConfig: routes,

  render: createRender({}),
});

ReactDOM.render(
  <Router resolver={new Resolver(environment)} />,
  mountNode,
);