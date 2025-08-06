import React from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';

const Home = () => {
  const navigate = useNavigate();

  // ===== Módulos disponibles ===== 
  const availableModules = [
    {
      title: "Vehículos",         
      icon: "🚙",                 
      onClick: () => navigate("/vehiculos-menu")
    },
    {
      title: "TP'S y Lectores",
      icon: "📇📡",
      onClick: () => navigate("/tps-lectores-menu")
    }
  ];

  // ===== Renderizado =====
  return (
    <div className="homeContainer">
      <main className="modulesContainer">
        {availableModules.map((module, index) => (
          <div
            key={index}
            className="moduleCard"
            onClick={module.onClick}
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
