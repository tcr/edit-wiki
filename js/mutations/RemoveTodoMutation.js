import {
  commitMutation,
  graphql,
} from 'react-relay';
import {ConnectionHandler} from 'relay-runtime';

const mutation = graphql`
  mutation RemoveTodoMutation($input: DeleteTodoInput!) {
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

function sharedUpdater(store, user, deletedID) {
  const userProxy = store.get(user.id);
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
  user,
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
              incompleteTodos: {
                count: user.incompleteTodos.count - 1,
              },
              completedTodos: {
                count: user.completedTodos.count - (todo.complete ? 1 : 0),
              }
            }
          }
        }
      },
    }
  );
}

export default {commit};
