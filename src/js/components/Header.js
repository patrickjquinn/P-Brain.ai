import React from 'react';

export default class MainLayout extends React.Component {
  render() {
    return (
      <div id="header" className="container">
        <h1>{this.props.title}</h1>
      </div>
    );
  }
}
