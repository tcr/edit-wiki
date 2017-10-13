import {
  commitMutation,
  graphql,
} from 'react-relay';

const mutation = graphql`
  mutation ChangeTodoStatusMutation($input: UpdateTodoInput!) {
    updateTodo(input: $input) {
      todo {
        id
        complete
      }
      viewer {
        user {
          id
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

function getOptimisticResponse(complete, todo, user) {
  const viewerPayload = {id: user.id};
  if (user.completedTodos != null) {
    viewerPayload.completedTodos = {"count": complete ?
      user.completedTodos.count + 1 :
      user.completedTodos.count - 1 };
  }
  return {
    updateTodo: {
      todo: {
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
        input: {
          complete,
          id: todo.id,
        },
      },
      optimisticResponse: getOptimisticResponse(complete, todo, user),
    }
  );
}

export default {commit};
