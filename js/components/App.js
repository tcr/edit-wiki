import classnames from 'classnames';
import Mousetrap from 'mousetrap';
import React from 'react';
import {
  createFragmentContainer,
  graphql,
} from 'react-relay';

import AddTodoMutation from '../mutations/AddTodoMutation';
import {Todo, TodoBase} from './Todo';
import TodoList from './TodoList';
import {auth} from '../client';

function getOrientation() {
  return screen.width > screen.height ? 'landscape' : 'portrait';
}

export class AppBase extends React.Component {
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

    console.log(getOrientation());

    this.state = {
      sidebarVisible: false,
      orientation: getOrientation(),
      mode: 'read',
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
    this.lister.addEventListener('click', () => {
      this.setState({
        sidebarVisible: !this.state.sidebarVisible,
      });
    });

    if (this.props.relay) {
      const pageExists = this.props.viewer.user.currentPage.edges.length > 0;
      if (!pageExists) {
        const textID = window.location.pathname.replace(/^\/+|\/+$/g, '');
        AddTodoMutation.commit(
          this.props.relay.environment,
          textID == '' ?
            '# Hello world!\n\nWelcome to edit.io. Hit ESC or go to a new page to create new pages.' :
            `# ${textID}`,
          textID,
          this.props.viewer,
          () => {
            // TODO this should be a relay feature for sure
            window.location.reload();
          }
        );
      }
    }
  }

  render() {
    let sidebar = null;

    let page = <TodoBase />;

    if (this.props.relay) {
      const pageExists = this.props.viewer.user.currentPage.edges.length > 0;
      if (!pageExists) {
        return <div className="warning" style={{color: "white"}}>Loading...</div>;
      }

      sidebar = (
        <div id="sidebar">
          <h1>edit.io</h1>
          <TodoList viewer={this.props.viewer} />
        </div>
      );

      page = (
        <Todo
          key={this.props.relay ? this.props.viewer.user.currentPage.edges[0].node.id : null}
          todo={this.props.relay ? this.props.viewer.user.currentPage.edges[0].node : null}
          viewer={this.props.viewer}
        />
      );
    }

    return (
      <div
        id="app-root"
        className={classnames({
          'with-sidebar': this.state.sidebarVisible,
          'landscape': this.state.orientation == 'landscape',
          'portrait': this.state.orientation == 'portrait',
          'mode-read': this.state.mode == 'read',
          'mode-write': this.state.mode == 'write',
        })}
      >
        <button
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 1000,
            display: this.state.orientation == 'landscape' ? 'none' : 'block',
          }}
          id="lister"
          ref={lister => this.lister = lister}
        >
          Open Menu
        </button>
        <button
          style={{
            position: 'absolute',
            top: 20,
            right: 0,
            zIndex: 1000,
            display: this.state.orientation == 'landscape' ? 'none' : 'block',
          }}
          onClick={() => {
            this.setState({
              mode: this.state.mode == 'read' ? 'write' : 'read',
            })
          }}
        >
          Toggle Read/Write
        </button>
        {sidebar}
        {page}
      </div>
    );
  }
}

export let App = createFragmentContainer(AppBase, {
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
      ...TodoList_viewer,
      ...Todo_viewer,
    }
  `,
});
