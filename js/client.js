import BrowserProtocol from 'farce/lib/BrowserProtocol';
import queryMiddleware from 'farce/lib/queryMiddleware';
import createFarceRouter from 'found/lib/createFarceRouter';
import createRender from 'found/lib/createRender';
import {Resolver} from 'found-relay';
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

import routes from './routes';
import Auth from './auth';
import {fetchAuthenticatedQuery} from './graphcool';
import {AppBase} from './components/App';

export const auth = new Auth();

const network = Network.create((operation, variables) => {
  return fetchAuthenticatedQuery(operation, variables, auth);
});

const environment = new Environment({
  network,
  store: new Store(new RecordSource()),
});

const Router = createFarceRouter({
  historyProtocol: new BrowserProtocol(),
  historyMiddlewares: [queryMiddleware],
  routeConfig: routes,
  render: createRender({
    renderPending: () => {
      return (
        <AppBase
          location={window.location}
        />
      );
    },
  }),
});

const mountNode = document.getElementById('client-mount');

ReactDOM.render(
  <Router resolver={new Resolver(environment)} />,
  mountNode,
);
