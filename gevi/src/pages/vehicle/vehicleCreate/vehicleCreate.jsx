// src/components/AddVehicle.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './vehicleCreate.css';

const AddVehicle = () => {
  const currentYear = new Date().getFullYear();

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
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Catálogos
  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      axios.get('http://localhost:8080/api/workCenter', { headers }),
      axios.get('http://localhost:8080/api/process', { headers })
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
      // Solo números (sin límite específico)
      const numericValue = value.replace(/\D/g, '');
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }

    if (name === 'year') {
      // Número (dejamos que min/max hagan el trabajo del rango)
      const numericValue = value.replace(/[^\d-]/g, ''); // por si el navegador permite e/-
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }

    if (name === 'mileage') {
      // Número, max 999999 (rango nativo)
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
      // Mayúsculas y máximo 7 caracteres
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
        // Asegura tipos numéricos para backend si los necesita como number
        mileage: formData.mileage === '' ? '' : Number(formData.mileage),
        year: formData.year === '' ? '' : Number(formData.year),
      };

      await axios.post('http://localhost:8080/api/vehicles', payload, {
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
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === 'string' ? err.response.data : null) ||
        'Ocurrió un error al registrar el vehículo.';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="createContainer">
      <h1>Registrar Nuevo Vehículo</h1>

      <form onSubmit={handleSubmit} className="reportForm">
        {/* Económico */}
        <div className="formGroup">
          <label>Número económico</label>
          <input
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
            onInvalid={(e) => setInvalidMsg(e, 'Seleccione una opción')}
            onInput={clearInvalidMsg}
            required
          >
            <option value="">Seleccione propiedad</option>
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
            onInvalid={(e) => setInvalidMsg(e, `Ingrese un año entre 1900 y ${currentYear}`)}
            onInput={clearInvalidMsg}
            placeholder="Ej. 2019"
            min="1900"
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
            onInvalid={(e) => setInvalidMsg(e, 'Seleccione un centro de trabajo')}
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
            onInvalid={(e) => setInvalidMsg(e, 'Seleccione un proceso')}
            onInput={clearInvalidMsg}
            required
          >
            <option value="">Seleccione proceso</option>
            {processes.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.name || pr.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Error API */}
        {apiError && <div className="error" style={{ marginTop: 8 }}>{apiError}</div>}

        {/* Botón */}
        <button type="submit" className="submitBtn" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar Vehículo'}
        </button>
      </form>

      {/* Modal de éxito */}
      {showModal && (
        <div className="modalOverlay">
          <div className="modalContent success">
            <div className="modalIcon">✅</div>
            <h2 className="modalTitle">¡Vehículo Registrado!</h2>
            <p className="modalMessage">El vehículo se guardó correctamente.</p>
            <button onClick={() => setShowModal(false)} className="modalButton">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddVehicle;
