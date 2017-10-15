import AddTodoMutation from '../mutations/AddTodoMutation';
import TodoList from './TodoList';
import TodoListFooter from './TodoListFooter';
import TodoTextInput from './TodoTextInput';

import {auth} from '../app';

import React from 'react';
import {
  createFragmentContainer,
  graphql,
} from 'react-relay';

class TodoApp extends React.Component {
  _handleTextInputSave = (text) => {
    AddTodoMutation.commit(
      this.props.relay.environment,
      text,
      this.props.viewer,
    );
  };

  _isLogin() {
    return this.props.location.pathname == '/login';
  }

  componentWillMount() {
    if (this._isLogin()) {
      auth.handleAuthentication();
      window.location.href = '/';
    } else if (!auth.isAuthenticated()) {
      auth.login();
    }
  }

  render() {
    const hasTodos = this.props.viewer.user.incompleteTodos.count > 0;
    return (
      <div>
        <section className="todoapp">
          <header className="header">
            <h1>
              todos
            </h1>
            <TodoTextInput
              autoFocus={true}
              className="new-todo"
              onSave={this._handleTextInputSave}
              placeholder="What needs to be done?"
            />
          </header>
          <TodoList viewer={this.props.viewer} />
          {hasTodos &&
            <TodoListFooter
              todos={this.props.viewer.user.todos}
              viewer={this.props.viewer}
            />
          }
        </section>
        <footer className="info">
          <p>
            Double-click to edit a todo
          </p>
          <p>
            Created by the <a href="https://facebook.github.io/relay/">
              Relay team
            </a>
          </p>
          <p>
            Part of <a href="http://todomvc.com">TodoMVC</a>
          </p>
          <button
            onClick={() => {
              auth.logout();
              window.location.href = '/';
            }}
          >
            Disconnect
          </button>
        </footer>
      </div>
    );
  }
}

export default createFragmentContainer(TodoApp, {
  viewer: graphql`
    fragment TodoApp_viewer on Viewer {
      user {
        id
        incompleteTodos: todos(
          first: 1000
        ) {
          count
        }
      }
      ...TodoListFooter_viewer,
      ...TodoList_viewer,
    }
  `,
});
