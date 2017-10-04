import MarkAllTodosMutation from '../mutations/MarkAllTodosMutation';
import Todo from './Todo';

import React from 'react';
import {
  createFragmentContainer,
  graphql,
} from 'react-relay';

class TodoList extends React.Component {
  _handleMarkAllChange = (e) => {
    const complete = e.target.checked;
    MarkAllTodosMutation.commit(
      this.props.relay.environment,
      complete,
      this.props.viewer.todos.edges.map(edge => edge.node),
      this.props.viewer,
    );
  };

  renderTodos() {
    return this.props.viewer.todos.edges.map(edge =>
      <Todo
        key={edge.node.id}
        todo={edge.node}
        viewer={this.props.viewer}
      />
    );
  }

  render() {
    const numTodos = this.props.viewer.todos.aggregations.count;
    const numCompletedTodos = this.props.viewer.completedTodos.aggregations.count;
    return (
      <section className="main">
        <input
          checked={numTodos === numCompletedTodos && numTodos !== 0}
          className="toggle-all"
          onChange={this._handleMarkAllChange}
          type="checkbox"
        />
        <label htmlFor="toggle-all">
          Mark all as complete
        </label>
        <ul className="todo-list">
          {this.renderTodos()}
        </ul>
      </section>
    );
  }
}

export default createFragmentContainer(TodoList, {
  viewer: graphql`
    fragment TodoList_viewer on User {
      id,
      todos(
        first: 2147483647  # max GraphQLInt
      ) @connection(key: "TodoList_todos") {
        edges {
          node {
            id,
            complete,
            ...Todo_todo,
          },
        },
        aggregations {
          count
        }
      }
      completedTodos: todos(
        where: { complete: { eq: true } }
      ) {
        aggregations {
          count
        }
      }
      ...Todo_viewer,
    }
  `,
});
