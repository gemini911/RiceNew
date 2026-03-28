import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Layout.css";

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="layout-container">
      <header className="layout-header">
        {/* Header content will go here */}
      </header>
      <main className="layout-content">{children}</main>
      <footer className="layout-footer">
        {/* Navigation will go here */}
        <nav>
          <ul>
            <li className={location.pathname === "/" ? "active" : ""}>
              <Link to="/">
                <span className="nav-icon">&#9733;</span> {/* Star icon */}
                得分
              </Link>
            </li>
            <li className={location.pathname === "/consume" ? "active" : ""}>
              <Link to="/consume">
                <span className="nav-icon">&#9632;</span> {/* Square icon */}
                消耗
              </Link>
            </li>
            <li className={location.pathname === "/record" ? "active" : ""}>
              <Link to="/record">
                <span className="nav-icon">&#9776;</span> {/* Hamburger icon */}
                记录
              </Link>
            </li>
          </ul>
        </nav>
      </footer>
    </div>
  );
};

export default Layout;
