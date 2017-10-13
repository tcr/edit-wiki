import {
  commitMutation,
  graphql,
} from 'react-relay';

const mutation = graphql`
  mutation CreateUserMutation(
    $input: SignupUserInput!
  ) {
    createUser(input: $input) {
      user {
        id
      }
    }
  }
`;

function commit(
  environment,
  idToken,
  next,
) {
  return commitMutation(
    environment,
    {
      mutation,
      variables: {
        input: {
          authProvider: { auth0: { idToken } },
        },
      },

      onCompleted: () => {
        console.log(arguments);
        next && next();
      },
    }
  );
}

export default {commit};
