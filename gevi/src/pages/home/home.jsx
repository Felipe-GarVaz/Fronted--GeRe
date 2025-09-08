import React from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';
import { useAuth } from './../../components/useAuth';

const Home = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isAdmin = roles.includes("ADMIN");

  // ===== Módulos disponibles ===== 
  const availableModules = [
    {
      title: "Vehículos",
      icon: "🚙",
      onClick: () => navigate("/vehiculos-menu")
    },
    {
      title: "TP'S y Lectores",
      icon: "📱",
      onClick: () => navigate("/tps-lectores-menu")
    },
    isAdmin &&{
      title: "Usuarios",
      icon: "👤",
      onClick: () => navigate("/usuarios-menu")
    }
  ].filter(Boolean);

  // ===== Renderizado =====
  return (
    <div className="homeContainer">
      <main className="modulesContainer">
        {availableModules.map((module, index) => (
          <div
            key={index}
           className={`moduleCard ${module.disabled ? "isDisabled" : ""}`}
            onClick={() => !module.disabled && module.onClick()}
            role="button"
            tabIndex={module.disabled ? -1 : 0}
            onKeyDown={(e) => {
              if (!module.disabled && (e.key === "Enter" || e.key === " ")) {
                module.onClick();
              }
            }}
            aria-label={`Ir a ${module.title}`}
            aria-disabled={module.disabled ? "true" : "false"}
          >
            <div className="moduleIcon">{module.icon}</div>
            <h3 className="moduleTitle">{module.title}</h3>
          </div>
        ))}
      </main>
    </div>
  );
};

export default Home;
