import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import '../../home/home.css';
import { useAuth } from '../../../components/useAuth';

const VehicleMenu = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isAdmin = roles.includes("ADMIN");

  // ===== Estado para Excel y modales =====
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [fileName, setFileName] = useState("");
  const closeBtnRef = useRef(null);

  // Enfocar botón "Cerrar" cuando aparezca un modal (accesibilidad)
  useEffect(() => {
    if (showSuccessModal || showErrorModal) {
      const t = setTimeout(() => closeBtnRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [showSuccessModal, showErrorModal]);

  // ===== Descarga de Excel =====
  const downloadExcelFile = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:8080/api/vehicles/download", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Error al descargar el archivo");

      const blob = await response.blob();

      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const filename = `vehiculos_${year}-${month}-${day}.xlsx`;
      setFileName(filename);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Falló la descarga del Excel:", error);
      setShowErrorModal(true);
    } finally {
      setIsDownloading(false);
    }
  };

  // ===== Módulos =====
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
      icon: "📖",
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
      title: isDownloading ? "Descargando..." : "Excel",
      icon: "📋",
      onClick: downloadExcelFile,
      disabled: isDownloading
    }
  ].filter(Boolean);

  return (
    <div className="homeContainer">
      <main className="modulesContainer">
        {vehicleModules.map((module, index) => (
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

      {/* Modal de éxito */}
      {showSuccessModal && (
        <div
          className="modalOverlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="excel-success-title"
          aria-describedby="excel-success-desc"
        >
          <div className="modalContent success">
            <div className="modalIcon">✅</div>
            <h2 className="modalTitle" id="excel-success-title">
              ¡Excel descargado!
            </h2>
            <p className="modalMessage" id="excel-success-desc">
              El archivo <strong>{fileName}</strong> se descargó correctamente.
              Revisa el apartado de <em>Descargas</em>.
            </p>
            <button
              ref={closeBtnRef}
              onClick={() => setShowSuccessModal(false)}
              className="modalButton"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de error */}
      {showErrorModal && (
        <div
          className="modalOverlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="excel-error-title"
          aria-describedby="excel-error-desc"
        >
          <div className="modalContent error">
            <div className="modalIcon">⚠️</div>
            <h2 className="modalTitle" id="excel-error-title">
              No se pudo descargar
            </h2>
            <p className="modalMessage" id="excel-error-desc">
              Ocurrió un problema al descargar el Excel. Inténtalo de nuevo más
              tarde.
            </p>
            <button
              ref={closeBtnRef}
              onClick={() => setShowErrorModal(false)}
              className="modalButton"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleMenu;
