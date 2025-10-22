import React from 'react';
import Header from './common/Header';
import Sidebar from './common/Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;