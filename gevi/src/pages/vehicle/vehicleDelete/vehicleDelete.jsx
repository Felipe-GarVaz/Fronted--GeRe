// src/components/DeleteVehicle.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./vehicleDelete.css";

const API_BASE = "http://localhost:8080/api";

const DeleteVehicle = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [activeIndex, setActiveIndex] = useState(-1); // navegación con teclado
    const [vehicle, setVehicle] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const hasSelectedSuggestion = useRef(false);
    const listboxRef = useRef(null);

    // ===== Buscar sugerencias por económico O placa (con debounce + cancelación)
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
            setActiveIndex(-1);
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                setIsSearching(true);
                const token = localStorage.getItem("token");
                const res = await axios.get(
                    `${API_BASE}/vehicles/search?query=${encodeURIComponent(q)}`,
                    { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
                );

                const data = Array.isArray(res.data) ? res.data : [];
                setSuggestions(data);
                setActiveIndex(data.length ? 0 : -1);

                // Autoselección si hay coincidencia exacta por económico o placa
                const lower = q.toLowerCase();
                const exact = data.find(
                    (v) =>
                        v.economical?.toLowerCase() === lower ||
                        v.badge?.toLowerCase() === lower
                );
                setVehicle(exact || null);
            } catch (err) {
                if (controller.signal.aborted) return;
                console.error("Error al buscar vehículos:", err);
                setSuggestions([]);
                setVehicle(null);
                setActiveIndex(-1);
            } finally {
                setIsSearching(false);
            }
        }, 250);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [searchTerm]);

    const handleSelectSuggestion = (v) => {
        hasSelectedSuggestion.current = true;
        setSearchTerm(`${v.economical} - ${v.badge}`);
        setVehicle(v);
        setSuggestions([]);
        setActiveIndex(-1);
        setErrorMsg("");
    };

    const clearAll = () => {
        setSearchTerm("");
        setSuggestions([]);
        setVehicle(null);
        setActiveIndex(-1);
        setErrorMsg("");
        setShowConfirm(false);
    };

    const handleDelete = async () => {
        if (!vehicle?.economical) return;
        setIsLoading(true);
        setErrorMsg("");
        try {
            const token = localStorage.getItem("token");
            await axios.delete(
                `${API_BASE}/vehicles/economical/${encodeURIComponent(vehicle.economical)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowConfirm(false);
            // Flag para modal de éxito
            setVehicle((prev) => ({ ...prev, __deleted: true }));
        } catch (err) {
            console.error("No se pudo eliminar:", err);
            const status = err?.response?.status;
            const serverMsg =
                err?.response?.data?.message ||
                (typeof err?.response?.data === "string" ? err.response.data : null);

            let friendly = "No se pudo eliminar el vehículo. Intente de nuevo.";
            if (status === 404) friendly = "El vehículo no existe o ya fue eliminado.";
            if (status === 409) friendly = "No se puede eliminar porque tiene registros relacionados.";

            setErrorMsg(serverMsg || friendly);
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

    const handleKeyDown = (e) => {
        if (!suggestions.length) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((idx) => (idx + 1) % suggestions.length);
            scrollActiveIntoView();
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((idx) => (idx - 1 + suggestions.length) % suggestions.length);
            scrollActiveIntoView();
        } else if (e.key === "Enter") {
            // Si hay sugerencias, seleccionar la activa
            if (activeIndex >= 0) {
                e.preventDefault();
                handleSelectSuggestion(suggestions[activeIndex]);
            }
        } else if (e.key === "Escape") {
            setSuggestions([]);
            setActiveIndex(-1);
        }
    };

    const scrollActiveIntoView = () => {
        requestAnimationFrame(() => {
            const list = listboxRef.current;
            if (!list) return;
            const el = list.querySelector('[data-active="true"]');
            if (el && typeof el.scrollIntoView === "function") {
                el.scrollIntoView({ block: "nearest" });
            }
        });
    };

    return (
        <div className="deleteContainer">
            <h1>Eliminar Vehículo</h1>

            <form className="reportForm" onSubmit={handleSubmitOrEnter}>
                {/* Input combinado: económico o placa */}
                <div className="formGroup searchContainer">
                    <label>Buscar vehículo</label>
                    <input
                        type="text"
                        placeholder="Buscar por número económico o placa"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setErrorMsg("");
                        }}
                        onKeyDown={handleKeyDown}
                        onBlur={() => setTimeout(() => setSuggestions([]), 120)}
                        autoComplete="off"
                        required
                    />

                    {suggestions.length > 0 && (
                        <ul
                            id="vehicle-suggestions"
                            className="suggestionsList"
                            role="listbox"
                            ref={listboxRef}
                        >
                            {suggestions.map((v, i) => {
                                const id = v.id ?? `${v.economical}-${v.badge}`;
                                const isActive = i === activeIndex;
                                return (
                                    <li
                                        key={id}
                                        role="option"
                                        aria-selected={isActive}
                                        data-active={isActive ? "true" : "false"}
                                        className={`suggestionItem ${isActive ? "active" : ""}`}
                                        // onMouseDown evita que el blur del input cancele el click
                                        onMouseDown={() => handleSelectSuggestion(v)}
                                    >
                                        {v.economical} - {v.badge}
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    <div className="helpRow">
                        {isSearching && <span className="hint">Buscando…</span>}
                        {errorMsg && <div className="error">{errorMsg}</div>}
                    </div>
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
                <div className="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
                    <div className="modalContent">
                        <div className="modalIcon">🗑️</div>
                        <h2 className="modalTitle" id="confirm-title">Confirmar eliminación</h2>
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
                <div className="modalOverlay" role="dialog" aria-modal="true">
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
