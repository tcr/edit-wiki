import {
  commitMutation,
  graphql,
} from 'react-relay';
import {ConnectionHandler} from 'relay-runtime';

const mutation = graphql`
  mutation RemoveTodoMutation($input: DeleteTodoInput!) {
    deleteTodo(input: $input) {
      changedTodo {
        id
      }
      viewer {
        id
        #completedCount,
        user {
          completedCount: todos(
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
  todo,
  user,
) {
  return commitMutation(
    environment,
    {
      mutation,
      variables: {
        input: {id: todo.id},
      },
      updater: (store) => {
        const payload = store.getRootField('deleteTodo');
        const id = payload.getLinkedRecord('changedTodo').getValue('id');
        sharedUpdater(store, user, id);
      },
      optimisticUpdater: (store) => {
        sharedUpdater(store, user, todo.id);
      },
    }
  );
}

export default {commit};
