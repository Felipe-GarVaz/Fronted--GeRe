// src/pages/users/AddUser.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./userCreate.css"; // <-- si prefieres, crea userCreate.css con las mismas clases

const API_BASE = "http://localhost:8080/api";

const AddUser = () => {
  const rpeRef = useRef(null);

  const [rpe, setRpe] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");

  const [roles, setRoles] = useState([]);     // catálogo del backend
  const [roleId, setRoleId] = useState("");   // seleccionado (uno)

  const [apiError, setApiError] = useState("");
  const [showModal, setShowModal] = useState(false);      // éxito
  const [showDupModal, setShowDupModal] = useState(false);// duplicado
  const [dupInfo, setDupInfo] = useState({ rpe: false, message: "" });
  const [submitting, setSubmitting] = useState(false);

  // Helpers de validación nativa (globitos)
  const setInvalidMsg = (e, msg) => e.target.setCustomValidity(msg);
  const clearInvalidMsg = (e) => e.target.setCustomValidity("");

  // Catálogo de roles
  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    axios
      .get(`${API_BASE}/role`, { headers })
      .then((res) => setRoles(Array.isArray(res.data) ? res.data : []))
      .catch(() => setRoles([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    // Validaciones mínimas
    if (!rpe || rpe.length < 3) return setApiError("RPE mínimo 3 caracteres.");
    if (!name || !lastName) return setApiError("Nombre y apellidos son obligatorios.");
    if (!password || password.length < 6) return setApiError("Contraseña mínimo 6 caracteres.");
    if (!roleId) return setApiError("Selecciona un rol.");

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const payload = {
        rpe: rpe.trim().toUpperCase(),
        name: name.trim(),
        lastName: lastName.trim(),
        password,
        roleIds: [Number(roleId)],
      };

      await axios.post(`${API_BASE}/user`, payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      setShowModal(true);
      // limpiar formulario
      setRpe("");
      setName("");
      setLastName("");
      setPassword("");
      setRoleId([]);
    } catch (err) {
      // Detección robusta de duplicado RPE
      const status = err?.response?.status;
      const body = err?.response?.data;
      const rawMsg =
        (typeof body === "string" ? body : body?.message || JSON.stringify(body || {})).toString();
      const U = rawMsg.toUpperCase();
      const dupRpe = /RPE|USUARIO\s+EXISTE|YA\s+EXISTE/.test(U);

      if (status === 409 || dupRpe) {
        setDupInfo({ rpe: true, message: rawMsg });
        setShowDupModal(true);
        return;
      }

      const msg =
        body?.message || (typeof body === "string" ? body : null) || "Ocurrió un error al crear el usuario.";
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="createContainer">
      <h1>Registrar Nuevo Usuario</h1>

      <form onSubmit={handleSubmit} className="reportForm">
        {/* RPE */}
        <div className="formGroup">
          <label>RPE</label>
          <input
            ref={rpeRef}
            type="text"
            name="rpe"
            value={rpe}
            onChange={(e) => setRpe(e.target.value.toUpperCase())}
            onInvalid={(e) => setInvalidMsg(e, "El RPE debe tener de 5 caracteres (A-Z,0-9)")}
            onInput={clearInvalidMsg}
            placeholder="Ej. 9FKGR"
            autoComplete="off"
            maxLength={5}
            pattern="^[A-Z0-9]{5}$"
            required
          />
        </div>

        {/* Nombre */}
        <div className="formGroup">
          <label>Nombre(s)</label>
          <input
            type="text"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            onInvalid={(e) => setInvalidMsg(e, "Ingrese nombre(s) (solo letras A-Z, sin espacios al inicio o final)")}
            onInput={clearInvalidMsg}
            placeholder="Ej. FELIPE"
            autoComplete="off"
            maxLength={50}
            pattern="^(?! )[A-ZÁÉÍÓÚÑ ]{3,}(?<! )$"
            required
          />
        </div>

        {/* Apellidos */}
        <div className="formGroup">
          <label>Apellidos</label>
          <input
            type="text"
            name="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value.toUpperCase())}
            onInvalid={(e) => setInvalidMsg(e, "Ingrese los apellidos (solo letras A-Z, sin espacios al inicio o final)")}
            onInput={clearInvalidMsg}
            placeholder="Ej. GARCIA VAZQUEZ"
            autoComplete="off"
            maxLength={50}
            pattern="^(?! )[A-ZÁÉÍÓÚÑ ]{3,}(?<! )$"
            required
          />
        </div>

        {/* Contraseña */}
        <div className="formGroup">
          <label>Contraseña</label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onInvalid={(e) => setInvalidMsg(e, "La contraseña debe tener al menos 6 caracteres")}
            onInput={clearInvalidMsg}
            placeholder="••••••••"
            minLength={6}
            required
          />
        </div>

        {/* Rol (menú de selección) */}
        <div className="formGroup">
          <label>Rol</label>
          <select
            name="roleId"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            onInvalid={(e) => e.target.setCustomValidity("Selecciona un rol")}
            onInput={(e) => e.target.setCustomValidity("")}
            required
          >
            <option value="">Seleccione un rol</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre || r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Error API genérico */}
        {apiError && <div className="error" style={{ marginTop: 8 }}>{apiError}</div>}

        {/* Botón */}
        <button type="submit" className="submitBtn" disabled={submitting}>
          {submitting ? "Guardando..." : "Guardar Usuario"}
        </button>
      </form>

      {/* Modal de éxito */}
      {showModal && (
        <div className="modalOverlay">
          <div className="modalContent success">
            <div className="modalIcon">✅</div>
            <h2 className="modalTitle">¡Usuario creado!</h2>
            <p className="modalMessage">El usuario se guardó correctamente.</p>
            <button className="modalButton" onClick={() => setShowModal(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de duplicado RPE */}
      {showDupModal && (
        <div className="modalOverlay">
          <div className="modalContent error">
            <div className="modalIcon">⚠️</div>
            <h2 className="modalTitle">No se pudo guardar</h2>
            {dupInfo.rpe ? (
              <p className="modalMessage">
                El <strong>RPE</strong> ya existe en el sistema.
              </p>
            ) : (
              <p className="modalMessage">Los datos proporcionados ya existen.</p>
            )}
            <button
              className="modalButton"
              onClick={() => {
                setShowDupModal(false);
                rpeRef.current?.focus();
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddUser;
