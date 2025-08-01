import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../home/home.css';

const VehicleMenu = () => {
  const navigate = useNavigate();

  const modules = [
    {
      title: "Vehículos Registrados",
      icon: "🚗",
      action: () => navigate("/vehiculos-registrados")
    },
    {
      title: "Reportar Vehículo",
      icon: "📝",
      action: () => navigate("/reportar")
    },
    {
      title: "Historial de Vehículo",
      icon: "📊",
      action: () => navigate("/historial")
    },
    {
      title: "Taller",
      icon: "🔩",
      action: () => navigate("/taller")
    },
    {
      title: "Patio",
      icon: "🛣️",
      action: () => navigate("/patio")
    },
    {
      title: "Documentos",
      icon: "🗂️",
      action: () => {
        const token = localStorage.getItem("token");
        fetch("http://localhost:8080/api/vehicles/download", {
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
            const filename = `vehiculos_${year}-${month}-${day}.xlsx`;

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
          >
            <div className="moduleIcon">{module.icon}</div>
            <h3 className="moduleTitle">{module.title}</h3>
          </div>
        ))}
      </main>
    </div>
  );
};

export default VehicleMenu;