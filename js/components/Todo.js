import ChangeTodoStatusMutation from '../mutations/ChangeTodoStatusMutation';
import RemoveTodoMutation from '../mutations/RemoveTodoMutation';
import RenameTodoMutation from '../mutations/RenameTodoMutation';
import TodoTextInput from './TodoTextInput';

import React from 'react';
import {
  createFragmentContainer,
  graphql,
} from 'react-relay';
import classnames from 'classnames';

class Todo extends React.Component {
  state = {
    isEditing: false,
  };

  _removeTodo() {
    RemoveTodoMutation.commit(
      this.props.relay.environment,
      this.props.todo,
      this.props.viewer,
    );
  }

  _setEditMode(shouldEdit) {
    this.setState({
      isEditing: shouldEdit
    });
  }

  renderTextInput() {
    return (
      <TodoTextInput
        className="edit"
        commitOnBlur={true}
        initialValue={this.props.todo.text}
        onCancel={() => this._setEditMode(false)}
        onDelete={() => {
          this._setEditMode(false);
          this._removeTodo();
        }}
        onSave={(text) => {
          this._setEditMode(false);
          RenameTodoMutation.commit(
            this.props.relay.environment,
            text,
            this.props.todo,
          );
        }}
      />
    );
  }

  render() {
    return (
      <li
        className={classnames({
          completed: this.props.todo.complete,
          editing: this.state.isEditing,
        })}>
        <div className="view">
          <input
            checked={this.props.todo.complete}
            className="toggle"
            onChange={(e) => {
              const complete = e.target.checked;
              ChangeTodoStatusMutation.commit(
                this.props.relay.environment,
                complete,
                this.props.todo,
                this.props.viewer,
              );
            }}
            type="checkbox"
          />
          <label
            onDoubleClick={(e) => this._setEditMode(true)}>
            {this.props.todo.text}
          </label>
          <button
            className="destroy"
            onClick={() => this._removeTodo()}
          />
        </div>
        {this.state.isEditing && this.renderTextInput()}
      </li>
    );
  }
}

export default createFragmentContainer(Todo, {
  todo: graphql`
    fragment Todo_todo on Todo {
      complete,
      id,
      text,
    }
  `,
  viewer: graphql`
    fragment Todo_viewer on Viewer {
      user {
        id
        incompleteTodos: todos(
          first: 1000
        ) {
          count
        }
        completedTodos: todos(
          filter: {complete: true}
        ) {
          count
        }
      }
    }
  `,
});
