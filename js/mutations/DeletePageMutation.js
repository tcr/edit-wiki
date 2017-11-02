import {
  commitMutation,
  graphql,
} from 'react-relay';
import {ConnectionHandler} from 'relay-runtime';

const mutation = graphql`
  mutation DeletePageMutation($input: DeleteTodoInput!) {
    deleteTodo(input: $input) {
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
      }
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
  todo,
  viewer,
) {
  return commitMutation(
    environment,
    {
      mutation,
      variables: {
        input: {
          id: todo.id
        },
      },

      updater: (store) => {
        const payload = store.getRootField('deleteTodo');
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
    }
  );
}

export default {commit};
