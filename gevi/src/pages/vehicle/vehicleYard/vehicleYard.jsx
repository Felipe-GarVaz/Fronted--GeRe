import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './vehicleYard.css';

const VehicleYard = () => {
  // ===== Estados =====
  const [vehicles, setVehicles] = useState([]);
  const [timers, setTimers] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [fetchError, setFetchError] = useState('');

  // ===== Utils =====
  const pad = (n) => String(n).padStart(2, '0');
  const formatElapsed = (secs) => {
    const d = Math.floor(secs / 86400);
    const h = pad(Math.floor((secs % 86400) / 3600));
    const m = pad(Math.floor((secs % 3600) / 60));
    const s = pad(secs % 60);
    return d > 0 ? `${d}d ${h}:${m}:${s}` : `${h}:${m}:${s}`;
  };

  // Fecha/hora de entrada al patio (tolerante a nombres)
  const getStartMs = (v) => {
    // 1) reportDate + reportHour (yyyy-MM-dd + HH:mm:ss)
    if (v.reportDate && v.reportHour) {
      const t = Date.parse(`${v.reportDate}T${v.reportHour}`);
      if (!Number.isNaN(t)) return t;
    }
    // 2) reportDate (ISO o parseable)
    if (v.reportDate) {
      const t = Date.parse(v.reportDate);
      if (!Number.isNaN(t)) return t;
    }
    // 3) date + hour (nombres alternos)
    if (v.date && v.hour) {
      const t = Date.parse(`${v.date}T${v.hour}`);
      if (!Number.isNaN(t)) return t;
    }
    // 4) reportedAt / reportTimestamp
    if (v.reportedAt) {
      const t = Date.parse(v.reportedAt);
      if (!Number.isNaN(t)) return t;
    }
    if (typeof v.reportTimestamp === 'number') return v.reportTimestamp;

    return Date.now();
  };

  const getFailText = (v) => v.fail || v.failType || v.personalizedFailure || '—';

  // ===== Fetch vehículos en patio =====
  const fetchVehicles = async () => {
    try {
      setFetchError('');
      const token = localStorage.getItem("token");
      const { data } = await axios.get('http://localhost:8080/api/yard/vehicles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al obtener vehículos del patio:', error);
      setFetchError('No se pudieron cargar los vehículos.');
      setVehicles([]);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Auto-refresh cada 30s
  useEffect(() => {
    const id = setInterval(fetchVehicles, 30000);
    return () => clearInterval(id);
  }, []);

  // ===== Cronómetro dinámico por vehículo =====
  useEffect(() => {
    const interval = setInterval(() => {
      const updated = {};
      const now = Date.now();
      for (const v of vehicles) {
        const start = getStartMs(v);
        const secs = Math.max(0, Math.floor((now - start) / 1000));
        updated[v.id] = formatElapsed(secs);
      }
      setTimers(updated);
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles]);

  // ===== Búsqueda y sugerencias =====
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const q = value.toLowerCase();
    const filtered = vehicles.filter(v =>
      v.economical?.toLowerCase().includes(q) ||
      v.badge?.toLowerCase().includes(q)
    );

    const unique = Array.from(new Set(filtered.map(v => `${v.economical} - ${v.badge}`)));
    setSuggestions(unique);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      }
    }
  };

  const handleSelectSuggestion = (text) => {
    setSearchTerm(text);
    setSuggestions([]);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
  };

  // ===== Filtrado + orden =====
  const filteredVehicles = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const base = !q
      ? vehicles
      : vehicles.filter((v) => {
        const tag = `${v.economical} - ${v.badge}`.toLowerCase();
        return (
          v.economical?.toLowerCase().includes(q) ||
          v.badge?.toLowerCase().includes(q) ||
          tag.includes(q)
        );
      });

    // Orden por más tiempo en patio (más antiguos primero)
    return [...base].sort((a, b) => getStartMs(a) - getStartMs(b));
  }, [vehicles, searchTerm]);

  // ===== Renderizado =====
  return (
    <div className="yardContainer">
      <h1>Vehículos en Patio</h1>

      {/* Sección de búsqueda */}
      <div className="searchBox">
        <label className="searchLabel">Buscar vehículo:</label>
        <div className="searchInputGroup">
          <div className="searchInputContainer">
            <input
              type="text"
              className="searchInput"
              placeholder="Buscar por número económico o placa"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onBlur={() => setTimeout(() => setSuggestions([]), 150)}
              autoComplete="off"
              aria-label="Buscar vehículo por económico o placa"
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
          <button className="clearBtn" onClick={handleClearSearch}>Limpiar</button>
        </div>
      </div>

      {fetchError && <div className="error">{fetchError}</div>}

      {/* Lista de tarjetas de vehículos */}
      <div className="vehicleGrid">
        {filteredVehicles.length > 0 ? (
          filteredVehicles.map((v) => {
            const tag = `${v.economical} - ${v.badge}`;
            const timer = timers[v.id] || 'Calculando...';
            const failText = getFailText(v);
            return (
              <div key={v.id} className="vehicleCard" aria-label={`Vehículo ${tag}`}>
                <h3>{tag}</h3>
                <p><strong>Falla:</strong> {failText}</p>
                <p>
                  <strong>Tiempo en patio:</strong>{' '}
                  <span className="statusBadge timer">{timer}</span>
                </p>
              </div>
            );
          })
        ) : (
          <div className="noReports">
            {searchTerm
              ? `No hay vehículos que coincidan con "${searchTerm}"`
              : 'No hay vehículos en patio'}
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleYard;
