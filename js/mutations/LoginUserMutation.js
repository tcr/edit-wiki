import {
  commitMutation,
  graphql,
} from 'react-relay';

const mutation = graphql`
  mutation LoginUserMutation(
    $input: SigninUserInput!
  ) {
    signinUser(input: $input) {
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
          auth0: { idToken },
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
  