// src/components/DeleteVehicle.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./vehicleDelete.css"; // reutilizamos el mismo estilo

const API_BASE = "http://localhost:8080/api";

const DeleteVehicle = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [vehicle, setVehicle] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const hasSelectedSuggestion = useRef(false);

    // Buscar sugerencias por económico O placa (mismo patrón de VehicleReport.jsx)
    useEffect(() => {
        if (hasSelectedSuggestion.current) {
            hasSelectedSuggestion.current = false;
            return;
        }

        const q = searchTerm.trim();
        if (!q) {
            setSuggestions([]);
            setVehicle(null);
            setErrorMsg("");
            return;
        }

        const fetchSuggestions = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(
                    `${API_BASE}/vehicles/search?query=${encodeURIComponent(q)}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const data = Array.isArray(res.data) ? res.data : [];
                setSuggestions(data);

                // Si hay coincidencia exacta por economico o placa, preselecciona
                const lower = q.toLowerCase();
                const exact = data.find(
                    (v) =>
                        v.economical?.toLowerCase() === lower ||
                        v.badge?.toLowerCase() === lower
                );
                if (exact) {
                    setVehicle(exact);
                } else {
                    setVehicle(null);
                }
            } catch (err) {
                console.error("Error al buscar vehículos:", err);
                setSuggestions([]);
                setVehicle(null);
            }
        };

        fetchSuggestions();
    }, [searchTerm]);

    const handleSelectSuggestion = (v) => {
        hasSelectedSuggestion.current = true;
        setSearchTerm(`${v.economical} - ${v.badge}`);
        setVehicle(v);
        setSuggestions([]);
        setErrorMsg("");
    };

    const clearAll = () => {
        setSearchTerm("");
        setSuggestions([]);
        setVehicle(null);
        setErrorMsg("");
        setShowConfirm(false);
    };

    const handleDelete = async () => {
        if (!vehicle?.economical) return;
        setIsLoading(true);
        setErrorMsg("");
        try {
            const token = localStorage.getItem("token");
            // Elimina por número económico
            await axios.delete(
                `${API_BASE}/vehicles/economical/${encodeURIComponent(vehicle.economical)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowConfirm(false);
            // Modal de éxito (reutilizamos estilos de modal)
            setVehicle((prev) => ({ ...prev, __deleted: true }));
        } catch (err) {
            console.error("No se pudo eliminar:", err);
            setErrorMsg(
                err?.response?.data?.message ||
                "No se pudo eliminar el vehículo. Intente de nuevo."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitOrEnter = (e) => {
        e.preventDefault();
        if (!vehicle) {
            setErrorMsg("Selecciona un vehículo de la lista o escribe un valor válido.");
            return;
        }
        setShowConfirm(true);
    };

    return (
        <div className="deleteContainer">
            <h1>Eliminar Vehículo</h1>

            <form className="reportForm" onSubmit={handleSubmitOrEnter}>
                {/* Input combinado: económico o placa */}
                <div className="formGroup searchContainer">
                    <label>Buscar por número económico o placa:</label>
                    <input
                        type="text"
                        placeholder="Ej. CFE-001 o ABC1234"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setErrorMsg("");
                        }}
                        autoComplete="off"
                    />
                    {suggestions.length > 0 && (
                        <ul className="suggestionsList">
                            {suggestions.map((v, i) => (
                                <li
                                    key={`${v.id || v.economical}-${i}`}
                                    className="suggestionItem"
                                    onClick={() => handleSelectSuggestion(v)}
                                >
                                    {v.economical} - {v.badge}
                                </li>
                            ))}
                        </ul>
                    )}
                    {errorMsg && <div className="error">{errorMsg}</div>}
                </div>

                {/* Vista previa */}
                {vehicle && !vehicle.__deleted && (
                    <div className="vehicleInfoBox">
                        <p><strong>Económico:</strong> {vehicle.economical}</p>
                        <p><strong>Placa:</strong> {vehicle.badge || "—"}</p>
                        <p><strong>Estado:</strong> {vehicle.status || "—"}</p>
                        <p><strong>Kilometraje:</strong> {Number(vehicle.mileage || 0).toLocaleString()} km</p>
                        {(vehicle.brand || vehicle.model) && (
                            <p><strong>Marca/Modelo:</strong> {(vehicle.brand || "—") + " " + (vehicle.model || "")}</p>
                        )}
                    </div>
                )}

                {/* Botón eliminar */}
                <button
                    type="submit"
                    className="submitBtn"
                    disabled={!vehicle || vehicle.__deleted || isLoading}
                >
                    {isLoading ? "Eliminando..." : "Eliminar vehículo"}
                </button>
            </form>

            {/* Modal de confirmación */}
            {showConfirm && vehicle && !vehicle.__deleted && (
                <div className="modalOverlay">
                    <div className="modalContent">
                        <div className="modalIcon">🗑️</div>
                        <h2 className="modalTitle">Confirmar eliminación</h2>
                        <p className="modalMessage">
                            ¿Seguro que deseas eliminar el vehículo <strong>{vehicle.economical}</strong>
                            {vehicle.badge ? ` (placa ${vehicle.badge})` : ""}? Esta acción no se puede deshacer.
                        </p>
                        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                            <button className="modalButton" onClick={() => setShowConfirm(false)}>
                                Cancelar
                            </button>
                            <button
                                className="modalButton"
                                onClick={handleDelete}
                                disabled={isLoading}
                                style={{ backgroundColor: "#c62828" }}
                            >
                                {isLoading ? "Eliminando..." : "Eliminar definitivamente"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de éxito */}
            {vehicle?.__deleted && (
                <div className="modalOverlay">
                    <div className="modalContent success">
                        <div className="modalIcon">✅</div>
                        <h2 className="modalTitle">Vehículo eliminado</h2>
                        <p className="modalMessage">
                            El vehículo <strong>{vehicle.economical}</strong> se eliminó correctamente.
                        </p>
                        <button className="modalButton" onClick={clearAll}>
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeleteVehicle;
