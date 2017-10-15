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
      this.props.viewer.user.todos.edges
        .map(edge => edge.node).filter(node => node.complete),
      this.props.viewer,
    );
  };

  render() {
    const numCompletedTodos = this.props.viewer.user.completedTodos.count;
    const numRemainingTodos = this.props.viewer.user.incompleteTodos.count - numCompletedTodos;
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
    fragment TodoListFooter_viewer on Viewer {
      user {
        id
        todos(
          first: 1000
          orderBy: createdAt_DESC
        ) @connection(key: "TodoList_todos") {
          edges {
            node {
              id
              complete
            }
          }
        }
        incompleteTodos: todos(
          first: 1000
        ) {
          count
        }
        completedTodos: todos(
          filter: {
            complete: true
          }
        ) {
          count
        },
      }
    }
  `
);
