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
    {
      title: "Excel",
      icon: "🧾",
      action: () => {
        const token = localStorage.getItem("token");
        fetch("http://localhost:8080/api/device/download", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
          .then(response => {
            if (!response.ok) {
              throw new Error("Error al descargar el archivo");
            }
            return response.blob();
          })
          .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;

            // Generar nombre con fecha actual
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const filename = `dispositivos_${year}-${month}-${day}.xlsx`;

            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
          })
          .catch(error => {
            console.error("Fallo la descarga del Excel:", error);
          });
      }
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
