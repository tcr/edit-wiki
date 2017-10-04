import {
  commitMutation,
  graphql,
} from 'react-relay';

const mutation = graphql`
  mutation ChangeTodoStatusMutation($input: UpdateTodoInput!) {
    updateTodo(input: $input) {
      changedTodo {
        id
        complete
      }
      viewer {
        id
        user {
          completedTodos: todos(
            where: { complete: { eq: true } }
          ) {
            aggregations {
              count
            }
          }
        }
      }
    }
  }
`;

function getOptimisticResponse(complete, todo, user) {
  const viewerPayload = {id: user.id};
  if (user.completedTodos != null) {
    viewerPayload.completedTodos = {"aggregations": {"count": complete ?
      user.completedTodos.aggregations.count + 1 :
      user.completedTodos.aggregations.count - 1 }};
  }
  return {
    updateTodo: {
      changedTodo: {
        id: todo.id,
        complete,
      },
      viewer: {
        user: viewerPayload
      },
    },
  };
}

function commit(
  environment,
  complete,
  todo,
  user,
) {
  return commitMutation(
    environment,
    {
      mutation,
      variables: {
        input: {complete, id: todo.id},
      },
      optimisticResponse: getOptimisticResponse(complete, todo, user),
    }
  );
}

export default {commit};
