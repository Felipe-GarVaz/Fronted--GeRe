import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './deviceCreate.css';

const AddDevice = () => {
  // ===== Estado del formulario =====
  const [formData, setFormData] = useState({
    serialNumber: '',
    deviceType: '',
    workCenterId: ''
  });

  const [workCenters, setWorkCenters] = useState([]);
  const [apiError, setApiError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Unicidad del número de serie
  const [checkingSerial, setCheckingSerial] = useState(false);
  const [serialTaken, setSerialTaken] = useState(false);
  const normalizedSerial = useMemo(
    () => formData.serialNumber.trim().toUpperCase(),
    [formData.serialNumber]
  );

  // ===== Catálogos =====
  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    axios
      .get('http://localhost:8080/api/workCenter', { headers })
      .then((res) => setWorkCenters(res.data || []))
      .catch((err) => {
        console.error('Error cargando catálogos:', err);
      });
  }, []);

  // Autoseleccionar centro de trabajo si solo hay uno
  useEffect(() => {
    if (workCenters.length === 1 && !formData.workCenterId) {
      setFormData((p) => ({ ...p, workCenterId: workCenters[0].id }));
    }
  }, [workCenters]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== Validación nativa (globitos) =====
  const setInvalidMsg = (e, msg) => e.target.setCustomValidity(msg);
  const clearInvalidMsg = (e) => e.target.setCustomValidity('');

  // ===== Cambio de campos =====
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'serialNumber') {
      // Mayúsculas, A-Z 0-9 y guion, máximo 50
      const normalized = value
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, '')
        .slice(0, 50);
      setFormData((prev) => ({ ...prev, serialNumber: normalized }));
      return;
    }

    if (name === 'workCenterId') {
      setFormData((prev) => ({
        ...prev,
        workCenterId: value === '' ? '' : Number(value),
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ===== Chequeo de unicidad con debounce =====
  useEffect(() => {
    if (!normalizedSerial || normalizedSerial.length < 3) {
      setSerialTaken(false);
      return;
    }

    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        setCheckingSerial(true);
        const token = localStorage.getItem('token');
        const { data } = await axios.get(
          `http://localhost:8080/api/devices/search?query=${encodeURIComponent(
            normalizedSerial
          )}`,
          { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
        );

        // Consideramos "tomado" si hay coincidencia exacta por serialNumber
        const exists = Array.isArray(data)
          ? data.some((d) => (d.serialNumber || '').toUpperCase() === normalizedSerial)
          : false;

        setSerialTaken(exists);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Error verificando número de serie:', err);
          // ante error de red, no bloquear por unicidad
          setSerialTaken(false);
        }
      } finally {
        setCheckingSerial(false);
      }
    }, 300);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [normalizedSerial]);

  // ===== Envío =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    // Validación extra por unicidad
    if (serialTaken) {
      setApiError('Ya existe un dispositivo con ese número de serie.');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const payload = {
        serialNumber: normalizedSerial,
        deviceType: formData.deviceType,
        workCenterId:
          formData.workCenterId === '' ? '' : Number(formData.workCenterId),
        status: 'ACTIVO',
      };

      await axios.post('http://localhost:8080/api/device', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setShowModal(true);
      // limpiar formulario
      setFormData({
        serialNumber: '',
        deviceType: '',
        workCenterId: '',
      });
      setSerialTaken(false);
    } catch (err) {
      console.error('Error al registrar dispositivo:', err);
      const code = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === 'string' ? err.response.data : null) ||
        (code === 401 || code === 403
          ? 'Sesión expirada o sin permisos.'
          : code === 409
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

      <form onSubmit={handleSubmit} className="reportForm" noValidate>
        {/* Número de serie */}
        <div className="formGroup">
          <label htmlFor="serialNumber">Número de serie</label>
          <div className="inputWithHint">
            <input
              id="serialNumber"
              type="text"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleChange}
              onInvalid={(e) =>
                setInvalidMsg(e, 'Use letras mayúsculas, números o guiones (3-50).')
              }
              onInput={clearInvalidMsg}
              placeholder="Ej. ABC-123456"
              autoComplete="off"
              inputMode="text"
              minLength={3}
              maxLength={50}
              pattern="^[A-Z0-9-]{3,50}$"
              title="Use letras, números o guiones (3-50)"
              required
              aria-invalid={serialTaken ? 'true' : 'false'}
            />
            <span className="hint" aria-live="polite">
              {checkingSerial
                ? 'Verificando…'
                : serialTaken
                ? 'Ya está en uso'
                : formData.serialNumber
                ? 'Disponible'
                : ''}
            </span>
          </div>
          {serialTaken && (
            <div className="error">Ya existe un dispositivo con ese número de serie.</div>
          )}
        </div>

        {/* Tipo de dispositivo */}
        <div className="formGroup">
          <label htmlFor="deviceType">Tipo de dispositivo</label>
          <select
            id="deviceType"
            name="deviceType"
            value={formData.deviceType}
            onChange={handleChange}
            onInvalid={(e) => setInvalidMsg(e, 'Seleccione un tipo')}
            onInput={clearInvalidMsg}
            required
          >
            <option value="">Seleccione tipo</option>
            <option value="TP_NEWLAND">TP NEWLAND</option>
            <option value="LECTOR_NEWLAND">LECTOR NEWLAND</option>
            <option value="TP_DOLPHIN_9900">TP DOLPHIN 9900</option>
            <option value="LECTOR_DOLPHIN_9900">LECTOR DOLPHIN 9900</option>
          </select>
        </div>

        {/* Centro de trabajo */}
        <div className="formGroup">
          <label htmlFor="workCenterId">Agencia</label>
          <select
            id="workCenterId"
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
        <button
          type="submit"
          className="submitBtn"
          disabled={submitting || checkingSerial || serialTaken}
          title={serialTaken ? 'El número de serie ya existe' : undefined}
        >
          {submitting ? 'Guardando...' : 'Guardar Dispositivo'}
        </button>
      </form>

      {/* Modal de éxito */}
      {showModal && (
        <div className="modalOverlay" role="dialog" aria-modal="true">
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
