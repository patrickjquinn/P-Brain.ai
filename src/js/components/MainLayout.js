import React from 'react';

import Footer from "./Footer";
import Header from "./Header";
import SearchBox from "./SearchBox";

export default class MainLayout extends React.Component {
  render() {
    return (
      <div id="wrapper" className="container-fluid">
        <Header />
        <SearchBox />
        <Footer />
      </div>
    );
  }
}
