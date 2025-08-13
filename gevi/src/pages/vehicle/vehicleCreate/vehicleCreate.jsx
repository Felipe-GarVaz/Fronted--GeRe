// src/components/AddVehicle.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './vehicleCreate.css'; // reutilizamos el mismo estilo

const AddVehicle = () => {
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
  const [errors, setErrors] = useState({});
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

  // Validaciones simples en front
  const validate = () => {
    const e = {};
    const currentYear = new Date().getFullYear();

    // --- mileage: 1-6 dígitos y número válido ---
    const mileageStr = String(formData.mileage ?? '').trim();
    const mileageNum = mileageStr === '' ? NaN : parseInt(mileageStr, 10);

    if (mileageStr === '') {
      e.mileage = 'Requerido';
    } else if (!/^\d{1,6}$/.test(mileageStr)) {
      e.mileage = 'Máximo 6 dígitos (solo números)';
    } else if (Number.isNaN(mileageNum) || mileageNum < 0) {
      e.mileage = 'Debe ser un número entero positivo';
    }

    // --- year: exactamente 4 dígitos en rango ---
    const yearStr = String(formData.year ?? '').trim();
    const yearNum = yearStr === '' ? NaN : parseInt(yearStr, 10);

    if (yearStr === '') {
      e.year = 'Requerido';
    } else if (!/^\d{4}$/.test(yearStr)) {
      e.year = 'Debe tener exactamente 4 dígitos';
    } else if (Number.isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
      e.year = `Debe estar entre 1900 y ${currentYear}`;
    }
    
    return e;
  };



  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'economical') {
      // Solo números
      const numericValue = value.replace(/\D/g, '');
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue
      }));
    }
    else if (name === 'year') {
      // Solo números y máximo 4 dígitos
      const numericValue = value.replace(/\D/g, '').slice(0, 4);
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue
      }));
    }
    else if (name === 'mileage') {
      // Solo números y máximo 6 dígitos
      const numericValue = value.replace(/\D/g, '').slice(0, 6);
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue
      }));
    }
    else if (['workCenterId', 'processId'].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    }
    else if (['brand', 'model'].includes(name)) {
      // Siempre mayúsculas
      setFormData((prev) => ({
        ...prev,
        [name]: value.toUpperCase()
      }));
    }
    else if (name === 'badge') {
      // Mayúsculas y máximo 7 caracteres
      setFormData((prev) => ({
        ...prev,
        [name]: value.toUpperCase().slice(0, 7)
      }));
    }
    else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }

    // Limpia el error del campo
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/vehicles', formData, {
        headers: { Authorization: `Bearer ${token}` }
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
            placeholder="EJ. 34567"
            autoComplete="off"
            inputMode="numeric"
            required
          />
          {errors.economical && <div className="error">{errors.economical}</div>}
        </div>

        {/* Placa */}
        <div className="formGroup">
          <label>Placa</label>
          <input
            type="text"
            name="badge"
            value={formData.badge}
            onChange={handleChange}
            placeholder="Ej. ABC1234"
            autoComplete="off"
            maxLength={7}
            required
          />
          {errors.badge && <div className="error">{errors.badge}</div>}
        </div>

        {/* Propiedad */}
        <div className="formGroup">
          <label>Propiedad</label>
          <select name="property" value={formData.property} onChange={handleChange}required>
            <option value="">Seleccione propiedad</option>
            <option value="PROPIO">PROPIO</option>
            <option value="ARRENDADO">ARRENDADO</option>
          </select>
          {errors.property && <div className="error">{errors.property}</div>}
        </div>

        {/* Kilometraje */}
        <div className="formGroup">
          <label>Kilometraje</label>
          <input
            type="number"
            name="mileage"
            value={formData.mileage}
            onChange={handleChange}
            placeholder="Ej. 120000"
            maxLength={6}
            required
          />
          {errors.mileage && <div className="error">{errors.mileage}</div>}
        </div>

        {/* Marca */}
        <div className="formGroup">
          <label>Marca</label>
          <input
            type="text"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            placeholder="Ej. FORD"
            autoComplete="off"
            required
          />
          {errors.brand && <div className="error">{errors.brand}</div>}
        </div>

        {/* Modelo */}
        <div className="formGroup">
          <label>Modelo</label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            placeholder="Ej. F-150"
            autoComplete="off"
            required
          />
          {errors.model && <div className="error">{errors.model}</div>}
        </div>

        {/* Año */}
        <div className="formGroup">
          <label>Año</label>
          <input
            type="number"
            name="year"
            value={formData.year}
            onChange={handleChange}
            placeholder="Ej. 2019"
            maxLength={4}
            required
          />
          {errors.year && <div className="error">{errors.year}</div>}
        </div>

        {/* Centro de trabajo */}
        <div className="formGroup">
          <label>Centro de trabajo</label>
          <select
            name="workCenterId"
            value={formData.workCenterId}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione centro de trabajo</option>
            {workCenters.map((ct) => (
              <option key={ct.id} value={ct.id}>
                {ct.name || ct.nombre}
              </option>
            ))}
          </select>
          {errors.workCenterId && <div className="error">{errors.workCenterId}</div>}
        </div>

        {/* Proceso */}
        <div className="formGroup">
          <label>Proceso</label>
          <select
            name="processId"
            value={formData.processId}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione proceso</option>
            {processes.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.name || pr.nombre}
              </option>
            ))}
          </select>
          {errors.processId && <div className="error">{errors.processId}</div>}
        </div>

        {/* Error API */}
        {apiError && <div className="error" style={{ marginTop: 8 }}>{apiError}</div>}

        {/* Botón */}
        <button type="submit" className="submitBtn" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar Vehículo'}
        </button>
      </form>

      {/* Modal de éxito (mismo estilo que reportar vehículo) */}
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
