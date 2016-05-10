import React from 'react';

export default class SearchResponse extends React.Component {
  render() {

    var response = this.props.response;
    var responseType = response.responseType;

    return (

      <div id="searchResponseBox" className="container">
        <div id="searchResponse" className="col-lg-7 col-sm-9 col-xs-12 center">
          <h2>Example {responseType} Box</h2>
          <p>Short description of {responseType} query.</p>
        </div>
      </div>

    );
  }
}
