import {
  commitMutation,
  graphql,
} from 'react-relay';
import {ConnectionHandler} from 'relay-runtime';

const mutation = graphql`
  mutation AddTodoMutation($input: CreateTodoInput!) {
    createTodo(input:$input) {
      edge {
        cursor
        node {
          complete
          id
          text
        }
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

function sharedUpdater(store, user, newEdge) {
  const userProxy = store.get(user.id);
  const conn = ConnectionHandler.getConnection(
    userProxy,
    'TodoList_todos',
    {orderBy: 'createdAt_DESC'},
  );
  ConnectionHandler.insertEdgeBefore(conn, newEdge);
}

var tempID = 0;

function commit(
  environment,
  text,
  user
) {
  return commitMutation(
    environment,
    {
      mutation,
      variables: {
        input: {
          userId: user.id,
          text,
        },
      },

      updater: (store) => {
        const payload = store.getRootField('createTodo');
        const newEdge = payload.getLinkedRecord('edge');
        sharedUpdater(store, user, newEdge);
      },

      optimisticUpdater: (store) => {
        const id = 'client:newEdge:' + tempID++;
        const node = store.create(id, 'Todo');
        node.setValue(text, 'text');
        node.setValue(id, 'id');
        const newEdge = store.create(
          'client:newEdge:' + tempID++,
          'TodoEdge',
        );
        newEdge.setLinkedRecord(node, 'node');
        sharedUpdater(store, user, newEdge);
      },

      optimisticResponse: {
        createTodo: {
          viewer: {
            user: {
              id: user.id,
              incompleteTodos: {
                count: user.incompleteTodos.count + 1,
              }
            }
          }
        }
      },
    }
  );
}

export default {commit};
