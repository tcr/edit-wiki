import {
    commitMutation,
    graphql,
  } from 'react-relay';
  import {ConnectionHandler} from 'relay-runtime';
  
  import {commitMutationBatch} from '../graphcool';
  
  const mutation = graphql`
    mutation RemoveAllTodosMutation($__template_input: DeleteTodoInput!) {
      __template: deleteTodo(input: $__template_input) {
        todo {
          id
        }
        viewer {
          user {
            id
            incompleteTodos: todos(
              first: 1000
            ) {
              count
            }
            completedTodos: todos(
              filter: { complete: true }
            ) {
              count
            }
          }
        },
      }
    }
  `;
  
  function sharedUpdater(store, viewer, deletedID) {
    const userProxy = store.get(viewer.user.id);
    const conn = ConnectionHandler.getConnection(
      userProxy,
      'TodoList_todos',
      {orderBy: 'createdAt_DESC'},
    );
    ConnectionHandler.deleteNode(
      conn,
      deletedID,
    );
  }
  
  function commit(
    environment,
    todos,
    viewer,
  ) {
    return commitMutationBatch(
      environment,
      mutation,
      todos,
      (todo) => ({
        variables: {
          id: todo.id
        },
  
        updater: (store) => {
          const payload = store.getRoot().getLinkedRecord('deleteTodo', {input: {id: todo.id}});
          const id = payload.getLinkedRecord('todo').getValue('id');
          sharedUpdater(store, viewer, id);
        },
  
        optimisticUpdater: (store) => {
          sharedUpdater(store, viewer, todo.id);
        },
        
        optimisticResponse: {
          deleteTodo: {
            viewer: {
              user: {
                id: viewer.user.id,
                incompleteTodos: {
                  count: viewer.user.incompleteTodos.count - 1,
                },
                completedTodos: {
                  count: viewer.user.completedTodos.count - (todo.complete ? 1 : 0),
                }
              }
            }
          }
        },
      }),
    );
  }
  
  export default {commit};
  