import {
  commitMutation,
  graphql,
} from 'react-relay';
import {ConnectionHandler} from 'relay-runtime';

const mutation = graphql`
  mutation LoginMutation(
    $token: LoginUserWithAuth0Input!
  ) {
    loginUserWithAuth0(input: $token) {
      user {
        id
        username
        createdAt
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
        token: {
          idToken,
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
