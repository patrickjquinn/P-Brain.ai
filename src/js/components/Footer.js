import React from 'react';

export default class Footer extends React.Component {
  render() {
    return (
      <div id="footer" className="container">
        <p>v{this.props.version}</p>
      </div>
    );
  }
}
