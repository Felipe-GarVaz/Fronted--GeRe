import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './deviceReport.css';

const ReportTPSReaders = () => {
  const [workCenter, setWorkCenter] = useState([]);
  const [devices, setDevices] = useState([]);
  const [failTypes, setFailTypes] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Lista estática basada en los valores ENUM reales
  const deviceTypes = [
    { label: 'TP NEWLAND', value: 'TP_NEWLAND' },
    { label: 'LECTOR NEWLAND', value: 'LECTOR_NEWLAND' },
    { label: 'TP DOLPHIN 9900', value: 'TP_DOLPHIN_9900' },
    { label: 'LECTOR DOLPHIN 9900', value: 'LECTOR_DOLPHIN_9900' }
  ];

  const [formData, setFormData] = useState({
    workCenter: '',
    deviceType: '',
    serialNumber: '',
    failType: '',
    personalizedFailure: '',
    newStatus: ''
  });

  // Carga agencias y tipos de falla
  useEffect(() => {
    const token = localStorage.getItem("token");

    axios.get("http://localhost:8080/api/workCenter", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setWorkCenter(res.data))
      .catch(err => console.error("Error al cargar agencias:", err));

    axios.get("http://localhost:8080/api/failTypeDevice", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setFailTypes(res.data))
      .catch(err => console.error("Error al cargar tipos de falla:", err));
  }, []);

  // Carga dispositivos según tipo y agencia seleccionados
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (formData.deviceType && formData.workCenter) {
      axios.get(`http://localhost:8080/api/device/serialNumber`, {
        params: {
          deviceType: formData.deviceType,
          workCenter: formData.workCenter
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => setDevices(res.data))
        .catch(err => {
          console.error("Error al cargar dispositivos:", err);
          setDevices([]);
        });
    } else {
      setDevices([]);
    }
  }, [formData.deviceType, formData.workCenter]);

  // Manejo de cambios de campos
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'serialNumber') {
      const selected = devices.find(d => d.serialNumber === value);
      setDeviceInfo(selected || null);

      // Si el dispositivo es ACTIVO, limpiamos newStatus
      setFormData(prev => ({ ...prev, newStatus: '' }));
    }
  };

  // Enviar reporte al backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const selectedWorkCenter = workCenter.find(wc => wc.name === formData.workCenter);
    const workCenterId = selectedWorkCenter?.id || null;

    const failTypeDeviceId = formData.failType === 'otros'
      ? null
      : failTypes.find(f => f.name === formData.failType)?.id || null;

    const payload = {
      serialNumber: formData.serialNumber,
      deviceType: formData.deviceType,
      workCenterId: workCenterId,
      failTypeDeviceId: failTypeDeviceId,
      personalizedFailure: formData.failType === 'otros' ? formData.personalizedFailure : '',
      newStatus: deviceInfo?.status === 'DEFECTUOSO' ? formData.newStatus : null
    };
    console.log("Payload enviado al backend:", payload);
    try {
      await axios.post("http://localhost:8080/api/deviceReport", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowModal(true);

      // Reset
      setFormData({
        workCenter: '',
        deviceType: '',
        serialNumber: '',
        failType: '',
        personalizedFailure: ''
      });


      setDevices([]);
      setDeviceInfo(null);
    } catch (error) {
      console.error("Error al enviar el reporte:", error);
      alert("Error al enviar el reporte");
    }
  };

  return (
    <div className="device-report-container">
      <h1>Reportar Daño de TPS o Lector</h1>

      <form onSubmit={handleSubmit} className="device-report-form">
        {/* Agencia */}
        <div className="form-group">
          <label>Agencia:</label>
          <select name="workCenter" value={formData.workCenter} onChange={handleChange} required>
            <option value="">Seleccione una agencia</option>
            {workCenter.map((center) => (
              <option key={center.id} value={center.name}>{center.name}</option>
            ))}
          </select>
        </div>

        {/* Tipo de dispositivo */}
        <div className="form-group">
          <label>Tipo de dispositivo:</label>
          <select name="deviceType" value={formData.deviceType} onChange={handleChange} required>
            <option value="">Seleccione tipo</option>
            {deviceTypes.map((type, index) => (
              <option key={index} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Número de serie */}
        <div className="form-group">
          <label>Número de serie:</label>
          <select name="serialNumber" value={formData.serialNumber} onChange={handleChange} required>
            <option value="">Seleccione número de serie</option>
            {devices.map((device, index) => (
              <option key={index} value={device.serialNumber}>{device.serialNumber}</option>
            ))}
          </select>

          {/* Estado actual del dispositivo */}
          {deviceInfo && (
            <p style={{ marginTop: '8px', fontWeight: '500' }}>
              <strong>Estado actual:</strong>{' '}
              <span className={deviceInfo.status === 'DEFECTUOSO' ? 'estado-dañado' : 'estado-activo'}>
                {deviceInfo.status}
              </span>
            </p>
          )}
        </div>

        {/* Si el estado actual es DEFECTUOSO, mostrar opción para cambiar a ACTIVO */}
        {deviceInfo && deviceInfo.status === 'DEFECTUOSO' && (
          <div className="form-group">
            <label>Cambiar estado a:</label>
            <select name="newStatus" value={formData.newStatus} onChange={handleChange} required>
              <option value="">Seleccione nuevo estado</option>
              <option value="ACTIVO">Activo</option>
            </select>
          </div>
        )}

        {/* Mostrar falla detectada solo si el estado no es DEFECTUOSO */}
        {!(deviceInfo && deviceInfo.status === 'DEFECTUOSO') && (
          <>
            <div className="form-group">
              <label>Falla detectada:</label>
              <select name="failType" value={formData.failType} onChange={handleChange} required>
                <option value="">Seleccione la falla</option>
                {failTypes.map((fail) => (
                  <option key={fail.id} value={fail.name}>{fail.name}</option>
                ))}
                <option value="otros">Otros...</option>
              </select>
            </div>

            {formData.failType === 'otros' && (
              <div className="form-group">
                <label>Especifique la falla:</label>
                <input
                  type="text"
                  name="personalizedFailure"
                  value={formData.personalizedFailure}
                  onChange={handleChange}
                  placeholder="Describa la falla detectada"
                  required
                />
              </div>
            )}
          </>
        )}

        <button type="submit" className="submit-btn">Enviar Reporte</button>
      </form>

      {/* Modal de éxito */}
      {showModal && (
        <div className="modalOverlay">
          <div className="modalContent success">
            <div className="modalIcon">✅</div>
            <h2 className="modalTitle">¡Reporte Enviado!</h2>
            <p className="modalMessage">Tu reporte se ha enviado correctamente.</p>
            <button onClick={() => setShowModal(false)} className="modalButton">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>

  );
};

export default ReportTPSReaders;
