import {
  commitMutation,
  graphql,
} from 'react-relay';
import {ConnectionHandler} from 'relay-runtime';

const mutation = graphql`
  mutation DeletePageMutation($input: DeletePageInput!) {
    deletePage(input: $input) {
      page {
        id
      }
      viewer {
        user {
          id
        }
      }
    }
  }
`;

function sharedUpdater(store, viewer, deletedID) {
  const userProxy = store.get(viewer.user.id);
  const conn = ConnectionHandler.getConnection(
    userProxy,
    'PageList_pages',
    {orderBy: 'createdAt_DESC'},
  );
  ConnectionHandler.deleteNode(
    conn,
    deletedID,
  );
}

function commit(
  environment,
  page,
  viewer,
) {
  return commitMutation(
    environment,
    {
      mutation,
      variables: {
        input: {
          id: page.id
        },
      },

      updater: (store) => {
        const payload = store.getRootField('deletePage');
        const id = payload.getLinkedRecord('page').getValue('id');
        sharedUpdater(store, viewer, id);
      },

      optimisticUpdater: (store) => {
        sharedUpdater(store, viewer, page.id);
      },
    }
  );
}

export default {commit};
