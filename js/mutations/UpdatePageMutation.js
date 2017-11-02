import {
  commitMutation,
  graphql,
} from 'react-relay';

const mutation = graphql`
  mutation UpdatePageMutation($input: UpdatePageInput!) {
    updatePage(input: $input) {
      page {
        id
        text
      }
    }
  }
`;

function getOptimisticResponse(text, page) {
  return {
    updatePage: {
      page: {
        id: page.id,
        text: text,
      },
    },
  };
}

function commit(
  environment,
  text,
  page
) {
  return commitMutation(
    environment,
    {
      mutation,
      variables: {
        input: {
          text,
          id: page.id,
        },
      },
      optimisticResponse: getOptimisticResponse(text, page),
    }
  );
}

export default {commit};
