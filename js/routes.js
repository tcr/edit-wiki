import makeRouteConfig from 'found/lib/makeRouteConfig';
import Route from 'found/lib/Route';
import React from 'react';
import { graphql } from 'react-relay';

import App from './components/App';
// import TodoList from './components/TodoList';

const AppQuery = graphql`
  query routes_App_Query($pageFilter: TodoFilter!) {
    viewer {
      ...App_viewer
    }
  }
`;

export default makeRouteConfig(
  <Route
    path="/"
  >
    <Route
      Component={App}
      query={AppQuery}
      prepareVariables={params => ({ ...params, pageFilter: { textID: '' } })}
    />
    <Route
      path="*"
      Component={App}
      query={AppQuery}
      prepareVariables={params => {
        let segments = [];
        Object.keys(params).forEach(index => segments[index] = params[index]);
        return ({ pageFilter: { textID: segments.join('/') } });
      }}
    />
  </Route>,
);
