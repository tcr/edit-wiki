import marked from 'marked';
import Mousetrap from 'mousetrap';
import React from 'react';
import {
  createFragmentContainer,
  graphql,
} from 'react-relay';
import classnames from 'classnames';

import DeletePageMutation from '../mutations/DeletePageMutation';
import UpdatePageMutation from '../mutations/UpdatePageMutation';

import RenderWorker from 'worker-loader?name=render.worker.js!../markdown-render';

const worker = new RenderWorker();

export class PageBase extends React.Component {
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
        text: props.page.text,
        savedText: props.page.text,
      };
    } else {
      this.state = {
        text: '# Loading...',
        savedText: '# Loading...',
      };
    }
  }

  _removePage() {
    DeletePageMutation.commit(
      this.props.relay.environment,
      this.props.page,
      this.props.viewer,
    );
  }
  
  _pushUpdates() {
    if (this.state.text != this.state.savedText) {
      UpdatePageMutation.commit(
        this.props.relay.environment,
        this.state.text,
        this.props.page,
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

export let Page = createFragmentContainer(PageBase, {
  page: graphql`
    fragment Page_page on Todo {
      complete,
      id,
      text,
    }
  `,
  viewer: graphql`
    fragment Page_viewer on Viewer {
      user {
        id
      }
    }
  `,
});
