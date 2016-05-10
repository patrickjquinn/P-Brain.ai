import React from 'react';

export default class SearchForm extends React.Component {

  constructor() {
    super();
    this.state = {
      search: ''
    };
  }

  updateSearch(event) {
    this.setState({search: event.target.value.substr(0, 60)})
  }

  handleSearch(event) {
    event.preventDefault();

    const search = this.state.search;

    // Prevent empty form submission
    if (!search) { return; }

    this.props.search(search);
  }

  render() {
    return (
      <div id="searchBox" className="container">

          <form className="input-group input-group-lg col-lg-7 col-sm-9 col-xs-12 center"  onSubmit={this.handleSearch.bind(this)}>
            <input type="text" onChange={this.updateSearch.bind(this)} value={this.state.search} className="form-control input-lg" placeholder="Ask me anything..." />

            <span className="input-group-btn">
              <input type="submit" className="btn btn-default btn-lg" value="Ask" />
            </span>
          </form>

      </div>
    );
  }
}
