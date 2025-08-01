// src/components/VehicleHistory.jsx
import React, { useState, useEffect } from "react";
import './vehicleHistory.css';
import axios from "axios";

const VehicleHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredReports, setFilteredReports] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [allSuggestions, setAllSuggestions] = useState([]);

  // Hook que inicia y actualiza el cronómetro
  const useTimer = (startKey, startTime) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
      const start = Date.parse(startTime);
      const interval = setInterval(() => {
        const now = Date.now();
        setElapsed(Math.floor((now - start) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }, [startKey, startTime]);

    const format = (seconds) => {
      const days = Math.floor(seconds / 86400); // 86400 segundos en un día
      const h = String(Math.floor((seconds % 86400) / 3600)).padStart(2, '0');
      const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');

      return days > 0 ? `${days}d ${h}:${m}:${s}` : `${h}:${m}:${s}`;
    }

    return format(elapsed);
  };

  // Buscar todas las sugerencias al montar
  useEffect(() => {
    const fetchAllSuggestions = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:8080/api/reports/history/suggestions", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAllSuggestions(response.data);
      } catch (error) {
        console.error("Error al cargar sugerencias:", error);
      }
    };
    fetchAllSuggestions();
  }, []);

  // Filtrar sugerencias mientras se escribe
  useEffect(() => {
    if (searchTerm) {
      const matches = allSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm, allSuggestions]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectSuggestion = async (text) => {
    setSearchTerm(text);
    setSuggestions([]);

    try {
      const token = localStorage.getItem("token");
      const [econ] = text.split(" - ");
      const response = await axios.get(`http://localhost:8080/api/reports/history?search=${econ.trim()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Detectar el último reporte por vehículo
      const lastByVehicle = {};
      response.data.forEach(r => {
        const key = r.economical;
        const fechaHora = new Date(`${r.date}T${r.hour}`);
        if (!lastByVehicle[key] || fechaHora > new Date(`${lastByVehicle[key].date}T${lastByVehicle[key].hour}`)) {
          lastByVehicle[key] = r;
        }
      });

      const enriched = response.data.map(r => {
        const isLatest = r.id === lastByVehicle[r.economical].id;

        // Si tiene tiempo registrado y no es el más reciente, formatearlo
        let formattedElapsedTime = null;
        if (!isLatest && r.timeElapsed !== null && r.timeElapsed !== undefined) {
          const total = r.timeElapsed;
          const d = Math.floor(total / 86400);
          const h = Math.floor((total % 86400) / 3600).toString().padStart(2, '0');
          const m = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
          const s = Math.floor(total % 60).toString().padStart(2, '0');
          formattedElapsedTime = d > 0 ? `${d}d ${h}:${m}:${s}` : `${h}:${m}:${s}`;
        }

        return {
          ...r,
          isLatest,
          formattedElapsedTime
        };
      });

      setFilteredReports(enriched);
    } catch (error) {
      console.error("Error al obtener historial de reportes:", error);
      setFilteredReports([]);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setSuggestions([]);
    setFilteredReports([]);
  };

  return (
    <div className="reportHistoryContainer">
      <h1>Historial de Reportes de Vehículos</h1>

      {/* Sección de búsqueda */}
      <div className="searchSection">
        <div className="searchBox">
          <label className="searchLabel">Buscar vehículo:</label>
          <div className="searchInputGroup">
            <div className="searchInputContainer">
              <input
                type="text"
                className="searchInput"
                placeholder="Ej: CFE-001 o ABC1234"
                value={searchTerm}
                onChange={handleSearchChange}
                onBlur={() => setTimeout(() => setSuggestions([]), 100)}
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <ul className="suggestionsList">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="suggestionItem"
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button className="clearBtn" onClick={handleClear}>Limpiar</button>
          </div>
        </div>
      </div>

      {/* Lista de reportes */}
      <div className="reportsList">
        {filteredReports.length > 0 ? (
          filteredReports.map(report => (
            <ReportCard key={report.id} report={report} useTimer={useTimer} />
          ))
        ) : searchTerm ? (
          <div className="noReports">No se encontraron reportes para "{searchTerm}"</div>
        ) : (
          <div className="noReports">Ingrese un número económico o placa para buscar reportes</div>
        )}
      </div>
    </div>
  );
};

// Subcomponente por tarjeta de reporte (permite usar hooks como useTimer)
const ReportCard = ({ report, useTimer }) => {
  // ✅ Hook siempre se ejecuta, sin condición
  const timer = useTimer(`${report.economical}-${report.id}`, `${report.date}T${report.hour}`);

  return (
    <div className="reportCard">
      <div className="reportHeader">
        <span className="vehicleInfo">{report.economical} - {report.badge}</span>
        <span className="reportDate">{report.date} | {report.hour}</span>
      </div>

      <div className="statusChange">
        <span className={`statusBadge oldNew ${report.previousState.toLowerCase().replace(/\s+/g, '_')}`}>
          {report.previousState}
        </span>
        <span className="arrow">→</span>
        <span className={`statusBadge oldNew ${report.newState.toLowerCase().replace(/\s+/g, '_')}`}>
          {report.newState}
        </span>
      </div>

      <div className="detailRow">
        <strong>Kilometraje:</strong> <span>{report.mileage.toLocaleString()} km</span>
      </div>

      {report.newState.toLowerCase() === 'indisponible' && report.localitation && (
        <div className="detailRow">
          <strong>Ubicación:</strong> <span>{report.localitation}</span>
        </div>
      )}

      {(report.failType || report.motivo) && (
        <div className="detailRow">
          <strong>Falla:</strong> <span>{report.failType}</span>
        </div>
      )}

      {report.isLatest ? (
        <div className="detailRow">
          <strong>Tiempo transcurrido:</strong>
          <span className="statusBadge timer">{timer}</span>
        </div>
      ) : report.formattedElapsedTime ? (
        <div className="detailRow">
          <strong>Tiempo transcurrido:</strong>
          <span className="statusBadge timer">{report.formattedElapsedTime}</span>
        </div>
      ) : null}


      <div className="reportedBy">
        Reportado por: {report.reportedBy} <span className="rpe">({report.rpe})</span>
      </div>
    </div>
  );
};


export default VehicleHistory;
