import RemoveAllTodosMutation from '../mutations/RemoveAllTodosMutation';

import React from 'react';
import {
  graphql,
  createFragmentContainer,
} from 'react-relay';

class TodoListFooter extends React.Component {
  _handleRemoveCompletedTodosClick = () => {
    RemoveAllTodosMutation.commit(
      this.props.relay.environment,
      this.props.viewer.todos.edges.map(edge => edge.node).filter(node => node.complete),
      this.props.viewer,
    );
  };

  render() {
    const numCompletedTodos = this.props.viewer.completedTodos.aggregations.count;
    const numRemainingTodos = this.props.viewer.todos.aggregations.count - numCompletedTodos;
    return (
      <footer className="footer">
        <span className="todo-count">
          <strong>{numRemainingTodos}</strong> item{numRemainingTodos === 1 ? '' : 's'} left
        </span>
        {numCompletedTodos > 0 &&
          <button
            className="clear-completed"
            onClick={this._handleRemoveCompletedTodosClick}>
            Clear completed
          </button>
        }
      </footer>
    );
  }
}

export default createFragmentContainer(
  TodoListFooter,
  graphql`
    fragment TodoListFooter_viewer on User {
      id
      todos(
        first: 2147483647  # max GraphQLInt
      ) @connection(key: "TodoList_todos") {
        edges {
          node {
            id
            complete
          }
        }
        aggregations {
          count
        }
      }
      completedTodos: todos(
        where: {
          complete: {eq: true}
        }
      ) {
        aggregations {
          count
        }
      },
    }
  `
);
