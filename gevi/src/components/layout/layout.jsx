import React from 'react';
import AppNavbar from '../appNavbar/appNavbar';
import './layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <AppNavbar />
      <main className="content">
        {children}
      </main>
      <footer className="footer">
        <p>© {new Date().getFullYear()} CFE. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Layout;