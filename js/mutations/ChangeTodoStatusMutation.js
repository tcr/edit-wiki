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

function getOptimisticResponse(complete, todo, viewer) {
  const userPayload = {id: viewer.user.id};
  if (viewer.user.completedTodos != null) {
    userPayload.completedTodos = {"count": complete ?
      viewer.user.completedTodos.count + 1 :
      viewer.user.completedTodos.count - 1 };
  }
  return {
    updateTodo: {
      todo: {
        id: todo.id,
        complete,
      },
      viewer: {
        user: userPayload
      },
    },
  };
}

function commit(
  environment,
  complete,
  todo,
  viewer,
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
      optimisticResponse: getOptimisticResponse(complete, todo, viewer),
    }
  );
}

export default {commit};
