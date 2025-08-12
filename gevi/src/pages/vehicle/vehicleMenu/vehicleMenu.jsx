import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../home/home.css';
import { useAuth } from '../../../components/useAuth'; 

const VehicleMenu = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isAdmin = roles.includes("ADMIN");

  const downloadExcelFile = () => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:8080/api/vehicles/download", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) throw new Error("Error al descargar el archivo");
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const filename = `vehiculos_${year}-${month}-${day}.xlsx`;

        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(error => {
        console.error("Falló la descarga del Excel:", error);
      });
  };

  const vehicleModules = [
    isAdmin && {
      title: "Agregar Vehículo",
      icon: "➕",
      onClick: () => navigate("/agregar-vehiculo")
    },
    isAdmin && {
      title: "Eliminar Vehículo",
      icon: "❌",
      onClick: () => navigate("/eliminar-vehiculo")
    },
    {
      title: "Vehículos Registrados",
      icon: "🚗",
      onClick: () => navigate("/vehiculos-registrados")
    },
    {
      title: "Reportar Vehículo",
      icon: "📝",
      onClick: () => navigate("/reportar")
    },
    {
      title: "Historial de Vehículo",
      icon: "📅",
      onClick: () => navigate("/historial")
    },
    {
      title: "Taller",
      icon: "🔩",
      onClick: () => navigate("/taller")
    },
    {
      title: "Patio",
      icon: "🛣️",
      onClick: () => navigate("/patio")
    },
    {
      title: "Excel",
      icon: "📋",
      onClick: () => downloadExcelFile()
    }
  ].filter(Boolean); 

  return (
    <div className="homeContainer">
      <main className="modulesContainer">
        {vehicleModules.map((module, index) => (
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

export default VehicleMenu;
