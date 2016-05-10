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

    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/ask?q=' + search);
    xhr.responseType = 'json';

    xhr.onload = function() {
      this.setState({response: xhr.response});
    }.bind(this);

    xhr.onerror = function() {
      console.log("Error");
    };

    xhr.send();
  }

  render() {

    // Conditional search result
    var responseBox;
    if (this.state.response) {
      responseBox = <SearchResponse response={this.state.response} />;
    }

    return (
      <div>

        {responseBox}

        <SearchForm search={this.search.bind(this)} />
      </div>
    );
  }
}
