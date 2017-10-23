import AddTodoMutation from '../mutations/AddTodoMutation';
import Todo from './Todo';
import TodoList from './TodoList';
import TodoListFooter from './TodoListFooter';
import TodoTextInput from './TodoTextInput';

import {auth} from '../client';

import Mousetrap from 'Mousetrap';
import React from 'react';

import {
  createFragmentContainer,
  graphql,
} from 'react-relay';
import classnames from 'classnames';

class App extends React.Component {
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

  constructor(props) {
    super(props);

    this.state = {
      sidebarVisible: false,
    };
  }

  componentWillMount() {
    if (window.location.pathname == '/logout') {
      auth.logout();
    }

    if (this._isLogin()) {
      auth.handleAuthentication();
      window.location.href = '/';
    } else if (!auth.isAuthenticated()) {
      auth.login();
    }

    Mousetrap.bind('esc', () => {
      this.setState({
        sidebarVisible: !this.state.sidebarVisible,
      });
    });
  }

  componentDidMount() {
    const pageExists = this.props.viewer.user.currentPage.edges.length > 0;
    if (!pageExists) {
      const textID = window.location.pathname.replace(/^\/+|\/+$/g, '');
      AddTodoMutation.commit(
        this.props.relay.environment,
        textID == '' ? '# Hello world!\n\nWelcome to edit.io. Hit ESC or go to a new page to create new pages.' : `# ${textID}`,
        textID,
        this.props.viewer,
        () => {
          // TODO this should be a relay feature for sure
          window.location.reload();
        }
      );
    }
  }

  render() {
    const pageExists = this.props.viewer.user.currentPage.edges.length > 0;
    if (!pageExists) {
      return <div className="warning" style={{color: "white"}}>Loading...</div>;
    }
    return (
      <div
        id="app-root"
        className={classnames({
          'with-sidebar': this.state.sidebarVisible,
        })}
      >
        <div id="sidebar">
          <h1>edit.io</h1>
          <TodoList viewer={this.props.viewer} />
        </div>
        <Todo
          key={this.props.viewer.user.currentPage.edges[0].node.id}
          todo={this.props.viewer.user.currentPage.edges[0].node}
          viewer={this.props.viewer}
        />
      </div>
    );
  }
}

export default createFragmentContainer(App, {
  viewer: graphql`
    fragment App_viewer on Viewer {
      user {
        id
        currentPage: todos(
          first: 1
          filter: $pageFilter
        ){
          edges {
            node {
              id
              ...Todo_todo
            }
          }
        }

        incompleteTodos: todos(
          first: 1000
        ) {
          count
        }
        todos(
          first: 1000
          orderBy: createdAt_DESC
        ) @connection(key: "TodoList_todos") {
          edges {
            node {
              id
              complete
              ...Todo_todo
            }
          }
        }
      }
      ...TodoListFooter_viewer,
      ...TodoList_viewer,
      ...Todo_viewer,
    }
  `,
});
