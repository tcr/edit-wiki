import {
  commitMutation,
  graphql,
} from 'react-relay';
import {ConnectionHandler} from 'relay-runtime';

const mutation = graphql`
  mutation CreatePageMutation($input: CreateTodoInput!) {
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
        }
      }
    }
  }
`;

function sharedUpdater(store, viewer, newEdge) {
  const userProxy = store.get(viewer.user.id);
  const conn = ConnectionHandler.getConnection(
    userProxy,
    'PageList_pages',
    {orderBy: 'createdAt_DESC'},
  );
  ConnectionHandler.insertEdgeBefore(conn, newEdge);
}

var tempID = 0;

function commit(
  environment,
  text,
  textID,
  viewer,
  
  next // TODO remove
) {
  return commitMutation(
    environment,
    {
      mutation,
      variables: {
        input: {
          userId: viewer.user.id,
          text,
          textID,
        },
      },

      updater: (store) => {
        const payload = store.getRootField('createTodo');
        const newEdge = payload.getLinkedRecord('edge');
        sharedUpdater(store, viewer, newEdge);
        next && next();
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
        sharedUpdater(store, viewer, newEdge);
      },
    },
  );
}

export default {commit};
