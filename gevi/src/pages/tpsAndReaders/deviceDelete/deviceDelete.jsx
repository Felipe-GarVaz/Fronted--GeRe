// src/components/DeleteDevice.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./deviceDelete.css";

const API_BASE = "/api";
const getTypeRaw = (x) => x?.type ?? x?.deviceType ?? x?.tipo ?? x?.typeName ?? null;
const formatType = (t) =>
    t
        ? t
            .toUpperCase()
            .split("_")
            .map((w) => (w.length <= 2 ? w : w.charAt(0) + w.slice(1).toUpperCase()))
            .join(" ")
        : "";

const getWorkCenterName = (d) => {
    const wc = d?.workCenter;
    if (!wc) return "";
    if (typeof wc === "string") return wc;
    return wc.name || "";
};

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
    const [showAlert, setShowAlert] = useState(false);
    const [alertMsg, setAlertMsg] = useState("");
    const listboxRef = useRef(null);

    // ===== Buscar sugerencias por NÚMERO DE SERIE (debounce + cancelación)
    useEffect(() => {
        if (hasSelectedSuggestion.current) {
            hasSelectedSuggestion.current = false;
            return;
        }

        const q = searchTerm.trim();

        // 1) Reset rápido si vacío
        if (!q) {
            setSuggestions([]);
            setDevice(null);
            setErrorMsg("");
            setActiveIndex(-1);
            return;
        }

        // 2) Alineado con backend: mínimo 2 chars
        if (q.length < 2) {
            setSuggestions([]);
            setDevice(null);
            setActiveIndex(-1);
            setErrorMsg("");
            return;
        } else {
            setErrorMsg("");
        }


        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                setIsSearching(true);
                const token = localStorage.getItem("token");

                const res = await axios.get(`${API_BASE}/device/search`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { query: q, page: 0, size: 10 }, // usa params, no string concatenation
                    signal: controller.signal,
                    validateStatus: (s) => [200, 204, 400].includes(s), // controlado
                });

                // 3) Manejo de estados típicos
                if (res.status === 204) {
                    setSuggestions([]);
                    setDevice(null);
                    setActiveIndex(-1);
                    return;
                }

                if (res.status === 400) {
                    // Suele venir por validación del backend (ej. tamaño)
                    // Si quieres mostrar el mensaje exacto del backend:
                    const msg = res?.data?.error || "Consulta inválida";
                    setErrorMsg(typeof msg === "string" ? msg : "Consulta inválida");
                    setSuggestions([]);
                    setDevice(null);
                    setActiveIndex(-1);
                    return;
                }

                // 200 OK
                const payload = res.data;
                // Soporta tanto List<DTO> como Page<DTO>
                const data = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.content)
                        ? payload.content
                        : [];

                setSuggestions(data);
                setActiveIndex(data.length ? 0 : -1);

                // 4) Autoselección si hay coincidencia exacta por serie
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
        }, 300); // 250-400ms va bien

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [searchTerm]);


    const handleSelectSuggestion = (d) => {
        hasSelectedSuggestion.current = true;
        const typeLabel = formatType(getTypeRaw(d));
        setSearchTerm(`${d.serialNumber}${typeLabel ? " - " + typeLabel : ""}`);
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
                `${API_BASE}/device/serialNumber/${encodeURIComponent(device.serialNumber)}`,
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
            if (status === 401 || status === 403) friendly = "Sesión expirada o sin permisos.";
            if (status === 404) friendly = "El dispositivo no existe o ya fue eliminado.";
            if (status === 409) friendly = "No se puede eliminar porque tiene registros relacionados.";

            setErrorMsg(serverMsg || friendly);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitOrEnter = (e) => {
        if (e && typeof e.preventDefault === "function") e.preventDefault();

        if (!device) {
            const q = searchTerm.trim();
            if (!q) {
                setAlertMsg("No has escrito ningún número de serie. Por favor escribe un número de serie válido.");
            } else {
                setAlertMsg(`No se encontró un dispositivo con serie "${q}". Selecciona una sugerencia válida.`);
            }
            setShowAlert(true);
            return;
        }

        if (device.__deleted) {
            setAlertMsg("El dispositivo ya fue eliminado.");
            setShowAlert(true);
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

    const deviceType = formatType(getTypeRaw(device));
    const workCenterName = getWorkCenterName(device);

    return (
        <div className="deleteContainer">
            <h1>Eliminar dispositivo</h1>

            <form className="reportForm" onSubmit={handleSubmitOrEnter}>
                {/* Input: número de serie */}
                <div className="formGroup searchContainer">
                    <label>Buscar dispositivo</label>
                    <input
                        type="text"
                        placeholder="Escribe el número de serie"
                        value={searchTerm}
                        onChange={(e) => {
                            const upper = e.target.value.toUpperCase();
                            setSearchTerm(upper);
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
                                const baseId = d.id ?? d.serialNumber ?? i;
                                const optId = `device-opt-${baseId}`;
                                const isActive = i === activeIndex;
                                return (
                                    <li
                                        id={optId}
                                        key={baseId}
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
                        {deviceType && <p><strong>Tipo:</strong> {deviceType}</p>}
                        {device?.status && <p><strong>Estado:</strong> {device.status}</p>}
                        {workCenterName && <p><strong>Centro de trabajo:</strong> {workCenterName}</p>}
                    </div>
                )}

                {/* Botón eliminar */}
                <button
                    type="button"
                    className="submitBtn"
                    onClick={handleSubmitOrEnter}
                    disabled={isLoading}
                >
                    {isLoading ? "Eliminando..." : "Eliminar dispositivo"}
                </button>
            </form>

            {showAlert && (
                <div
                    className="modalOverlay"
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="alert-title"
                >
                    <div className="modalContent">
                        <div className="modalIcon">⚠️</div>
                        <h2 className="modalTitle" id="alert-title">Atención</h2>
                        <p className="modalMessage">{alertMsg}</p>
                        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                            <button
                                className="modalButton"
                                onClick={() => setShowAlert(false)}
                                autoFocus
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
