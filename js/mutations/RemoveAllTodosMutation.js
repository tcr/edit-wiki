import {
    commitMutation,
    graphql,
  } from 'react-relay';
  import {ConnectionHandler} from 'relay-runtime';
  import commitMutationBatch from '../batch';
  
  const mutation = graphql`
    mutation RemoveAllTodosMutation($__template_input: DeleteTodoInput!) {
      __template: deleteTodo(input: $__template_input) {
        changedTodo {
          id
        }
        viewer {
          id
          user {
            completedTodos: todos(
              where: { complete: { eq: true } }
            ) {
              aggregations {
                count
              }
            }
            todos(
              first: 2147483647  # max GraphQLInt
            ) {
              aggregations {
                count
              }
            }
          }
        },
      }
    }
  `;
  
  function sharedUpdater(store, user, deletedID) {
    const userProxy = store.get(user.id);
    const conn = ConnectionHandler.getConnection(
      userProxy,
      'TodoList_todos',
    );
    ConnectionHandler.deleteNode(
      conn,
      deletedID,
    );
  }
  
  function commit(
    environment,
    todos,
    user,
  ) {
    return commitMutationBatch(
      environment,
      mutation,
      todos,
      (todo) => ({
        variables: {id: todo.id},
  
        updater: (store) => {
          const payload = store.getRoot().getLinkedRecord('deleteTodo', {input: {id: todo.id}});
          const id = payload.getLinkedRecord('changedTodo').getValue('id');
          sharedUpdater(store, user, id);
        },
  
        optimisticUpdater: (store) => {
          sharedUpdater(store, user, todo.id);
        },
        
        optimisticResponse: {
          deleteTodo: {
            viewer: {
              user: {
                id: user.id,
                todos: {
                  aggregations: {
                    count: user.todos.aggregations.count - 1,
                  }
                },
                completedTodos: {
                  aggregations: {
                    count: user.completedTodos.aggregations.count - (todo.complete ? 1 : 0),
                  }
                }
              }
            }
          }
        },
      }),
    );
  }
  
  export default {commit};
  