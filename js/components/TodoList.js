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
      this.props.viewer.user.todos.edges.map(edge => edge.node),
      this.props.viewer,
    );
  };

  renderTodos() {
    return this.props.viewer.user.todos.edges.map(edge =>
      <li key={edge.node.id}>
        <a href={`/${edge.node.textID}`}>/{edge.node.textID}</a>
      </li>
    );
  }

  render() {
    return (
      <ul id="sidebar-pages">
        {this.renderTodos()}
      </ul>
    );
  }
}

export default createFragmentContainer(TodoList, {
  viewer: graphql`
    fragment TodoList_viewer on Viewer {
      user {
        id
        todos(
          first: 1000
          orderBy: createdAt_DESC
        ) @connection(key: "TodoList_todos") {
          edges {
            node {
              id
              textID
            }
          }
        }
        incompleteTodos: todos(
          first: 1000
        ) {
          count
        }
        completedTodos: todos(
          filter: { complete: true }
        ) {
          count
        }
      }
      ...Todo_viewer
    }
  `,
});
