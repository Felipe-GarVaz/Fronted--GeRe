import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './vehicleReport.css';

const VehicleReport = () => {
  // ===== Estados principales =====
  const [vehicles, setVehicles] = useState([]);
  const [failTypes, setFailTypes] = useState([]);
  const [formData, setFormData] = useState({
    economical: '',
    badge: '',
    currentStatus: '',
    currentMileage: '',
    newStatus: '',
    failType: '',
    mileage: '',
    locationUnavailable: '',
    personalizedFailure: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedFailTypeId, setSelectedFailTypeId] = useState('');
  const [showCustomFailInput, setShowCustomFailInput] = useState(false);
  const [mileageError, setMileageError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const hasSelectedSuggestion = useRef(false);

  const statusOptions = ['DISPONIBLE', 'OPERANDO CON FALLA', 'INDISPONIBLE'];

  const mileageRef = useRef(null);
  const [showErrModal, setShowErrModal] = useState(false);
  const [errMsg, setErrMsg] = useState('');


  // ===== Obtener vehículos y tipos de falla al iniciar =====
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [vehiclesRes, failTypesRes] = await Promise.all([
          axios.get("http://localhost:8080/api/vehicles", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://localhost:8080/api/failTypes", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setVehicles(vehiclesRes.data || []);
        setFailTypes(failTypesRes.data || []);
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      }
    };
    fetchData();
  }, []);

  // ===== Buscar sugerencias mientras escribe (con pequeño debounce) =====
  useEffect(() => {
    if (hasSelectedSuggestion.current) {
      hasSelectedSuggestion.current = false;
      return;
    }
    if (searchTerm.trim() === '') {
      setSuggestions([]);
      return;
    }

    const handle = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:8080/api/vehicles/search?query=${encodeURIComponent(searchTerm)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = response.data || [];
        setSuggestions(data);

        // Si el usuario escribe EXACTO el económico o la placa, autocompleta
        const match = data.find(v =>
          v.economical?.toLowerCase() === searchTerm.toLowerCase() ||
          v.badge?.toLowerCase() === searchTerm.toLowerCase()
        );

        if (match) {
          setFormData({
            economical: match.economical,
            badge: match.badge,
            currentStatus: match.status,
            currentMileage: match.mileage,
            newStatus: '',
            failType: '',
            mileage: '',
            locationUnavailable: '',
            personalizedFailure: ''
          });
          setSelectedFailTypeId('');
          setShowCustomFailInput(false);
        }
      } catch (error) {
        console.error("Error al buscar vehículos:", error);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [searchTerm]);

  // ===== Utilidades =====
  const toReadableStatus = (statusEnum) => {
    switch (statusEnum) {
      case "DISPONIBLE":
        return "DISPONIBLE";
      case "OPERANDO_CON_FALLA":
        return "OPERANDO CON FALLA";
      case "INDISPONIBLE":
        return "INDISPONIBLE";
      default:
        return statusEnum || '';
    }
  };

  const convertStatus = (text) => {
    if (text === 'DISPONIBLE') return 'DISPONIBLE';
    if (text === 'OPERANDO CON FALLA') return 'OPERANDO_CON_FALLA';
    if (text === 'INDISPONIBLE') return 'INDISPONIBLE';
    return '';
  };

  const convertLocation = (text) => {
    if (text === 'TALLER') return 'TALLER';
    if (text === 'PATIO') return 'PATIO';
    return null;
  };

  const resetForm = () => {
    setFormData({
      economical: '',
      badge: '',
      currentStatus: '',
      currentMileage: '',
      newStatus: '',
      failType: '',
      mileage: '',
      locationUnavailable: '',
      personalizedFailure: ''
    });
    setSelectedFailTypeId('');
    setShowCustomFailInput(false);
    setMileageError('');
  };

  // ===== Estados diferentes al actual =====
  const filteredStatusOptions = statusOptions.filter(
    (status) => status !== toReadableStatus(formData.currentStatus)
  );

  const setInvalidMsg = (e, msg) => e.target.setCustomValidity(msg);
  const clearInvalidMsg = (e) => e.target.setCustomValidity('');

  // ===== Manejadores del formulario =====
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Kilometraje: solo números y máx 6
    if (name === 'mileage') {
      const onlyDigits = value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({ ...prev, [name]: onlyDigits }));
      setMileageError(''); // limpiar error al teclear
      return;
    }

    // Falla personalizada: siempre en MAYÚSCULAS
    if (name === 'personalizedFailure') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
      return;
    }

    // Si cambia el estado y es DISPONIBLE, limpia campos de falla/ubicación
    if (name === 'newStatus') {
      const next = value;
      setFormData(prev => ({
        ...prev,
        newStatus: next,
        ...(next === 'DISPONIBLE'
          ? { failType: '', personalizedFailure: '', locationUnavailable: '' }
          : {})
      }));
      if (value === 'DISPONIBLE') {
        setSelectedFailTypeId('');
        setShowCustomFailInput(false);
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFailTypeChange = (e) => {
    const value = e.target.value;
    setSelectedFailTypeId(value);
    setFormData(prev => ({
      ...prev,
      failType: value,
      personalizedFailure: value === 'otros' ? prev.personalizedFailure : ''
    }));
    setShowCustomFailInput(value === 'otros');
  };

  const handleSelectSuggestion = (vehicle) => {
    hasSelectedSuggestion.current = true;
    setSearchTerm(`${vehicle.economical} - ${vehicle.badge}`);
    setFormData({
      economical: vehicle.economical,
      badge: vehicle.badge,
      currentStatus: vehicle.status,
      currentMileage: vehicle.mileage,
      newStatus: '',
      failType: '',
      mileage: '',
      locationUnavailable: '',
      personalizedFailure: ''
    });
    setSelectedFailTypeId('');
    setShowCustomFailInput(false);
    setSuggestions([]);
  };

  //===== Enviar reporte =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    const matchedVehicle = vehicles.find(v => v.economical === formData.economical);
    if (!matchedVehicle) {
      alert("Vehículo no encontrado.");
      return;
    }

    const newMileage = parseInt(formData.mileage, 10);
    const currentMileage = Number.isFinite(parseInt(formData.currentMileage, 10))
      ? parseInt(formData.currentMileage, 10)
      : 0;

    if (isNaN(newMileage)) {
      setErrMsg("Debe ingresar un número válido de kilometraje.");
      setShowErrModal(true);
      return;
    }
    if (newMileage < currentMileage) {
      setErrMsg(
        `El nuevo kilometraje (${newMileage.toLocaleString()}) no puede ser menor al actual (${currentMileage.toLocaleString()}).`
      );
      setShowErrModal(true);
      return;
    }
    setMileageError('');

    const token = localStorage.getItem("token");
    const newStatus = convertStatus(formData.newStatus);

    const payload = {
      vehicleId: matchedVehicle.id,
      newStatus,
      mileage: newMileage
    };

    if (newStatus === 'INDISPONIBLE' || newStatus === 'OPERANDO_CON_FALLA') {
      payload.failTypeId = formData.failType === 'otros' ? null : parseInt(formData.failType, 10);
      payload.personalizedFailure = formData.failType === 'otros' ? formData.personalizedFailure : null;
    }

    if (newStatus === 'INDISPONIBLE') {
      payload.locationUnavailable = convertLocation(formData.locationUnavailable);
    }

    try {
      await axios.post("http://localhost:8080/api/vehicle-report", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      setShowModal(true);
      setSearchTerm('');
      resetForm();
    } catch (error) {
      console.error("Error al enviar reporte:", error);
      alert("Error al enviar el reporte.");
    }
  };

  //===== Renderizado =====
  const currentMileageDisplay =
    formData.currentMileage !== '' && formData.currentMileage !== null && formData.currentMileage !== undefined
      ? Number(formData.currentMileage).toLocaleString()
      : '-';

  return (
    <div className="reportContainer">
      <h1 className="formTitle">Reportar Estado de Vehículo</h1>
      <form onSubmit={handleSubmit} className="reportForm">
        {/* Búsqueda del vehículo */}
        <div className="formGroup searchContainer">
          <label>Buscar Vehículo</label>
          <input
            type="text"
            placeholder="Buscar por número económico o placa"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
            onInvalid={(e) => setInvalidMsg(e, 'Econmico y/o placa invalido')}
            onInput={clearInvalidMsg}
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className="suggestionsList">
              {suggestions.map((v) => (
                <li
                  key={v.id ?? `${v.economical}-${v.badge}`}
                  className="suggestionItem"
                  onClick={() => handleSelectSuggestion(v)}
                >
                  {v.economical} - {v.badge}
                </li>
              ))}
            </ul>
          )}
        </div>

        {formData.economical && (
          <>
            <div className="vehicleInfoBox">
              <p><strong>Económico:</strong> {formData.economical}</p>
              <p><strong>Placa:</strong> {formData.badge}</p>
              <p><strong>Estado Actual:</strong> {toReadableStatus(formData.currentStatus)}</p>
              <p><strong>Kilometraje Actual:</strong> {currentMileageDisplay} km</p>
            </div>

            {/* Selección de nuevo estado */}
            <div className="formGroup">
              <label>Nuevo Estado</label>
              <select
                name="newStatus"
                value={formData.newStatus}
                onChange={handleChange}
                onInvalid={(e) => setInvalidMsg(e, 'Seleccione un estado')}
                onInput={clearInvalidMsg}
                required
              >
                <option value="">Seleccione el nuevo estado</option>
                {filteredStatusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Si el nuevo estado requiere ingresar falla */}
            {(formData.newStatus === 'OPERANDO CON FALLA' || formData.newStatus === 'INDISPONIBLE') && (
              <>
                {/* Ubicación si es indisponible */}
                {formData.newStatus === 'INDISPONIBLE' && (
                  <div className="formGroup">
                    <label>Ubicación del Vehículo</label>
                    <select
                      name="locationUnavailable"
                      value={formData.locationUnavailable}
                      onChange={handleChange}
                      onInvalid={(e) => setInvalidMsg(e, 'Seleccione la ubicacion')}
                      onInput={clearInvalidMsg}
                      required
                    >
                      <option value="">Seleccione ubicación</option>
                      <option value="TALLER">TALLER</option>
                      <option value="PATIO">PATIO</option>
                    </select>
                  </div>
                )}

                {/* Tipo de falla */}
                <div className="formGroup">
                  <label>Falla Detectada</label>
                  <select
                    name="failType"
                    value={selectedFailTypeId}
                    onChange={handleFailTypeChange}
                    onInvalid={(e) => setInvalidMsg(e, 'Seleccione la falla')}
                    onInput={clearInvalidMsg}
                    required
                  >
                    <option value="">Seleccione la falla</option>
                    {failTypes.map((failType) => (
                      <option key={failType.id} value={failType.id}>
                        {failType.name}
                      </option>
                    ))}
                    <option value="otros">OTRO...</option>
                  </select>
                </div>

                {/* Falla personalizada si aplica */}
                {showCustomFailInput && (
                  <div className="formGroup">
                    <label>Especifique la falla</label>
                    <input
                      type="text"
                      name="personalizedFailure"
                      value={formData.personalizedFailure}
                      onChange={handleChange}
                      onInvalid={(e) => setInvalidMsg(e, 'Escriba la falla particular')}
                      onInput={clearInvalidMsg}
                      placeholder="Describa la falla detectada"
                      required
                    />
                  </div>
                )}
              </>
            )}

            {/* Kilometraje nuevo */}
            <div className="formGroup">
              <label>Nuevo Kilometraje</label>
              {/* Usamos text + inputMode para poder limitar longitud */}
              <input
                ref={mileageRef}           // <-- NUEVO
                type="number"
                name="mileage"
                value={formData.mileage}
                onChange={handleChange}
                onInvalid={(e) => setInvalidMsg(e, 'El kilometraje debe ser igual o mayor al actual')}
                onInput={clearInvalidMsg}
                placeholder="Ej. 120000"
                max="999999"
                step="1"
                required
              />
              {mileageError && <p className="error">{mileageError}</p>}
            </div>

            {/* Botón de envío */}
            <button type="submit" className="submitBtn">Enviar Reporte</button>
          </>
        )}
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

      {/* Modal de ERROR por kilometraje */}
      {showErrModal && (
        <div className="modalOverlay">
          <div className="modalContent error">
            <div className="modalIcon">⚠️</div>
            <h2 className="modalTitle">No se pudo enviar</h2>
            <p className="modalMessage">{errMsg}</p>
            <button className="modalButton" onClick={() => setShowErrModal(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleReport;
