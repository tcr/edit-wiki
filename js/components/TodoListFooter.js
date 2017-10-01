import RemoveTodoMutation from '../mutations/RemoveTodoMutation';

import React from 'react';
import {
  graphql,
  createFragmentContainer,
} from 'react-relay';

class TodoListFooter extends React.Component {
  _handleRemoveCompletedTodosClick = () => {
    console.log('---->', this.props.viewer);
    for (let edge of this.props.viewer.completedTodos.edges) {
      RemoveTodoMutation.commit(
        this.props.relay.environment,
        edge.node,
        this.props.viewer,
      );
    }
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
      ) {
        aggregations {
          count
        }
      }
      completedTodos: todos(
        where: {
          complete: {eq: true}
        }
      ) {
        edges {
          node {
            id
            complete
          }
        }
        aggregations {
          count
        }
      },
    }
  `
);
