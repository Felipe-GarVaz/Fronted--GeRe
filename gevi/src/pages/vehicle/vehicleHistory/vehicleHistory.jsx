import React, { useState, useEffect } from "react";
import "./vehicleHistory.css";
import axios from "axios";

/* ========= Hook de cronómetro a nivel de módulo ========= */
function formatElapsed(totalSeconds) {
  const d = Math.floor(totalSeconds / 86400);
  const h = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return d > 0 ? `${d}d ${h}:${m}:${s}` : `${h}:${m}:${s}`;
}

function useElapsedTimer(startKey, startTimeISO) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startMs = Date.parse(startTimeISO);
    if (Number.isNaN(startMs)) return;

    const id = setInterval(() => {
      const now = Date.now();
      setElapsed(Math.max(0, Math.floor((now - startMs) / 1000)));
    }, 1000);

    return () => clearInterval(id);
  }, [startKey, startTimeISO]);

  return formatElapsed(elapsed);
}

/* ===================== Componente principal ===================== */
const VehicleHistory = () => {
  // ===== Estados =====
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredReports, setFilteredReports] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [allSuggestions, setAllSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ===== Obtener sugerencias al iniciar =====
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "/api/reports/history/suggestions",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAllSuggestions(response.data || []);
      } catch (error) {
        console.error("Error al cargar sugerencias:", error);
      }
    };

    fetchSuggestions();
  }, []);

  // ===== Filtrar sugerencias =====
  useEffect(() => {
    if (searchTerm?.trim()) {
      const q = searchTerm.toLowerCase();
      setSuggestions(allSuggestions.filter((s) => s.toLowerCase().includes(q)));
    } else {
      setSuggestions([]);
    }
  }, [searchTerm, allSuggestions]);

  // ===== Lógica de búsqueda (reutilizable) =====
  const performSearch = async (text) => {
    if (!text?.trim()) return;

    setIsLoading(true);
    setSuggestions([]);
    try {
      const token = localStorage.getItem("token");
      const [econ] = text.split(" - ");
      const search = (econ ?? text).trim();

      const response = await axios.get(
        `/api/reports/history?search=${encodeURIComponent(search)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = Array.isArray(response.data) ? response.data : [];

      // Normaliza fecha/hora
      const normalizeDate = (r) => {
        let hour = r.hour;
        if (!hour) return null;
        if (hour.length === 5) hour += ":00"; // 16:30 → 16:30:00
        return new Date(`${r.date}T${hour}`);
      };

      // Detecta el último por vehículo según fecha/hora válidas
      const lastByVehicle = {};
      for (const r of data) {
        const when = new Date(`${r.date}T${r.hour?.length === 5 ? r.hour + ":00" : r.hour}`);
        if (isNaN(when)) continue; // evita Invalid Date
        const key = r.economical?.trim().toUpperCase(); // evita diferencias por espacios o mayúsculas
        const prev = lastByVehicle[key];
        if (!prev || when > new Date(`${prev.date}T${prev.hour}`)) {
          lastByVehicle[key] = { ...r, when };
        }
      }

      // Enriquecer y ordenar
      const enriched = data
        .map((r) => {
          const isLatest = r.id === lastByVehicle[r.economical]?.id;
          let formattedElapsedTime = null;
          if (!isLatest && r.timeElapsed != null) {
            formattedElapsedTime = formatElapsed(Number(r.timeElapsed) || 0);
          }
          return { ...r, isLatest, formattedElapsedTime };
        })
        .sort((a, b) => normalizeDate(b) - normalizeDate(a));

      setFilteredReports(enriched);
    } catch (error) {
      console.error("Error al obtener historial de reportes:", error);
      setFilteredReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Handlers =====
  const handleSelectSuggestion = (text) => {
    setSearchTerm(text);
    performSearch(text);
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      } else {
        performSearch(searchTerm);
      }
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setSuggestions([]);
    setFilteredReports([]);
  };

  // ===== Renderizado =====
  return (
    <div className="reportHistoryContainer">
      <h1>Historial de reportes de vehículos</h1>

      {/* Sección de búsqueda */}
      <div className="searchSection">
        <div className="searchBox">
          <label className="searchLabel">Buscar vehículo</label>
          <div className="searchInputGroup">
            <div className="searchInputContainer">
              <input
                type="text"
                className="searchInput"
                placeholder="Buscar por número económico o placa"
                value={searchTerm.toLocaleUpperCase()}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(() => setSuggestions([]), 120)}
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <ul className="suggestionsList">
                  {suggestions.map((item) => (
                    <li
                      key={item}
                      className="suggestionItem"
                      onMouseDown={() => handleSelectSuggestion(item)}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button className="clearBtn" onClick={handleClear} disabled={isLoading}>
              {isLoading ? "Buscando..." : "Limpiar"}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de reportes */}
      <div className="reportsList">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))
        ) : searchTerm ? (
          <div className="noReports">
            {isLoading
              ? "Buscando reportes..."
              : `No se encontraron reportes para "${searchTerm}"`}
          </div>
        ) : (
          <div className="noReports">
            Ingrese un número económico o placa para buscar reportes
          </div>
        )}
      </div>
    </div>
  );
};

/* ============ Subcomponente: tarjeta de reporte ============ */
const ReportCard = ({ report }) => {
  const timer = useElapsedTimer(
    `${report.economical}-${report.id}`,
    `${report.date}T${report.hour?.length === 5 ? report.hour + ":00" : report.hour}`
  );

  const mileageStr =
    report?.mileage != null && !Number.isNaN(Number(report.mileage))
      ? Number(report.mileage).toLocaleString()
      : "-";

  const locationText =
    report.locationUnavailable ?? report.location ?? report.localitation ?? null;

  const showLocation =
    (report.newState?.toUpperCase?.() === "INDISPONIBLE") && !!locationText;

  const failText = report.failType || report.motivo || null;

  return (
    <div className="reportCard">
      <div className="reportHeader">
        <span className="vehicleInfo">
          {report.economical} - {report.badge}
        </span>
        <span className="reportDate">
          {report.date} | {report.hour}
        </span>
      </div>

      <div className="statusChange">
        <span
          className={`statusBadge oldNew ${String(report.previousState || "")
            .toLowerCase()
            .replace(/\s+/g, "_")}`}
        >
          {report.previousState}
        </span>
        <span className="arrow">→</span>
        <span
          className={`statusBadge oldNew ${String(report.newState || "")
            .toLowerCase()
            .replace(/\s+/g, "_")}`}
        >
          {report.newState}
        </span>
      </div>

      <div className="detailRow">
        <strong>Kilometraje:</strong> <span>{mileageStr} km</span>
      </div>

      {showLocation && (
        <div className="detailRow">
          <strong>Ubicación:</strong> <span>{locationText}</span>
        </div>
      )}

      {failText && (
        <div className="detailRow">
          <strong>Falla:</strong> <span>{failText}</span>
        </div>
      )}

      {(report.isLatest && report.newState === "INDISPONIBLE") || report.formattedElapsedTime ? (
        <div className="detailRow">
          <strong>Tiempo transcurrido:</strong>{" "}
          <span className="statusBadge timer">
            {report.isLatest && report.newState === "INDISPONIBLE"
              ? timer
              : report.formattedElapsedTime}
          </span>
        </div>
      ) : null}

      <div className="reportedBy">
        Reportado por: {report.reportedBy}{" "}
        <span className="rpe">({report.rpe})</span>
      </div>
    </div>
  );
};

export default VehicleHistory;
