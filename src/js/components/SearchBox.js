import React from 'react';

import SearchForm from "./SearchForm";
import SearchResponse from "./SearchResponse";

export default class SearchBox extends React.Component {
  constructor() {
    super();
    this.state = {
      search: '',
      response: ''
    };
  }

  search(search) {
    this.setState({search: search, response: search});
  }

  render() {
    return (
      <div>

        {(() => {
           switch (this.state.response) {
             case 'weather': return <SearchResponse response={this.state.response} />;
             default: return;
           }
         })()}

        <SearchForm search={this.search.bind(this)} />
      </div>
    );
  }
}
