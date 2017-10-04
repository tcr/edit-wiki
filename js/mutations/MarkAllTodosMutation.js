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
      changedTodo {
        id
        complete
      }
      viewer {
        id
        user {
          id
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

function getOptimisticResponse(complete, todo, todos, user) {
  return {
    changedTodo: {
      id: todo.id,
      complete,
    },
    viewer: {
      user: {
        id: user.id,
        completedTodos: {
          aggregations: {
            count: complete ? todos.length : 0,
          },
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
      variables: {complete, id: todo.id},
      optimisticResponse: getOptimisticResponse(complete, todo, todos, user),
    }),
  );
}

export default {commit};
