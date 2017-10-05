const mutation = graphql`
  mutation LoginUserQuery(
    $input: LoginUserInput!
  ) {
    loginUser(input: $input) {
      token
      user {
        id
        username
        createdAt
      }
    }
  }
`;