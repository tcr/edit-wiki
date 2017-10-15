import makeRouteConfig from 'found/lib/makeRouteConfig';
import Route from 'found/lib/Route';
import React from 'react';
import { graphql } from 'react-relay';

import TodoApp from './components/TodoApp';
import TodoList from './components/TodoList';

const TodoAppQuery = graphql`
  query routes_TodoApp_Query {
    viewer {
      ...TodoApp_viewer
    }
  }
`;

const TodoListQuery = graphql`
  query routes_TodoList_Query {
    viewer {
      ...TodoList_viewer
    }
  }
`;

export default makeRouteConfig(
  <Route
    path="/"
    Component={TodoApp}
    query={TodoAppQuery}>
    {/* <Route
      Component={TodoList}
      query={TodoListQuery}
      prepareVariables={params => ({ ...params, status: 'any' })} /> */}
    <Route
      path="login"
      Component={TodoApp}
    />
  </Route>,
);

// prepareVariables={params => ({ ...params, login: true })}


// class Root extends React.Component {
//   render() {
//     if (auth.isAuthenticated()) {
//       return (
//         <QueryRenderer
//           environment={modernEnvironment}
//           query={graphql`
//             query appQuery {
//               viewer {
//                 user {
//                   ...TodoApp_viewer
//                 }
//               }
//             }
//           `}
//           variables={{}}
//           render={({error, props}) => {
//             if (props) {
//               return <TodoApp viewer={props.viewer.user} />;
//             } else {
//               return <div>Waiting on Relay...</div>;
//             }
//           }}
//         />
//       );
//     } else {
//       return (
//         <div>
//           <button onClick={() => auth.login()}>Authenticate</button>
//         </div>
//       );
//     }
//   }
// }