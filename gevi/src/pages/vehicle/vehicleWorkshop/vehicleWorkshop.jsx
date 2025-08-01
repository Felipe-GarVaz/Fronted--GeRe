import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './vehicleWorkshop.css';

const WorkshopVehicle = () => {
  const [vehiclesInWorkshop, setVehiclesInWorkshop] = useState([]);
  const [timers, setTimers] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // Obtener vehículos en taller desde el backend
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get('http://localhost:8080/api/workshop/vehicles', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVehiclesInWorkshop(response.data);
      } catch (error) {
        console.error('Error al obtener vehículos del taller:', error);
      }
    };

    fetchVehicles();
  }, []);

  // Calcular y actualizar temporizadores por vehículo
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers = {};

      vehiclesInWorkshop.forEach(vehicle => {
        const diff = Date.now() - new Date(vehicle.reportDate).getTime();
        const totalSeconds = Math.floor(diff / 1000);

        const days = Math.floor(totalSeconds / (60 * 60 * 24));
        const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;

        let timeString = '';
        if (days > 0) timeString += `${days}d `;
        timeString += `${hours}h ${minutes}m ${seconds}s`;

        newTimers[vehicle.id] = timeString;
      });

      setTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [vehiclesInWorkshop]);

  // Manejar cambios en el input de búsqueda
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === '') {
      setSuggestions([]);
      return;
    }

    const matches = vehiclesInWorkshop.filter(vehicle =>
      vehicle.economical.toLowerCase().includes(value.toLowerCase()) ||
      vehicle.badge.toLowerCase().includes(value.toLowerCase())
    );

    const uniqueSuggestions = Array.from(
      new Set(matches.map(vehicle => `${vehicle.economical} - ${vehicle.badge}`))
    );

    setSuggestions(uniqueSuggestions);
  };

  // Selección de sugerencia
  const handleSelectSuggestion = (text) => {
    setSearchTerm(text);
    setSuggestions([]);
  };

  // Limpiar búsqueda
  const handleClearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
  };

  // Filtrar vehículos por término de búsqueda
  const filteredVehicles = vehiclesInWorkshop.filter(vehicle => {
    const query = searchTerm.toLowerCase();
    return (
      vehicle.economical.toLowerCase().includes(query) ||
      vehicle.badge.toLowerCase().includes(query) ||
      `${vehicle.economical} - ${vehicle.badge}`.toLowerCase().includes(query)
    );
  });

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
              placeholder="Ej: CFE-001 o ABC1234"
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

      {/* Lista de vehículos */}
      <div className="vehicleGrid">
        {filteredVehicles.map(vehicle => (
          <div key={vehicle.id} className="vehicleCard">
            <h3>{vehicle.economical} - {vehicle.badge}</h3>
            <p><strong>Falla:</strong> {vehicle.fail}</p>
            <p><strong>Tiempo en taller:</strong>
              <span className="statusBadge timer">{timers[vehicle.id] || 'Calculando...'}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkshopVehicle;
