import {
  commitMutation,
  graphql,
} from 'react-relay';
import commitMutationBatch from '../batch';

const mutation = graphql`
  mutation MarkAllTodosMutation(
    $__template_input: UpdateTodoInput!
  ) {
    __template: updateTodo(input: $__template_input) {
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

function getOptimisticResponse(complete, todo, todos, user) {
  return {
    todo: {
      id: todo.id,
      complete,
    },
    viewer: {
      user: {
        id: user.id,
        completedTodos: {
          count: complete ? todos.length : 0,
        },
      },
    },
  };
}

function commit(
  environment,
  complete,
  todos,
  user,
) {
  return commitMutationBatch(
    environment,
    mutation,
    todos,
    (todo) => ({
      variables: {
        complete,
        id: todo.id,
      },
      optimisticResponse: getOptimisticResponse(complete, todo, todos, user),
    }),
  );
}

export default {commit};
