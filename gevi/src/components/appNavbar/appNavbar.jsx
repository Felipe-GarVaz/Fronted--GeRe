import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import cfeLogo from '../../assets/images/cfe-logo.png';
import './appNavbar.css';

const AppNavbar = () => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const nombreGuardado = localStorage.getItem("nombre");

    if (!token) {
      navigate("/login");
    } else {
      setNombre(nombreGuardado || "Usuario");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear(); // Limpia todo
    setShowMenu(false);
    navigate("/login");
  };

  const goToHome = () => {
    navigate('/home');
  };

  return (
    <header className="navbar">
      <div className="logo-container" onClick={goToHome} style={{ cursor: 'pointer' }}>
        <img src={cfeLogo} alt="CFE Logo" className="logo" />
        <span className="app-name"></span>
      </div>

      <div className="user-menu-container">
        <button
          className="user-button"
          onClick={() => setShowMenu(!showMenu)}
        >
          <span className="user-name">{nombre}</span>
          <span className="user-icon">👤</span>
        </button>

        {showMenu && (
          <div className="dropdown-menu">
            <button
              className="menu-item"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AppNavbar;
