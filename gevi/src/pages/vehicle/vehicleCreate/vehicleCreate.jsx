import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './vehicleCreate.css';

const AddVehicle = () => {
  const currentYear = new Date().getFullYear();

  // Refs para enfocar inputs desde el modal de duplicados
  const economicalRef = useRef(null);
  const badgeRef = useRef(null);

  // Campos que espera el backend (VehicleRequest)
  const [formData, setFormData] = useState({
    economical: '',
    badge: '',
    property: '',
    mileage: '',
    brand: '',
    model: '',
    year: '',
    workCenterId: '',
    processId: ''
  });

  const [workCenters, setWorkCenters] = useState([]);
  const [processes, setProcesses] = useState([]);

  const [apiError, setApiError] = useState('');
  const [showModal, setShowModal] = useState(false);        // éxito
  const [submitting, setSubmitting] = useState(false);

  // NUEVO: modal de duplicados
  const [showDupModal, setShowDupModal] = useState(false);
  const [dupInfo, setDupInfo] = useState({
    economical: false,
    badge: false,
    message: ''
  });

  // Catálogos
  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      axios.get('/api/workCenter', { headers }),
      axios.get('/api/process', { headers })
    ])
      .then(([wcRes, prRes]) => {
        setWorkCenters(wcRes.data || []);
        setProcesses(prRes.data || []);
      })
      .catch((err) => {
        console.error('Error cargando catálogos:', err);
      });
  }, []);

  // Helpers de validación nativa (globitos)
  const setInvalidMsg = (e, msg) => e.target.setCustomValidity(msg);
  const clearInvalidMsg = (e) => e.target.setCustomValidity('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'economical') {
      const numericValue = value.replace(/\D/g, '');
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }

    if (name === 'year') {
      const numericValue = value.replace(/[^\d-]/g, '');
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }

    if (name === 'mileage') {
      const numericValue = value.replace(/[^\d-]/g, '');
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }

    if (['workCenterId', 'processId'].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
      return;
    }

    if (['brand', 'model'].includes(name)) {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
      return;
    }

    if (name === 'badge') {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase().slice(0, 7) }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const payload = {
        ...formData,
        mileage: formData.mileage === '' ? '' : Number(formData.mileage),
        year: formData.year === '' ? '' : Number(formData.year),
      };

      await axios.post('/api/vehicles', payload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      setShowModal(true);
      // limpiar formulario
      setFormData({
        economical: '',
        badge: '',
        property: '',
        mileage: '',
        brand: '',
        model: '',
        year: '',
        workCenterId: '',
        processId: ''
      });
    } catch (err) {
      console.error('Error al registrar vehículo:', err);

      // Intento robusto de detección de duplicados (409 Conflict recomendado)
      const status = err?.response?.status;
      const body = err?.response?.data;
      const rawMsg =
        (typeof body === 'string' ? body : body?.message || JSON.stringify(body || {})).toString();

      // Normalizamos a mayúsculas para buscar palabras clave
      const U = rawMsg.toUpperCase();

      const dupEconomical =
        /ECON(O|Ó)MICO|ECONOMICAL|NUMERO\s+ECONOMICO|NÚMERO\s+ECONÓMICO/.test(U);
      const dupBadge = /PLACA|BADGE|MATR(Í|I)CULA/.test(U);

      // Algunos backends envían un array de errores por campo
      const fieldErrors = body?.errors || body?.fieldErrors || {};
      const feEco = !!(fieldErrors.economical || fieldErrors.numeroEconomico);
      const feBadge = !!(fieldErrors.badge || fieldErrors.placa);

      if (status === 409 || dupEconomical || dupBadge || feEco || feBadge) {
        setDupInfo({
          economical: dupEconomical || feEco,
          badge: dupBadge || feBadge,
          message: rawMsg
        });
        setShowDupModal(true);
        return; // evitamos pintar apiError genérico
      }

      const msg =
        body?.message ||
        (typeof body === 'string' ? body : null) ||
        'Ocurrió un error al registrar el vehículo.';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="createContainer">
      <h1>Registrar nuevo vehículo</h1>

      <form onSubmit={handleSubmit} className="reportForm">
        {/* Económico */}
        <div className="formGroup">
          <label>Número económico</label>
          <input
            ref={economicalRef}
            type="text"
            name="economical"
            value={formData.economical}
            onChange={handleChange}
            onInvalid={(e) => setInvalidMsg(e, 'Ingrese solo números')}
            onInput={clearInvalidMsg}
            placeholder="EJ. 34567"
            autoComplete="off"
            inputMode="numeric"
            pattern="^\d+$"
            required
          />
        </div>

        {/* Placa */}
        <div className="formGroup">
          <label>Placa</label>
          <input
            ref={badgeRef}
            type="text"
            name="badge"
            value={formData.badge}
            onChange={handleChange}
            onInvalid={(e) => setInvalidMsg(e, 'La placa debe tener exactamente 7 caracteres (A-Z, 0-9)')}
            onInput={clearInvalidMsg}
            placeholder="Ej. ABC1234"
            autoComplete="off"
            maxLength={7}
            pattern="^[A-Z0-9]{7}$"
            title="7 caracteres alfanuméricos en mayúsculas (A-Z, 0-9)"
            required
          />
        </div>

        {/* Propiedad */}
        <div className="formGroup">
          <label>Propiedad</label>
          <select
            name="property"
            value={formData.property}
            onChange={handleChange}
            onInput={clearInvalidMsg}
            required
          >
            <option value="">Seleccione una propiedad</option>
            <option value="PROPIO">PROPIO</option>
            <option value="ARRENDADO">ARRENDADO</option>
          </select>
        </div>

        {/* Kilometraje */}
        <div className="formGroup">
          <label>Kilometraje</label>
          <input
            type="number"
            name="mileage"
            value={formData.mileage}
            onChange={handleChange}
            onInvalid={(e) => setInvalidMsg(e, 'Ingrese un número entre 0 y 999999')}
            onInput={clearInvalidMsg}
            placeholder="Ej. 120000"
            min="0"
            max="999999"
            step="1"
            required
          />
        </div>

        {/* Marca */}
        <div className="formGroup">
          <label>Marca</label>
          <input
            type="text"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            onInvalid={(e) => setInvalidMsg(e, 'Ingrese la marca')}
            onInput={clearInvalidMsg}
            placeholder="Ej. FORD"
            autoComplete="off"
            required
          />
        </div>

        {/* Modelo */}
        <div className="formGroup">
          <label>Modelo</label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            onInvalid={(e) => setInvalidMsg(e, 'Ingrese el modelo')}
            onInput={clearInvalidMsg}
            placeholder="Ej. F-150"
            autoComplete="off"
            required
          />
        </div>

        {/* Año */}
        <div className="formGroup">
          <label>Año</label>
          <input
            type="number"
            name="year"
            value={formData.year}
            onChange={handleChange}
            onInvalid={(e) => setInvalidMsg(e, `Ingrese un año entre 2000 y ${currentYear}`)}
            onInput={clearInvalidMsg}
            placeholder="Ej. 2019"
            min="2000"
            max={currentYear}
            step="1"
            required
          />
        </div>

        {/* Centro de trabajo */}
        <div className="formGroup">
          <label>Centro de trabajo</label>
          <select
            name="workCenterId"
            value={formData.workCenterId}
            onChange={handleChange}
            onInput={clearInvalidMsg}
            required
          >
            <option value="">Seleccione centro de trabajo</option>
            {workCenters.map((ct) => (
              <option key={ct.id} value={ct.id}>
                {ct.name || ct.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Proceso */}
        <div className="formGroup">
          <label>Proceso</label>
          <select
            name="processId"
            value={formData.processId}
            onChange={handleChange}
            onInput={clearInvalidMsg}
            required
          >
            <option value="">Seleccione un proceso</option>
            {processes.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.name || pr.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Error API genérico */}
        {apiError && <div className="error" style={{ marginTop: 8 }}>{apiError}</div>}

        {/* Botón */}
        <button type="submit" className="submitBtn" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar vehículo'}
        </button>
      </form>

      {/* Modal de éxito */}
      {showModal && (
        <div className="modalOverlay">
          <div className="modalContent success">
            <div className="modalIcon">✅</div>
            <h2 className="modalTitle">¡Vehículo Registrado!</h2>
            <p className="modalMessage">El vehículo se guardó correctamente.</p>
            <button className="modalButton" onClick={() => setShowModal(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* NUEVO: Modal de duplicados */}
      {showDupModal && (
        <div className="modalOverlay">
          <div className="modalContent error">
            <div className="modalIcon">⚠️</div>
            <h2 className="modalTitle">No se pudo guardar</h2>

            {/* Mensaje inteligente según el campo duplicado */}
            {dupInfo.economical && dupInfo.badge ? (
              <p className="modalMessage">
                El <strong>número económico</strong> y la <strong>placa</strong> ya existen en el sistema.
              </p>
            ) : dupInfo.economical ? (
              <p className="modalMessage">
                El <strong>número económico</strong> ya existe en el sistema.
              </p>
            ) : dupInfo.badge ? (
              <p className="modalMessage">
                La <strong>placa</strong> ya existe en el sistema.
              </p>
            ) : (
              <p className="modalMessage">
                Ya existe un vehículo con los datos proporcionados.
              </p>
            )}
            <button
              className="modalButton"
              onClick={() => setShowDupModal(false)}
            >
              Cerrar
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default AddVehicle;
