import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './deviceDamaged.css';

const DamagedDevices = () => {
  // ===== Estados principales =====
  const [damagedDevices, setDamagedDevices] = useState([]);
  const [timers, setTimers] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // ===== Obtener dispositivos defectuosos =====
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get('http://localhost:8080/api/devices/damaged', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDamagedDevices(response.data);
      } catch (error) {
        console.error('Error al obtener dispositivos defectuosos:', error);
      }
    };

    fetchDevices();
  }, []);

  // ===== Cronómetro dinámico =====
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers = {};

      damagedDevices.forEach(device => {
        const timeDiff = Date.now() - new Date(device.reportDate).getTime();
        const totalSeconds = Math.floor(timeDiff / 1000);

        const days = Math.floor(totalSeconds / (60 * 60 * 24));
        const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;

        let formattedTime = '';
        if (days > 0) formattedTime += `${days}d `;
        formattedTime += `${hours}h ${minutes}m ${seconds}s`;

        newTimers[device.serialNumber] = formattedTime;
      });

      setTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [damagedDevices]);

  // ===== Búsqueda por agencia =====
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === '') {
      setSuggestions([]);
      return;
    }

    const matches = damagedDevices.filter(device =>
      (device.workCenter || '').toLowerCase().includes(value.toLowerCase())
    );

    const uniqueSuggestions = Array.from(new Set(matches.map(device => device.workCenter)));
    setSuggestions(uniqueSuggestions);
  };

  const handleSelectSuggestion = (text) => {
    setSearchTerm(text);
    setSuggestions([]);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
  };

  // ===== Filtrado =====
  const filteredDevices = damagedDevices.filter(device =>
    (device.workCenter || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ===== Formateo del tipo de dispositivo =====
  const formatDeviceType = (type) => {
    if (!type) return '';
    return type
      .toUpperCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // ===== Renderizado =====
  return (
    <div className="damagedDeviceContainer">
      <h1>Dispositivos Defectuosos</h1>

      {/* Búsqueda por agencia */}
      <div className="searchBox">
        <label className="searchLabel">Buscar por agencia:</label>
        <div className="searchInputGroup">
          <div className="searchInputContainer">
            <input
              type="text"
              className="searchInput"
              placeholder="Ej: OCCIDENTE"
              value={searchTerm}
              onChange={handleSearchChange}
              onBlur={() => setTimeout(() => setSuggestions([]), 150)}
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <ul className="suggestionsList">
                {suggestions.map(item => (
                  <li
                    key={item}
                    className="suggestionItem"
                    onClick={() => handleSelectSuggestion(item)}
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

      {/* Lista de tarjetas de dispositivos */}
      <div className="deviceGrid">
        {filteredDevices.map(device => (
          <div key={device.serialNumber} className="deviceCard">
            <h3>
              {formatDeviceType(device.deviceType)} - {device.serialNumber}
            </h3>
            <p><strong>Centro de trabajo:</strong> {device.workCenter}</p>
            <p><strong>Falla:</strong> {device.failType}</p>
            <p><strong>Tiempo transcurrido:</strong>{' '}
              <span className="statusBadge timer">
                {timers[device.serialNumber] || 'Calculando...'}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DamagedDevices;
