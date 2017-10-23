import marked from 'marked';
import hljs from 'highlight.js';
import {AllHtmlEntities} from 'html-entities';

const entities = new AllHtmlEntities();

self.addEventListener('message', function(e) {
  let {subset, full} = JSON.parse(e.data);

  subset = marked.parse(subset);
  full = marked.parse(full);

  full = full.replace(/(<code class.*?>)([\s\S]+?)(<\/code>)/g, (match, left, middle, right) => {
    let code = entities.decode(middle);
    return [left, hljs.highlight('javascript', code).value, right].join('');
  });

  self.postMessage(JSON.stringify({
    subset,
    full,
  }));
}, false);
