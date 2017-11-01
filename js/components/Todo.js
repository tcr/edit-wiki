import RenderWorker from 'worker-loader?name=render.worker.js!../markdown-render';

import ChangeTodoStatusMutation from '../mutations/ChangeTodoStatusMutation';
import RemoveTodoMutation from '../mutations/RemoveTodoMutation';
import RenameTodoMutation from '../mutations/RenameTodoMutation';
import TodoTextInput from './TodoTextInput';
import marked from 'marked';

import Mousetrap from 'mousetrap';

import React from 'react';
import {
  createFragmentContainer,
  graphql,
} from 'react-relay';
import classnames from 'classnames';

const worker = new RenderWorker();

export class TodoBase extends React.Component {
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

    if (this.props.relay) {
      this.state = {
        text: props.todo.text,
        savedText: props.todo.text,
      };
    } else {
      this.state = {
        text: '# Loading...',
        savedText: '# Loading...',
      };
    }
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

      // Loading changes
      readOnly: this.props.relay ? false : 'nocursor',
      scrollbarStyle: this.props.relay ? 'native' : 'null',

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

    myCodeMirror.on('change', function () {
      update(myCodeMirror.getValue(), myCodeMirror.getRange({line: 0, ch: 0}, myCodeMirror.getCursor() || {line: 0, ch: 0}))
    })
    myCodeMirror.on('cursorActivity', function () {
      update(myCodeMirror.getValue(), myCodeMirror.getRange({line: 0, ch: 0}, myCodeMirror.getCursor() || {line: 0, ch: 0}))
    })

    this.output.innerHTML = marked.parse(this.state.text);
  }

  render() {
    return (
      <div id="content">
        <div className="column" id="input-column">
          <div
            id="input"
            ref={input => this.input = input}
          />
        </div>
        <div
          className={classnames({
            'column': true,
            'disabled': !this.props.relay,
          })}
          id="output-column"
        >
          <div
            id="output"
            ref={output => this.output = output}
          />
        </div>
      </div>
    );
  }
}

export let Todo = createFragmentContainer(TodoBase, {
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
