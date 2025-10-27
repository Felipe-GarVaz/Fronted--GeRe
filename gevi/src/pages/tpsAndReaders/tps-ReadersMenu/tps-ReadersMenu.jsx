import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../home/home.css";
import { useAuth } from "../../../components/useAuth";

const TpsReadersMenu = () => {
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
      // Le damos un tic para asegurar que el botón exista en el DOM
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
      const response = await fetch("/api/device/export", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Error al descargar el archivo");

      const blob = await response.blob();

      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const filename = `dispositivos_${year}-${month}-${day}.xlsx`;
      setFileName(filename);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Mostrar modal de éxito
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Falló la descarga del Excel:", err);
      setShowErrorModal(true);
    } finally {
      setIsDownloading(false);
    }
  };

  // ===== Lista de módulos =====
  const availableModules = [
    isAdmin && {
      title: "Agregar Dispositivo",
      icon: "➕",
      onClick: () => navigate("/agregar-dispositivo"),
    },
    isAdmin && {
      title: "Eliminar Dispositivo",
      icon: "❌",
      onClick: () => navigate("/eliminar-dispositivo"),
    },
    {
      title: "Dispositivos Registrados",
      icon: "📖",
      onClick: () => navigate("/tps-lectores-registrados"),
    },
    {
      title: "Reportar Dispositivo",
      icon: "📝",
      onClick: () => navigate("/reportar-tp-lector"),
    },
    {
      title: "Dispositivos Dañados",
      icon: "❗",
      onClick: () => navigate("/tps-lectores-defectuosos"),
    },
    {
      title: isDownloading ? "Descargando..." : "Excel",
      icon: "📋",
      onClick: downloadExcelFile,
      disabled: isDownloading,
    },
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
            <div className="moduleIcon" aria-hidden="true">
              {module.icon}
            </div>
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

export default TpsReadersMenu;
