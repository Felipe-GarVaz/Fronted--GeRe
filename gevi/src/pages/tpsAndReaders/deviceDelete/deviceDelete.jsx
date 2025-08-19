// src/components/DeleteDevice.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./deviceDelete.css";

const API_BASE = "http://localhost:8080/api";
const getType = (x) => x?.type ?? x?.deviceType ?? x?.tipo ?? x?.typeName ?? null;

const DeleteDevice = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [device, setDevice] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const hasSelectedSuggestion = useRef(false);
    const listboxRef = useRef(null);




    // ===== Buscar sugerencias por NÚMERO DE SERIE (debounce + cancelación)
    useEffect(() => {
        if (hasSelectedSuggestion.current) {
            hasSelectedSuggestion.current = false;
            return;
        }

        const q = searchTerm.trim();
        if (!q) {
            setSuggestions([]);
            setDevice(null);
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
                    `${API_BASE}/device/search?query=${encodeURIComponent(q)}`,
                    { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
                );

                const data = Array.isArray(res.data) ? res.data : [];
                setSuggestions(data);
                setActiveIndex(data.length ? 0 : -1);

                // Autoselección si hay coincidencia exacta por serie
                const lower = q.toLowerCase();
                const exact = data.find((d) => d.serialNumber?.toLowerCase() === lower);
                setDevice(exact || null);
            } catch (err) {
                if (controller.signal.aborted) return;
                console.error("Error al buscar dispositivos:", err);
                setSuggestions([]);
                setDevice(null);
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

    const handleSelectSuggestion = (d) => {
        hasSelectedSuggestion.current = true;
        setSearchTerm(`${d.serialNumber}${d.type ? " - " + d.type : ""}`);
        setDevice(d);
        setSuggestions([]);
        setActiveIndex(-1);
        setErrorMsg("");
    };

    const clearAll = () => {
        setSearchTerm("");
        setSuggestions([]);
        setDevice(null);
        setActiveIndex(-1);
        setErrorMsg("");
        setShowConfirm(false);
    };

    const handleDelete = async () => {
        if (!device?.serialNumber) return;
        setIsLoading(true);
        setErrorMsg("");
        try {
            const token = localStorage.getItem("token");
            await axios.delete(
                `${API_BASE}/device/serial/${encodeURIComponent(device.serialNumber)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowConfirm(false);
            setDevice((prev) => ({ ...prev, __deleted: true }));
        } catch (err) {
            console.error("No se pudo eliminar:", err);
            const status = err?.response?.status;
            const serverMsg =
                err?.response?.data?.message ||
                (typeof err?.response?.data === "string" ? err.response.data : null);

            let friendly = "No se pudo eliminar el dispositivo. Intente de nuevo.";
            if (status === 404) friendly = "El dispositivo no existe o ya fue eliminado.";
            if (status === 409) friendly = "No se puede eliminar porque tiene registros relacionados.";

            setErrorMsg(serverMsg || friendly);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitOrEnter = (e) => {
        e.preventDefault();
        if (!device) {
            setErrorMsg("Selecciona un dispositivo de la lista o escribe un número de serie válido.");
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
            <h1>Eliminar Dispositivo</h1>

            <form className="reportForm" onSubmit={handleSubmitOrEnter}>
                {/* Input: número de serie */}
                <div className="formGroup searchContainer">
                    <label>Buscar dispositivo</label>
                    <input
                        type="text"
                        placeholder="Escribe el número de serie"
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
                            id="device-suggestions"
                            className="suggestionsList"
                            role="listbox"
                            ref={listboxRef}
                        >
                            {suggestions.map((d, i) => {
                                const id = d.id ?? d.serialNumber ?? i;
                                const isActive = i === activeIndex;
                                return (
                                    <li
                                        key={id}
                                        role="option"
                                        aria-selected={isActive}
                                        data-active={isActive ? "true" : "false"}
                                        className={`suggestionItem ${isActive ? "active" : ""}`}
                                        onMouseDown={() => handleSelectSuggestion(d)}
                                    >
                                        {d.serialNumber}
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
                {device && !device.__deleted && (
                    <div className="deviceInfoBox">
                        <p><strong>Serie:</strong> {device.serialNumber}</p>
                        {device.type && <p><strong>Tipo:</strong> {device.type}</p>}
                        {getType(device) && <p><strong>Tipo:</strong> {getType(device)}</p>}
                        {device.status && <p><strong>Estado:</strong> {device.status}</p>}
                        {device.workCenter?.name && <p><strong>Centro de trabajo:</strong> {device.workCenter.name}</p>}
                    </div>
                )}

                {/* Botón eliminar */}
                <button
                    type="submit"
                    className="submitBtn"
                    disabled={!device || device.__deleted || isLoading}
                >
                    {isLoading ? "Eliminando..." : "Eliminar dispositivo"}
                </button>
            </form>

            {/* Modal de confirmación */}
            {showConfirm && device && !device.__deleted && (
                <div className="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
                    <div className="modalContent">
                        <div className="modalIcon">🗑️</div>
                        <h2 className="modalTitle" id="confirm-title">Confirmar eliminación</h2>
                        <p className="modalMessage">
                            ¿Seguro que deseas eliminar el dispositivo con serie{" "}
                            <strong>{device.serialNumber}</strong>? Esta acción no se puede deshacer.
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
            {device?.__deleted && (
                <div className="modalOverlay" role="dialog" aria-modal="true">
                    <div className="modalContent success">
                        <div className="modalIcon">✅</div>
                        <h2 className="modalTitle">Dispositivo eliminado</h2>
                        <p className="modalMessage">
                            El dispositivo con serie <strong>{device.serialNumber}</strong> se eliminó correctamente.
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

export default DeleteDevice;
