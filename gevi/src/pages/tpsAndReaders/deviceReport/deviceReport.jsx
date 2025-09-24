import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './deviceReport.css';

const ReportTPSReaders = () => {
  // ===== Estados principales =====
  const [workCenters, setWorkCenters] = useState([]);
  const [devices, setDevices] = useState([]);
  const [failTypes, setFailTypes] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const [formData, setFormData] = useState({
    workCenterId: '',
    deviceType: '',
    serialNumber: '',
    failTypeId: '',
    personalizedFailure: '',
    newStatus: ''
  });

  // Tipos de dispositivo (catálogo estático)
  const deviceTypes = [
    { label: 'TP NEWLAND', value: 'TP_NEWLAND' },
    { label: 'LECTOR NEWLAND', value: 'LECTOR_NEWLAND' },
    { label: 'TP DOLPHIN 9900', value: 'TP_DOLPHIN_9900' },
    { label: 'LECTOR DOLPHIN 9900', value: 'LECTOR_DOLPHIN_9900' }
  ];

  // ===== Carga inicial de agencias y fallas =====
  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    axios.get("http://localhost:8080/api/workCenter", { headers })
      .then(res => setWorkCenters(res.data || []))
      .catch(err => console.error("Error al cargar agencias:", err));

    axios.get("http://localhost:8080/api/failTypeDevice", { headers })
      .then(res => setFailTypes(res.data || []))
      .catch(err => console.error("Error al cargar tipos de falla:", err));
  }, []);

  // ===== Cargar dispositivos por agencia y tipo =====
  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    // Al cambiar agencia o tipo, limpiar serie/estado/falla
    setDevices([]);
    setDeviceInfo(null);
    setFormData(prev => ({
      ...prev,
      serialNumber: '',
      failTypeId: '',
      personalizedFailure: '',
      newStatus: ''
    }));

    if (formData.deviceType && formData.workCenterId) {
      // Enviamos ambos: workCenterId (preferido) y workCenter (nombre) por compatibilidad
      const wc = workCenters.find(w => String(w.id) === String(formData.workCenterId));
      axios.get("http://localhost:8080/api/device/serialNumber", {
        params: {
          deviceType: formData.deviceType,
          workCenterId: formData.workCenterId,
          workCenter: wc?.name // por si el backend aún espera el nombre
        },
        headers
      })
        .then(res => setDevices(res.data || []))
        .catch(err => {
          console.error("Error al cargar dispositivos:", err);
          setDevices([]);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.deviceType, formData.workCenterId]);

  // ===== Manejo de cambios en campos =====
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Normalizar mayúsculas para la falla personalizada
    if (name === 'personalizedFailure') {
      setFormData(prev => ({ ...prev, personalizedFailure: value.toUpperCase() }));
      return;
    }

    if (name === 'workCenter') {
      // select de agencia ahora guarda el ID
      setFormData(prev => ({ ...prev, workCenterId: value }));
      return;
    }

    if (name === 'failType') {
      // usamos ID; 'otros' es sentinel
      setFormData(prev => ({ ...prev, failTypeId: value }));
      return;
    }

    if (name === 'serialNumber') {
      setFormData(prev => ({ ...prev, serialNumber: value, newStatus: '' }));
      const selected = devices.find(d => d.serialNumber === value);
      setDeviceInfo(selected || null);
      return;
    }

    // deviceType / newStatus
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ===== Envío del reporte =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      const selectedWC = workCenters.find(w => String(w.id) === String(formData.workCenterId));
      const failTypeDeviceId =
        formData.failTypeId === 'otros' ? null : (formData.failTypeId ? Number(formData.failTypeId) : null);

      const payload = {
        serialNumber: formData.serialNumber,
        deviceType: formData.deviceType,
        workCenterId: formData.workCenterId ? Number(formData.workCenterId) : null,
        // por compatibilidad, incluimos también el nombre (si el backend aún lo usa)
        workCenter: selectedWC?.name ?? null,
        failTypeDeviceId,
        personalizedFailure: formData.failTypeId === 'otros' ? (formData.personalizedFailure || '').trim().toUpperCase() : '',
        newStatus: deviceInfo?.status === 'DEFECTUOSO' ? formData.newStatus || null : null
      };

      await axios.post("http://localhost:8080/api/deviceReport", payload, { headers });

      setShowModal(true);
      // Reset del formulario
      setFormData({
        workCenterId: '',
        deviceType: '',
        serialNumber: '',
        failTypeId: '',
        personalizedFailure: '',
        newStatus: ''
      });
      setDevices([]);
      setDeviceInfo(null);
    } catch (error) {
      console.error("Error al enviar el reporte:", error);
      const msg = error?.response?.data?.message
        || (typeof error?.response?.data === 'string' ? error.response.data : null)
        || 'Error al enviar el reporte.';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="deviceReportContainer">
      <h1>Reportar Daño de TPS o Lector</h1>

      <form onSubmit={handleSubmit} className="deviceReportForm">
        {/* Agencia */}
        <div className="formGroup">
          <label>Centro de trabajo:</label>
          <select
            name="workCenter"
            value={formData.workCenterId}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione un centro de trabajo</option>
            {workCenters.map(center => (
              <option key={center.id} value={center.id}>
                {center.name || center.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de dispositivo */}
        <div className="formGroup">
          <label>Tipo de dispositivo:</label>
          <select
            name="deviceType"
            value={formData.deviceType}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione tipo de dispositivo</option>
            {deviceTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Número de serie */}
        <div className="formGroup">
          <label>Número de serie:</label>
          <select
            name="serialNumber"
            value={formData.serialNumber}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione número de serie</option>
            {devices.map((d) => (
              <option key={d.serialNumber} value={d.serialNumber}>{d.serialNumber}</option>
            ))}
          </select>

          {/* Estado actual */}
          {deviceInfo && (
            <p className="deviceStatus">
              <strong>Estado actual:</strong>{' '}
              <span className={deviceInfo.status === 'DEFECTUOSO' ? 'statusFaulty' : 'statusActive'}>
                {deviceInfo.status}
              </span>
            </p>
          )}
        </div>

        {/* Cambio a ACTIVO si está defectuoso */}
        {deviceInfo?.status === 'DEFECTUOSO' && (
          <div className="formGroup">
            <label>Cambiar estado a:</label>
            <select
              name="newStatus"
              value={formData.newStatus}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione nuevo estado</option>
              <option value="ACTIVO">Activo</option>
            </select>
          </div>
        )}

        {/* Selección de falla (si NO está defectuoso) */}
        {deviceInfo?.status !== 'DEFECTUOSO' && (
          <>
            <div className="formGroup">
              <label>Falla detectada:</label>
              <select
                name="failType"
                value={formData.failTypeId}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione la falla</option>
                {failTypes.map((fail) => (
                  <option key={fail.id} value={fail.id}>{fail.name}</option>
                ))}
                <option value="otros">Otros...</option>
              </select>
            </div>

            {formData.failTypeId === 'otros' && (
              <div className="formGroup">
                <label>Especifique la falla:</label>
                <input
                  type="text"
                  name="personalizedFailure"
                  value={formData.personalizedFailure}
                  onChange={handleChange}
                  placeholder="DESCRIBA LA FALLA DETECTADA"
                  required
                />
              </div>
            )}
          </>
        )}

        {/* Error API */}
        {apiError && <div className="error" style={{ marginTop: 8 }}>{apiError}</div>}

        <button type="submit" className="submitBtn" disabled={submitting}>
          {submitting ? 'Enviando…' : 'Enviar Reporte'}
        </button>
      </form>

      {/* Modal de éxito */}
      {showModal && (
        <div className="modalOverlay">
          <div className="modalContent success">
            <div className="modalIcon">✅</div>
            <h2 className="modalTitle">¡Reporte Enviado!</h2>
            <p className="modalMessage">Tu reporte se ha enviado correctamente.</p>
            <button onClick={() => setShowModal(false)} className="modalButton">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportTPSReaders;
