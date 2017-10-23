import RenderWorker from 'worker-loader?name=render.worker.js!../markdown-render';

import ChangeTodoStatusMutation from '../mutations/ChangeTodoStatusMutation';
import RemoveTodoMutation from '../mutations/RemoveTodoMutation';
import RenameTodoMutation from '../mutations/RenameTodoMutation';
import TodoTextInput from './TodoTextInput';

import Mousetrap from 'Mousetrap';

import React from 'react';
import {
  createFragmentContainer,
  graphql,
} from 'react-relay';
import classnames from 'classnames';

const worker = new RenderWorker();

class Todo extends React.Component {
  state = {
    text: '',
  };

  constructor(props) {
    super(props);

    worker.addEventListener('message', (e) => {
      let {subset, full} = JSON.parse(e.data);

      if (this.output) {
        requestAnimationFrame(() => {
          this.output.innerHTML = subset;
          const scroll = this.output.scrollHeight - 120;

          this.output.innerHTML = full;
          this.output.parentNode.scrollTop = scroll;
        });
      }
    }, false);

    setInterval(this._pushUpdates.bind(this), 3000);

    this.state = {
      text: props.todo.text,
      savedText: props.todo.text,
    };
  }

  _removeTodo() {
    RemoveTodoMutation.commit(
      this.props.relay.environment,
      this.props.todo,
      this.props.viewer,
    );
  }
  
  _pushUpdates() {
    if (this.state.text != this.state.savedText) {
      RenameTodoMutation.commit(
        this.props.relay.environment,
        this.state.text,
        this.props.todo,
      );

      this.setState({
        savedText: this.state.text,
      });
    }
  }

  componentDidMount() {
    let myCodeMirror = CodeMirror(this.input, {
      value: this.state.text,
      mode: 'markdown',
      theme: 'solarized dark',
      lineWrapping: true,

      extraKeys: {
        Esc: () => {
          Mousetrap.trigger('esc');
        }
      },
    });
    myCodeMirror.focus()

    let update = ((full, subset) => {
      worker.postMessage(JSON.stringify({
        subset,
        full,
      }));

      this.setState({
        text: full
      });
    }).bind(this);

    this.output.innerHTML = marked.parse(this.state.text);

    myCodeMirror.on('change', function () {
      update(myCodeMirror.getValue(), myCodeMirror.getRange({line: 0, ch: 0}, myCodeMirror.getCursor() || {line: 0, ch: 0}))
    })
    myCodeMirror.on('cursorActivity', function () {
      update(myCodeMirror.getValue(), myCodeMirror.getRange({line: 0, ch: 0}, myCodeMirror.getCursor() || {line: 0, ch: 0}))
    })
  }

  render() {
    return (
      <div id="content">
        <div className="column">
          <div
            id="input"
            ref={input => this.input = input}
          />
        </div>
        <div className="column" id="output-column">
          <div
            id="output"
            ref={output => this.output = output}
          />
        </div>
      </div>
    );

    // <li
    //   className={classnames({
    //     completed: this.props.todo.complete,
    //     editing: this.state.isEditing,
    //   })}>
    //   <div className="view">
    //     <input
    //       checked={this.props.todo.complete}
    //       className="toggle"
    //       onChange={(e) => {
    //         const complete = e.target.checked;
    //         ChangeTodoStatusMutation.commit(
    //           this.props.relay.environment,
    //           complete,
    //           this.props.todo,
    //           this.props.viewer,
    //         );
    //       }}
    //       type="checkbox"
    //     />
    //     <label
    //       onDoubleClick={(e) => this._setEditMode(true)}>
    //       {this.props.todo.text}
    //     </label>
    //     <button
    //       className="destroy"
    //       onClick={() => this._removeTodo()}
    //     />
    //   </div>
    //   {this.state.isEditing && this.renderTextInput()}
    // </li>
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
