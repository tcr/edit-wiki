import ChangeTodoStatusMutation from '../mutations/ChangeTodoStatusMutation';
import Todo from './Todo';

import React from 'react';
import {
  createFragmentContainer,
  graphql,
} from 'react-relay';

class TodoList extends React.Component {
  _handleMarkAllChange = (e) => {
    const complete = e.target.checked;
    for (let edge of this.props.viewer.todos.edges) {
      ChangeTodoStatusMutation.commit(
        this.props.relay.environment,
        complete,
        edge.node,
        this.props.viewer,
      );
    }
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
    const numCompletedTodos = this.props.viewer.completedCount.aggregations.count;
    return (
      <section className="main">
        <input
          checked={numTodos === numCompletedTodos}
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
      completedCount: todos(
        where: { complete: { eq: true } }
      ) {
        aggregations {
          count
        }
      }
      id,
      ...Todo_viewer,
    }
  `,
});
