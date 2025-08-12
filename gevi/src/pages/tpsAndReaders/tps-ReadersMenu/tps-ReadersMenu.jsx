import React from "react";
import { useNavigate } from "react-router-dom";
import "../../home/home.css";
import { useAuth } from '../../../components/useAuth';

const TpsReadersMenu = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isAdmin = roles.includes("ADMIN");

  // ===== Descarga de Excel =====
  const downloadExcelFile = () => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:8080/api/device/download", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const filename = `dispositivos_${year}-${month}-${day}.xlsx`;

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

  // ===== Lista de módulos =====
  const availableModules = [
    isAdmin && {
      title: "Agregar Dispositivo",
      icon: "➕",
      onClick: () => navigate("/agregar-dispositivo")
    },
    isAdmin && {
      title: "Eliminar Dispositivo",
      icon: "❌",
      onClick: () => navigate("/eliminar-dispositivo")
    },
    {
      title: "TP'S y Lectores Registrados",
      icon: "📟",
      onClick: () => navigate("/tps-lectores-registrados"),
    },
    {
      title: "Reportar TP o Lector",
      icon: "📝",
      onClick: () => navigate("/reportar-tp-lector"),
    },
    {
      title: "TPS y Lectores Dañados",
      icon: "❗",
      onClick: () => navigate("/tps-lectores-defectuosos"),
    },
    {
      title: "Excel",
      icon: "🧾",
      onClick: () => downloadExcelFile(),
    }
  ].filter(Boolean);
  ;

  // ===== Renderizado =====
  return (
    <div className="homeContainer">
      <main className="modulesContainer">
        {availableModules.map((module, index) => (
          <div
            key={index}
            className="moduleCard"
            onClick={module.onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                module.onClick();
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
