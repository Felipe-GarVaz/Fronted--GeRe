import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './vehicleRegistration.css';

const RegisteredVehicles = () => {
    // ===== Estados principales =====
    const [vehicles, setVehicles] = useState([]);
    const [filterOptions, setFilterOptions] = useState({
        workCenter: [],
        process: [],
        status: [],
        property: []
    });

    const [filters, setFilters] = useState({
        workCenter: '',
        proceso: '',
        status: '',
        property: '',
        search: ''
    });

    // ===== Obtener filtros =====
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("http://localhost:8080/api/vehicles/filters", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFilterOptions(response.data);
            } catch (error) {
                console.error("Error al cargar los filtros:", error);
            }
        };
        fetchFilterOptions();
    }, []);

    // ===== Obtener vehículos =====
    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("http://localhost:8080/api/vehicles", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setVehicles(response.data);
            } catch (error) {
                console.error("Error al buscar los vehículos:", error);
            }
        };
        fetchVehicles();
    }, []);

    // ===== Cambiar filtros =====
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setFilters({
            workCenter: '',
            process: '',
            status: '',
            property: '',
            search: ''
        });
    };

    // ===== Filtrar vehículos =====
    const filteredVehicles = vehicles.filter(vehicle => (
        (!filters.workCenter || vehicle.workCenterId.toString() === filters.workCenter) &&
        (!filters.process || vehicle.processId.toString() === filters.process) &&
        (!filters.status || vehicle.status === filters.status) &&
        (!filters.property || vehicle.property === filters.property) &&
        (!filters.search || vehicle.economical.toLowerCase().includes(filters.search.toLowerCase()))
    ));

    const formatStatus = (status) => {
        return status === 'OPERANDO_CON_FALLA' ? 'OPERANDO CON FALLA' : status;
    };

    // ===== Renderizado =====
    return (
        <div className="vehicleListContainer">
            <h1>Vehículos Registrados</h1>

            {/* Filtros */}
            <div className="filtersSection">
                <div className="searchGroup">
                    <label>Buscar por Económico:</label>
                    <input
                        type="number"
                        name="search"
                        placeholder="Ej: 23245"
                        value={filters.search}
                        onChange={handleFilterChange}
                    />
                </div>

                {['workCenter', 'process', 'status', 'property'].map(key => (
                    <div className="filterGroup" key={key}>
                        <label>
                            {key === 'workCenter'
                                ? 'Centro de Trabajo'
                                : key === 'process'
                                    ? 'Proceso'
                                    : key === 'status'
                                        ? 'Estado'
                                        : 'Propiedad'}
                            :</label>
                        <select name={key} value={filters[key]} onChange={handleFilterChange}>
                            <option value="">Todos</option>
                            {filterOptions[key].map(option => (
                                <option key={option.id} value={option.id}>{option.name}</option>
                            ))}
                        </select>
                    </div>
                ))}

                <button onClick={resetFilters} className="resetBtn">
                    Limpiar Filtros
                </button>
            </div>

            {/* Contadores */}
            <div className="vehicleCounters">
                <div className="counterBox Disponible">
                    <strong>Disponible:</strong> {filteredVehicles.filter(v => v.status === 'DISPONIBLE').length}
                </div>
                <div className="counterBox OperandoConFalla">
                    <strong>Operando con falla:</strong> {filteredVehicles.filter(v => v.status === 'OPERANDO_CON_FALLA').length}
                </div>
                <div className="counterBox Indisponible">
                    <strong>Indisponible:</strong> {filteredVehicles.filter(v => v.status === 'INDISPONIBLE').length}
                </div>
                <div className="counterBox Total">
                    <strong>Total vehículos:</strong> {filteredVehicles.length}
                </div>
            </div>

            {/* Tabla de resultados */}
            <div className="tableContainer">
                <table>
                    <thead>
                        <tr>
                            <th>Económico</th>
                            <th>Placa</th>
                            <th>Propiedad</th>
                            <th>Kilometraje</th>
                            <th>Marca</th>
                            <th>Modelo</th>
                            <th>Año</th>
                            <th>Centro</th>
                            <th>Proceso</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVehicles.length > 0 ? (
                            filteredVehicles.map(vehicle => (
                                <tr key={vehicle.id}>
                                    <td>{vehicle.economical}</td>
                                    <td>{vehicle.badge}</td>
                                    <td>{vehicle.property}</td>
                                    <td>{vehicle.mileage}</td>
                                    <td>{vehicle.brand}</td>
                                    <td>{vehicle.model}</td>
                                    <td>{vehicle.year}</td>
                                    <td>{vehicle.workCenterName}</td>
                                    <td>{vehicle.processName}</td>
                                    <td>
                                        <span className={`statusBadge ${vehicle.status.replaceAll('_', '-').toLowerCase()}`}>
                                            {formatStatus(vehicle.status)}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="10" className="noResults">No hay vehículos</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RegisteredVehicles;
