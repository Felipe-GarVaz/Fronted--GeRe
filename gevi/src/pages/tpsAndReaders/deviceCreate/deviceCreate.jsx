// src/components/AddDevice.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './deviceCreate.css';

const API_BASE = 'http://localhost:8080/api';
const WC_ENDPOINT = `${API_BASE}/workCenter`;
const DEVICES_ENDPOINT = `${API_BASE}/devices`;

const DEVICE_TYPES = [
  'TP_NEWLAND',
  'LECTOR_NEWLAND',
  'TP_DOLPHIN_9900',
  'LECTOR_DOLPHIN_9900'
];

const AddDevice = () => {
  const [formData, setFormData] = useState({
    serialNumber: '',
    deviceType: '',
    workCenterId: ''
  });

  const [workCenters, setWorkCenters] = useState([]);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    axios
      .get(WC_ENDPOINT, { headers })
      .then((wcRes) => {
        setWorkCenters(wcRes?.data || []);
      })
      .catch((err) => {
        console.error('Error cargando centros de trabajo:', err);
      });
  }, []);

  const validate = () => {
    const e = {};
    const sn = String(formData.serialNumber || '').trim();
    if (sn === '') {
      e.serialNumber = 'Requerido';
    } else if (!/^[A-Z0-9-]{3,50}$/.test(sn)) {
      e.serialNumber = 'Use A-Z, 0-9 o guión (3-50)';
    }

    if (!formData.deviceType) e.deviceType = 'Seleccione tipo';

    if (!formData.workCenterId && formData.workCenterId !== 0) {
      e.workCenterId = 'Seleccione centro de trabajo';
    }

    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'serialNumber') {
      const normalized = value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 50);
      setFormData((prev) => ({ ...prev, serialNumber: normalized }));
    } else if (name === 'workCenterId') {
      setFormData((prev) => ({ ...prev, workCenterId: value === '' ? '' : Number(value) }));
    } else if (name === 'deviceType') {
      setFormData((prev) => ({ ...prev, deviceType: value }));
    }

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
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.post(DEVICES_ENDPOINT, { ...formData, status: 'ACTIVO' }, { headers });

      setShowModal(true);
      setFormData({ serialNumber: '', deviceType: '', workCenterId: '' });
    } catch (err) {
      console.error('Error al registrar dispositivo:', err);
      const code = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === 'string' ? err.response.data : null) ||
        (code === 409
          ? 'Ya existe un dispositivo con ese número de serie.'
          : 'Ocurrió un error al registrar el dispositivo.');
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="createContainer">
      <h1>Registrar Nuevo Dispositivo</h1>

      <form onSubmit={handleSubmit} className="reportForm">
        <div className="formGroup">
          <label>Número de serie</label>
          <input
            type="text"
            name="serialNumber"
            value={formData.serialNumber}
            onChange={handleChange}
            placeholder="Ej. ABC-123456"
            autoComplete="off"
            required
            pattern="[A-Za-z0-9-]{3,50}"
            title="Use letras, números o guiones (3-50)"
          />
          {errors.serialNumber && <div className="error">{errors.serialNumber}</div>}
        </div>

        <div className="formGroup">
          <label>Tipo de dispositivo</label>
          <select
            name="deviceType"
            value={formData.deviceType}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione tipo</option>
            {DEVICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {errors.deviceType && <div className="error">{errors.deviceType}</div>}
        </div>

        <div className="formGroup">
          <label>Agencia / Centro de trabajo</label>
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

        {apiError && <div className="error" style={{ marginTop: 8 }}>{apiError}</div>}

        <button type="submit" className="submitBtn" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar Dispositivo'}
        </button>
      </form>

      {showModal && (
        <div className="modalOverlay">
          <div className="modalContent success">
            <div className="modalIcon">✅</div>
            <h2 className="modalTitle">¡Dispositivo Registrado!</h2>
            <p className="modalMessage">El dispositivo se guardó correctamente.</p>
            <button onClick={() => setShowModal(false)} className="modalButton">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddDevice;
