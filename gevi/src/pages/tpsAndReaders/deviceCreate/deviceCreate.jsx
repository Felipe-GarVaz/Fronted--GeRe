import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './deviceCreate.css';

const AddDevice = () => {
  // Campos que espera el backend (DeviceRequest)
  const [formData, setFormData] = useState({
    serialNumber: '',
    deviceType: '',
    workCenterId: ''
  });

  const [workCenters, setWorkCenters] = useState([]);
  const [apiError, setApiError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Catálogos
  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      axios.get('http://localhost:8080/api/workCenter', { headers })
      // Si luego agregas otro catálogo (p. ej. modelos de dispositivo), añádelo aquí
    ])
      .then(([wcRes]) => {
        setWorkCenters(wcRes.data || []);
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

    if (name === 'serialNumber') {
      // Mayúsculas, permitir A-Z, 0-9 y guion, largo máx 50
      const normalized = value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 50);
      setFormData((prev) => ({ ...prev, [name]: normalized }));
      return;
    }

    if (name === 'workCenterId') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
      return;
    }

    if (name === 'deviceType') {
      setFormData((prev) => ({ ...prev, [name]: value }));
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

      // Payload listo para backend
      const payload = {
        ...formData,
        status: 'ACTIVO'
      };

      await axios.post('http://localhost:8080/api/device', payload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      setShowModal(true);
      // limpiar formulario
      setFormData({
        serialNumber: '',
        deviceType: '',
        workCenterId: ''
      });
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
        {/* Número de serie */}
        <div className="formGroup">
          <label>Número de serie</label>
          <input
            type="text"
            name="serialNumber"
            value={formData.serialNumber}
            onChange={handleChange}
            onInvalid={(e) => setInvalidMsg(e, 'Use letras mayúsculas, números o guiones (3-50)')}
            onInput={clearInvalidMsg}
            placeholder="Ej. ABC-123456"
            autoComplete="off"
            inputMode="text"
            pattern="^[A-Z0-9-]{3,50}$"
            title="Use letras, números o guiones (3-50)"
            required
          />
        </div>

        {/* Tipo de dispositivo */}
        <div className="formGroup">
          <label>Tipo de dispositivo</label>
          <select
            name="deviceType"
            value={formData.deviceType}
            onChange={handleChange}
            onInvalid={(e) => setInvalidMsg(e, 'Seleccione un tipo')}
            onInput={clearInvalidMsg}
            required
          >
            <option value="">Seleccione tipo</option>
            <option value="TP_NEWLAND">TP_NEWLAND</option>
            <option value="LECTOR_NEWLAND">LECTOR_NEWLAND</option>
            <option value="TP_DOLPHIN_9900">TP_DOLPHIN_9900</option>
            <option value="LECTOR_DOLPHIN_9900">LECTOR_DOLPHIN_9900</option>
          </select>
        </div>

        {/* Centro de trabajo */}
        <div className="formGroup">
          <label>Agencia</label>
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

        {/* Error API */}
        {apiError && <div className="error" style={{ marginTop: 8 }}>{apiError}</div>}

        {/* Botón */}
        <button type="submit" className="submitBtn" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar Dispositivo'}
        </button>
      </form>

      {/* Modal de éxito */}
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
