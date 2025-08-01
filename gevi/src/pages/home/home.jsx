import React from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';

const Home = () => {
  const navigate = useNavigate();

//LISTA DE MODULOS DISPONIBL EN EL MENU PRINCIPAL
  const modules = [
    {
      title: "Vehiculos",
      icon: "🚙",
      action: () => navigate("/vehiculos-menu") 
    },
    {
      title: "TP'S y Lectores",
      icon: "📇📡",
      action: () => navigate("/tps-lectores-menu")
    }
  ];

  return (
    <div className="homeContainer">
      <main className="modulesContainer">
        {modules.map((module, index) => (
          <div
            key={index}
            className="moduleCard"
            onClick={module.action}
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