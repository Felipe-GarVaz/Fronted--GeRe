import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './vehicleYard.css';

const VehicleYard = () => {
  const [vehiclesInYard, setVehiclesInYard] = useState([]);
  const [timers, setTimers] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // Obtener vehículos en patio desde el backend
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get('http://localhost:8080/api/yard/vehicles', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVehiclesInYard(response.data);
      } catch (error) {
        console.error('Error al obtener vehículos del patio:', error);
      }
    };

    fetchVehicles();
  }, []);

  // Calcular y actualizar temporizadores por vehículo
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedTimers = {};

      vehiclesInYard.forEach(vehicle => {
        const elapsed = Date.now() - new Date(vehicle.reportDate).getTime();
        const totalSeconds = Math.floor(elapsed / 1000);

        const days = Math.floor(totalSeconds / (60 * 60 * 24));
        const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;

        let timeString = '';
        if (days > 0) timeString += `${days}d `;
        timeString += `${hours}h ${minutes}m ${seconds}s`;

        updatedTimers[vehicle.id] = timeString;
      });

      setTimers(updatedTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [vehiclesInYard]);

  // Manejar búsqueda por término
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === '') {
      setSuggestions([]);
      return;
    }

    const matched = vehiclesInYard.filter(vehicle =>
      vehicle.economical.toLowerCase().includes(value.toLowerCase()) ||
      vehicle.badge.toLowerCase().includes(value.toLowerCase())
    );

    const uniqueSuggestions = Array.from(new Set(
      matched.map(vehicle => `${vehicle.economical} - ${vehicle.badge}`)
    ));

    setSuggestions(uniqueSuggestions);
  };

  // Manejar selección de sugerencia
  const handleSelectSuggestion = (value) => {
    setSearchTerm(value);
    setSuggestions([]);
  };

  // Limpiar búsqueda
  const handleClearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
  };

  // Filtrar resultados en base al término ingresado
  const filteredVehicles = vehiclesInYard.filter(vehicle => {
    const query = searchTerm.toLowerCase();
    return (
      vehicle.economical.toLowerCase().includes(query) ||
      vehicle.badge.toLowerCase().includes(query) ||
      `${vehicle.economical} - ${vehicle.badge}`.toLowerCase().includes(query)
    );
  });

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

      {/* Grid de vehículos filtrados */}
      <div className="vehicleGrid">
        {filteredVehicles.map(vehicle => (
          <div key={vehicle.id} className="vehicleCard">
            <h3>{vehicle.economical} - {vehicle.badge}</h3>
            <p><strong>Falla:</strong> {vehicle.fail}</p>
            <p><strong>Tiempo en patio:</strong>
              <span className="statusBadge timer">{timers[vehicle.id] || 'Calculando...'}</span>
            </p>          
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehicleYard;
