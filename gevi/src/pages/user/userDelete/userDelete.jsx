// src/components/DeleteUser.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./userDelete.css";

const API_BASE = "http://localhost:8080/api";

// Helpers
const getFullName = (u) => {
    const n = [u?.name, u?.lastName].filter(Boolean).join(" ");
    return n || "";
};
const getRoles = (u) => {
    const roles = u?.roles; // puede venir como array de objetos o strings
    if (!roles) return "";
    if (Array.isArray(roles)) {
        return roles
            .map((r) => (typeof r === "string" ? r : r?.name || r?.lastName || ""))
            .filter(Boolean)
            .join(", ");
    }
    return typeof roles === "string" ? roles : "";
};

const DeleteUser = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [user, setUser] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [showAlert, setShowAlert] = useState(false); // nuevo: modal de alerta
    const [alertMsg, setAlertMsg] = useState(""); // mensaje para modal de alerta
    const hasSelectedSuggestion = useRef(false);
    const listboxRef = useRef(null);

    // ===== Buscar sugerencias por RPE (debounce + cancelación)
    useEffect(() => {
        if (hasSelectedSuggestion.current) {
            hasSelectedSuggestion.current = false;
            return;
        }

        const q = searchTerm.trim();

        if (!q) {
            setSuggestions([]);
            setUser(null);
            setErrorMsg("");
            setActiveIndex(-1);
            return;
        }

        if (q.length < 2) {
            setSuggestions([]);
            setUser(null);
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

                // Ajusta a tu backend:
                // GET /api/user/search?query=<RPE>&page=0&size=10
                const res = await axios.get(`${API_BASE}/user/search`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { query: q, page: 0, size: 10 },
                    signal: controller.signal,
                    validateStatus: (s) => [200, 204, 400].includes(s),
                });

                if (res.status === 204) {
                    setSuggestions([]);
                    setUser(null);
                    setActiveIndex(-1);
                    return;
                }

                if (res.status === 400) {
                    const msg = res?.data?.error || "Consulta inválida";
                    setErrorMsg(typeof msg === "string" ? msg : "Consulta inválida");
                    setSuggestions([]);
                    setUser(null);
                    setActiveIndex(-1);
                    return;
                }

                const payload = res.data;
                const data = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.content)
                        ? payload.content
                        : [];

                setSuggestions(data);
                setActiveIndex(data.length ? 0 : -1);

                // Autoselección si hay coincidencia exacta por RPE
                const lower = q.toLowerCase();
                const exact = data.find((u) => u.rpe?.toLowerCase() === lower);
                setUser(exact || null);
            } catch (err) {
                if (controller.signal.aborted) return;
                console.error("Error al buscar usuarios:", err);
                setSuggestions([]);
                setUser(null);
                setActiveIndex(-1);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [searchTerm]);

    const handleSelectSuggestion = (u) => {
        hasSelectedSuggestion.current = true;
        setSearchTerm(u.rpe || "");
        setUser(u);
        setSuggestions([]);
        setActiveIndex(-1);
        setErrorMsg("");
    };

    const clearAll = () => {
        setSearchTerm("");
        setSuggestions([]);
        setUser(null);
        setActiveIndex(-1);
        setErrorMsg("");
        setShowConfirm(false);
        setShowAlert(false);
        setAlertMsg("");
    };

    const handleDelete = async () => {
        if (!user?.rpe) return;
        setIsLoading(true);
        setErrorMsg("");
        try {
            const token = localStorage.getItem("token");
            // Ajusta a tu backend:
            // DELETE /api/user/rpe/{rpe}
            await axios.delete(
                `${API_BASE}/user/rpe/${encodeURIComponent(user.rpe)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowConfirm(false);
            setUser((prev) => ({ ...prev, __deleted: true }));
        } catch (err) {
            console.error("No se pudo eliminar:", err);
            const status = err?.response?.status;
            const serverMsg =
                err?.response?.data?.message ||
                (typeof err?.response?.data === "string" ? err.response.data : null);

            let friendly = "No se pudo eliminar el usuario. Intente de nuevo.";
            if (status === 401 || status === 403) friendly = "Sesión expirada o sin permisos.";
            if (status === 404) friendly = "El usuario no existe o ya fue eliminado.";
            if (status === 409) friendly = "No se puede eliminar porque tiene registros relacionados.";

            setErrorMsg(serverMsg || friendly);
        } finally {
            setIsLoading(false);
        }
    };

    // Cuando el usuario pulsa el botón 'Eliminar' o presiona Enter
    const handleSubmitOrEnter = (e) => {
        // soporta llamadas desde onClick (sin evento) o desde form submit (con evento)
        if (e && typeof e.preventDefault === "function") e.preventDefault();

        // Si no hay usuario seleccionado -> mostrar modal de alerta con mensaje específico
        if (!user) {
            const q = searchTerm.trim();
            if (!q) {
                setAlertMsg("No has escrito ningún RPE. Por favor escribe un RPE y selecciónalo de la lista.");
            } else {
                setAlertMsg(`No se encontró un usuario con RPE "${q}". Selecciona una sugerencia válida.`);
            }
            setShowAlert(true);
            return;
        }
        // Si el usuario ya está marcado como eliminado, no permitir continuar
        if (user.__deleted) {
            setAlertMsg("El usuario ya fue eliminado.");
            setShowAlert(true);
            return;
        }
        // Mostrar modal de confirmación para eliminar
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

    const fullName = getFullName(user);
    const roles = getRoles(user);

    return (
        <div className="deleteContainer">
            <h1>Eliminar Usuario</h1>

            <form className="reportForm" onSubmit={handleSubmitOrEnter}>
                {/* Input: RPE */}
                <div className="formGroup searchContainer">
                    <label>Buscar usuario por RPE</label>
                    <input
                        type="text"
                        placeholder="Escribe el RPE"
                        value={searchTerm}
                        onChange={(e) => {
                            const upper = e.target.value.toUpperCase();
                            setSearchTerm(upper);
                            setErrorMsg("");
                        }}
                        onKeyDown={handleKeyDown}
                        onBlur={() => setTimeout(() => setSuggestions([]), 120)}
                        autoComplete="off"
                    />

                    {suggestions.length > 0 && (
                        <ul
                            id="user-suggestions"
                            className="suggestionsList"
                            role="listbox"
                            ref={listboxRef}
                        >
                            {suggestions.map((u, i) => {
                                const baseId = u.id ?? u.rpe ?? i;
                                const optId = `user-opt-${baseId}`;
                                const isActive = i === activeIndex;
                                return (
                                    <li
                                        id={optId}
                                        key={baseId}
                                        role="option"
                                        aria-selected={isActive}
                                        data-active={isActive ? "true" : "false"}
                                        className={`suggestionItem ${isActive ? "active" : ""}`}
                                        onMouseDown={() => handleSelectSuggestion(u)}
                                    >
                                        {u.rpe}
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
                {user && !user.__deleted && (
                    <div className="deviceInfoBox">
                        <p><strong>RPE:</strong> {user.rpe}</p>
                        {fullName && <p><strong>Nombre:</strong> {fullName}</p>}
                        {roles && <p><strong>Roles:</strong> {roles}</p>}
                    </div>
                )}

                {/* Botón eliminar (ahora tipo button para permitir click incluso sin usuario) */}
                <button
                    type="button"
                    className="submitBtn"
                    onClick={handleSubmitOrEnter}
                    disabled={user?.__deleted || isLoading}
                >
                    {isLoading ? "Eliminando..." : "Eliminar usuario"}
                </button>
            </form>

            {/* Modal de alerta (nuevo) */}
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
            {showConfirm && user && !user.__deleted && (
                <div className="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
                    <div className="modalContent">
                        <div className="modalIcon">🗑️</div>
                        <h2 className="modalTitle" id="confirm-title">Confirmar eliminación</h2>
                        <p className="modalMessage">
                            ¿Seguro que deseas eliminar al usuario con RPE{" "}
                            <strong>{user.rpe}</strong>? Esta acción no se puede deshacer.
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
            {user?.__deleted && (
                <div className="modalOverlay" role="dialog" aria-modal="true">
                    <div className="modalContent success">
                        <div className="modalIcon">✅</div>
                        <h2 className="modalTitle">Usuario eliminado</h2>
                        <p className="modalMessage">
                            El usuario con RPE <strong>{user.rpe}</strong> se eliminó correctamente.
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

export default DeleteUser;
