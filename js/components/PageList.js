import React from 'react';
import {
  createFragmentContainer,
  graphql,
} from 'react-relay';

import Page from './Page';

class PageList extends React.Component {
  renderPages() {
    let list = this.props.viewer.user.pages.edges.map(edge => edge.node);
    list.sort((a, b) => {
      return b.textID < a.textID;
    });
    return list.map(node =>
      <li key={node.id}>
        <a href={`/${node.textID}`}>/{node.textID}</a>
      </li>
    );
  }

  render() {
    return (
      <ul id="sidebar-pages">
        {this.renderPages()}
      </ul>
    );
  }
}

export default createFragmentContainer(PageList, {
  viewer: graphql`
    fragment PageList_viewer on Viewer {
      user {
        id
        pages(
          first: 1000
          orderBy: createdAt_DESC
        ) @connection(key: "PageList_pages") {
          edges {
            node {
              id
              textID
            }
          }
        }
      }
      ...Page_viewer
    }
  `,
});
