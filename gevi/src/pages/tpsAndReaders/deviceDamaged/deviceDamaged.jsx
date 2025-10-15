import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './deviceDamaged.css';

const DamagedDevices = () => {
  // ===== Estados principales =====
  const [damagedDevices, setDamagedDevices] = useState([]);
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

  // Toma la mejor fecha de reporte disponible desde el backend
  const getStartMs = (d) => {
    // 1) reportDate + reportHour
    if (d.reportDate && d.reportHour) {
      const t = Date.parse(`${d.reportDate}T${d.reportHour}`);
      if (!Number.isNaN(t)) return t;
    }
    // 2) reportDate (ISO o parseable)
    if (d.reportDate) {
      const t = Date.parse(d.reportDate);
      if (!Number.isNaN(t)) return t;
    }
    // 3) date + hour
    if (d.date && d.hour) {
      const t = Date.parse(`${d.date}T${d.hour}`);
      if (!Number.isNaN(t)) return t;
    }
    // 4) reportedAt / reportTimestamp
    if (d.reportedAt) {
      const t = Date.parse(d.reportedAt);
      if (!Number.isNaN(t)) return t;
    }
    if (typeof d.reportTimestamp === 'number') return d.reportTimestamp;

    return Date.now();
  };

  const getAgency = (d) => {
    // String directo o nombre en objeto
    if (typeof d.workCenter === 'string') return d.workCenter;
    if (d.workCenter?.name) return d.workCenter.name;
    if (d.workCenter?.nombre) return d.workCenter.nombre;
    if (d.agency) return d.agency;
    return '';
  };

  const getFailText = (d) => d.failType || d.personalizedFailure || d.fail || '—';

  const formatDeviceType = (type) => {
    if (!type) return '';
    return type
      .toUpperCase()
      .split('_')
      .map((w) => (w.length <= 2 ? w : w.charAt(0) + w.slice(1).toLowerCase()))
      .join(' ');
  };

  // ===== Fetch dispositivos defectuosos =====
  const fetchDevices = async () => {
    try {
      setFetchError('');
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:8080/api/devices/damaged', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDamagedDevices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al obtener dispositivos defectuosos:', error);
      setFetchError('No se pudieron cargar los dispositivos.');
      setDamagedDevices([]);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // Auto-refresh cada 30s
  useEffect(() => {
    const id = setInterval(fetchDevices, 30000);
    return () => clearInterval(id);
  }, []);

  // ===== Cronómetro dinámico =====
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newTimers = {};
      for (const d of damagedDevices) {
        const start = getStartMs(d);
        const totalSeconds = Math.max(0, Math.floor((now - start) / 1000));
        newTimers[d.serialNumber] = formatElapsed(totalSeconds);
      }
      setTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [damagedDevices]);

  // ===== Búsqueda por agencia =====
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const q = value.toLowerCase();
    const matches = damagedDevices.filter((d) => getAgency(d).toLowerCase().includes(q));
    const unique = Array.from(new Set(matches.map((d) => getAgency(d)).filter(Boolean)));
    setSuggestions(unique);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[0]);
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

  // ===== Filtrado + orden por más tiempo transcurrido =====
  const filteredDevices = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const base = !q
      ? damagedDevices
      : damagedDevices.filter((d) => getAgency(d).toLowerCase().includes(q));
    return [...base].sort((a, b) => getStartMs(a) - getStartMs(b));
  }, [damagedDevices, searchTerm]);

  // ===== Renderizado =====
  return (
    <div className="damagedDeviceContainer">
      <h1>Dispositivos dañados</h1>

      {/* Búsqueda por agencia */}
      <div className="searchBox">
        <label className="searchLabel">Buscar por centro de trabajo:</label>
        <div className="searchInputGroup">
          <div className="searchInputContainer">
            <input
              type="text"
              className="searchInput"
              placeholder="Ej: TEZIUTLAN"
              value={searchTerm.toUpperCase()}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onBlur={() => setTimeout(() => setSuggestions([]), 150)}
              autoComplete="off"
              aria-label="Buscar por agencia"
            />
            {suggestions.length > 0 && (
              <ul className="suggestionsList" role="listbox">
                {suggestions.map((item) => (
                  <li
                    key={item}
                    role="option"
                    aria-selected="false"
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

      {/* Lista de tarjetas de dispositivos */}
      <div className="deviceGrid">
        {filteredDevices.length > 0 ? (
          filteredDevices.map((d) => {
            const agency = getAgency(d) || '—';
            const label = `${formatDeviceType(d.deviceType)} - ${d.serialNumber}`;
            return (
              <div key={d.serialNumber} className="deviceCard" aria-label={`Dispositivo ${label}`}>
                <h3>{label}</h3>
                <p><strong>Centro de trabajo:</strong> {agency}</p>
                <p><strong>Falla:</strong> {getFailText(d)}</p>
                <p>
                  <strong>Tiempo transcurrido:</strong>{' '}
                  <span className="statusBadge timer">
                    {timers[d.serialNumber] || 'Calculando...'}
                  </span>
                </p>
              </div>
            );
          })
        ) : (
          <div className="noReports">
            {searchTerm
              ? `No hay dispositivos que coincidan con "${searchTerm}"`
              : 'No hay dispositivos defectuosos'}
          </div>
        )}
      </div>
    </div>
  );
};

export default DamagedDevices;
