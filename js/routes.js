import makeRouteConfig from 'found/lib/makeRouteConfig';
import Route from 'found/lib/Route';
import React from 'react';
import { graphql } from 'react-relay';

import App from './components/App';
import TodoList from './components/TodoList';

const AppQuery = graphql`
  query routes_App_Query {
    viewer {
      ...App_viewer
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
    Component={App}
    query={AppQuery}
  >
    {/* <Route
      Component={TodoList}
      query={TodoListQuery}
      prepareVariables={params => ({ ...params, status: 'any' })} /> */}
    <Route
      path="login"
      Component={App}
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