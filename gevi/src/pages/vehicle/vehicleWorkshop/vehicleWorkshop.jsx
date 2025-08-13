import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './vehicleWorkshop.css';

const WorkshopVehicle = () => {
  // ===== Estados =====
  const [vehicles, setVehicles] = useState([]);
  const [timers, setTimers] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // ===== Obtener vehículos en taller =====
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get('http://localhost:8080/api/workshop/vehicles', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVehicles(response.data);
      } catch (error) {
        console.error('Error al obtener vehículos del taller:', error);
      }
    };

    fetchVehicles();
  }, []);

  // ===== Cronómetro dinámico por vehículo =====
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedTimers = {};

      vehicles.forEach(vehicle => {
        const secondsElapsed = Math.floor((Date.now() - new Date(vehicle.reportDate).getTime()) / 1000);

        const days = Math.floor(secondsElapsed / 86400);
        const hours = Math.floor((secondsElapsed % 86400) / 3600);
        const minutes = Math.floor((secondsElapsed % 3600) / 60);
        const seconds = secondsElapsed % 60;

        const timeFormatted = `${days > 0 ? `${days}d ` : ''}${hours}h ${minutes}m ${seconds}s`;
        updatedTimers[vehicle.id] = timeFormatted;
      });

      setTimers(updatedTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [vehicles]);

  // ===== Búsqueda y sugerencias =====
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const filtered = vehicles.filter(vehicle =>
      vehicle.economical.toLowerCase().includes(value.toLowerCase()) ||
      vehicle.badge.toLowerCase().includes(value.toLowerCase())
    );

    const unique = Array.from(new Set(filtered.map(v => `${v.economical} - ${v.badge}`)));
    setSuggestions(unique);
  };

  const handleSelectSuggestion = (text) => {
    setSearchTerm(text);
    setSuggestions([]);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
  };

  // ===== Filtro de vehículos según búsqueda =====
  const filteredVehicles = vehicles.filter(vehicle => {
    const query = searchTerm.toLowerCase();
    return (
      vehicle.economical.toLowerCase().includes(query) ||
      vehicle.badge.toLowerCase().includes(query) ||
      `${vehicle.economical} - ${vehicle.badge}`.toLowerCase().includes(query)
    );
  });

  // ===== Renderizado =====
  return (
    <div className="workshopContainer">
      <h1>Vehículos en Taller</h1>

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
              onBlur={() => setTimeout(() => setSuggestions([]), 150)}
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <ul className="suggestionsList">
                {suggestions.map((item, index) => (
                  <li
                    key={index}
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

      {/* Lista de tarjetas de vehículos */}
      <div className="vehicleGrid">
        {filteredVehicles.map(vehicle => (
          <div key={vehicle.id} className="vehicleCard">
            <h3>{vehicle.economical} - {vehicle.badge}</h3>
            <p><strong>Falla:</strong> {vehicle.fail}</p>
            <p><strong>Tiempo en taller:</strong>{' '}
              <span className="statusBadge timer">
                {timers[vehicle.id] || 'Calculando...'}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkshopVehicle;
