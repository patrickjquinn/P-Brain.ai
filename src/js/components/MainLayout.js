import React from 'react';

import Footer from "./Footer";
import Header from "./Header";
import SearchBox from "./SearchBox";

export default class MainLayout extends React.Component {
  render() {
    return (
      <div id="wrapper" className="container-fluid">
        <Header title="Personal Assistant" />
        <SearchBox />
        <Footer version="0.1.0" />
      </div>
    );
  }
}
