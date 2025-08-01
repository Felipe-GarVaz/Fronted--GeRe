import React from "react";
import { useNavigate } from "react-router-dom";
import '../../home/home.css';

const TpsReadersMenu = () => {
  const navigate = useNavigate();

  const modules = [
    {
      title: "TP'S y Lectores Registrados",
      icon: "📟",
      action: () => navigate("/tps-lectores-registrados"),
    },
    {
      title: "Reportar TP o Lector",
      icon: "📝",
      action: () => navigate("/reportar-tp-lector"),
    },
    {
      title: "TPS y Lectores Dañados",
      icon: "❗",
      action: () => navigate("/tps'lectotres-defectuosos"),
    },
  ];

  return (
    <div className="homeContainer">
      <main className="modulesContainer">
        {modules.map((module, index) => (
          <div
            key={index}
            className="moduleCard"
            onClick={module.action}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                module.action();
              }
            }}
            aria-label={`Ir a ${module.title}`}
          >
            <div className="moduleIcon" aria-hidden="true">
              {module.icon}
            </div>
            <h3 className="moduleTitle">{module.title}</h3>
          </div>
        ))}
      </main>
    </div>
  );
};

export default TpsReadersMenu;
