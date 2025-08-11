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
    if (!formData.economical?.trim()) e.economical = 'Requerido';
    if (!formData.badge?.trim()) e.badge = 'Requerido';
    if (!formData.property) e.property = 'Seleccione una opción';
    if (formData.mileage === '' || formData.mileage === null) e.mileage = 'Requerido';
    if (Number(formData.mileage) < 0) e.mileage = 'No puede ser negativo';
    if (!formData.brand?.trim()) e.brand = 'Requerido';
    if (!formData.model?.trim()) e.model = 'Requerido';
    if (formData.year === '' || formData.year === null) e.year = 'Requerido';
    if (Number(formData.year) < 1900) e.year = 'Debe ser ≥ 1900';
    if (!formData.workCenterId) e.workCenterId = 'Seleccione un centro';
    if (!formData.processId) e.processId = 'Seleccione un proceso';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // normalizamos numéricos
    if (['mileage', 'year', 'workCenterId', 'processId'].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
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
            placeholder="Ej. CFE-001"
            autoComplete="off"
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
          />
          {errors.badge && <div className="error">{errors.badge}</div>}
        </div>

        {/* Propiedad */}
        <div className="formGroup">
          <label>Propiedad</label>
          <select name="property" value={formData.property} onChange={handleChange}>
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
            placeholder="Ej. Ford"
            autoComplete="off"
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
