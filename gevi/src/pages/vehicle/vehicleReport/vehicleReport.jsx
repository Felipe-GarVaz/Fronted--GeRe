import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './vehicleReport.css';

const VehicleReport = () => {
  // ===== Estados principales =====
  const [vehicles, setVehicles] = useState([]);
  const [failTypes, setFailTypes] = useState([]);
  const [formData, setFormData] = useState({
    economico: '',
    placa: '',
    estadoActual: '',
    kilometrajeActual: '',
    nuevoEstado: '',
    tipoFalla: '',
    kilometraje: '',
    ubicacionIndisponible: '',
    fallaPersonalizada: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedFailTypeId, setSelectedFailTypeId] = useState('');
  const [showCustomFailInput, setShowCustomFailInput] = useState(false);
  const [mileageError, setMileageError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const hasSelectedSuggestion = useRef(false);

  const statusOptions = ['DISPONIBLE', 'OPERANDO CON FALLA', 'INDISPONIBLE'];

  // ===== Obtener vehículos y tipos de falla al iniciar =====
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const [vehiclesRes, failTypesRes] = await Promise.all([
          axios.get("http://localhost:8080/api/vehicles", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://localhost:8080/api/failTypes", { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setVehicles(vehiclesRes.data);
        setFailTypes(failTypesRes.data);
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      }
    };
    fetchData();
  }, []);

  // ===== Buscar sugerencias mientras escribe =====
  useEffect(() => {
    if (hasSelectedSuggestion.current) {
      hasSelectedSuggestion.current = false;
      return;
    }

    const fetchSuggestions = async () => {
      if (searchTerm.trim() === '') return setSuggestions([]);

      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:8080/api/vehicles/search?query=${encodeURIComponent(searchTerm)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuggestions(response.data);

        const match = response.data.find(v =>
          v.economico?.toLowerCase() === searchTerm.toLowerCase() ||
          v.placa?.toLowerCase() === searchTerm.toLowerCase()
        );

        if (match) {
          setFormData({
            economico: match.economical,
            placa: match.badge,
            estadoActual: match.status,
            kilometrajeActual: match.mileage,
            nuevoEstado: '',
            tipoFalla: '',
            kilometraje: '',
            ubicacionIndisponible: '',
            fallaPersonalizada: ''
          });
        }
      } catch (error) {
        console.error("Error al buscar vehículos:", error);
      }
    };

    fetchSuggestions();
  }, [searchTerm]);

  // ===== Manejadores del formulario =====
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Kilometraje: solo números y máx 6
    if (name === 'kilometraje') {
      const onlyDigits = value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({ ...prev, [name]: onlyDigits }));
      setMileageError(''); // limpiar error al teclear
      return;
    }

    // Falla personalizada: siempre en MAYÚSCULAS
    if (name === 'fallaPersonalizada') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
      return;
    }

    // Resto de campos sin cambios
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFailTypeChange = (e) => {
    const value = e.target.value;
    setSelectedFailTypeId(value);
    setFormData(prev => ({
      ...prev,
      tipoFalla: value,
      fallaPersonalizada: value === 'otros' ? prev.fallaPersonalizada : ''
    }));
    setShowCustomFailInput(value === 'otros');
  };

  const handleSelectSuggestion = (vehicle) => {
    hasSelectedSuggestion.current = true;
    setSearchTerm(`${vehicle.economical} - ${vehicle.badge}`);
    setFormData({
      economico: vehicle.economical,
      placa: vehicle.badge,
      estadoActual: vehicle.status,
      kilometrajeActual: vehicle.mileage,
      nuevoEstado: '',
      tipoFalla: '',
      kilometraje: '',
      ubicacionIndisponible: '',
      fallaPersonalizada: ''
    });
    setSuggestions([]);
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
      economico: '',
      placa: '',
      estadoActual: '',
      kilometrajeActual: '',
      nuevoEstado: '',
      tipoFalla: '',
      kilometraje: '',
      ubicacionIndisponible: '',
      fallaPersonalizada: ''
    });
  };

  const toReadableStatus = (statusEnum) => {
    switch (statusEnum) {
      case "DISPONIBLE":
        return "DISPONIBLE";
      case "OPERANDO_CON_FALLA":
        return "OPERANDO CON FALLA";
      case "INDISPONIBLE":
        return "INDISPONIBLE";
      default:
        return statusEnum;
    }
  };

  // =====Estados diferentes al actual =====
  const filteredStatusOptions = statusOptions.filter(
    (estado) => estado !== toReadableStatus(formData.estadoActual)
  );

  //===== Enviar reporte =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    const matchedVehicle = vehicles.find(v => v.economical === formData.economico);
    if (!matchedVehicle) return alert("Vehículo no encontrado.");

    const newMileage = parseInt(formData.kilometraje);
    const currentMileage = parseInt(formData.kilometrajeActual);

    if (isNaN(newMileage)) {
      setMileageError("Debe ingresar un número válido.");
      return;
    }
    if (newMileage < currentMileage) {
      setMileageError("El nuevo kilometraje no puede ser menor al kilometraje actual.");
      return;
    }

    setMileageError('');

    const token = localStorage.getItem("token");
    const newStatus = convertStatus(formData.nuevoEstado);

    const payload = {
      vehicleId: matchedVehicle.id,
      newStatus,
      mileage: newMileage
    };

    if (newStatus === 'INDISPONIBLE' || newStatus === 'OPERANDO_CON_FALLA') {
      payload.failTypeId = formData.tipoFalla === 'otros' ? null : parseInt(formData.tipoFalla);
      payload.personalizedFailure = formData.tipoFalla === 'otros' ? formData.fallaPersonalizada : null;
    }

    if (newStatus === 'INDISPONIBLE') {
      payload.locationUnavailable = convertLocation(formData.ubicacionIndisponible);
    }

    try {
      await axios.post("http://localhost:8080/api/reports", payload, {
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
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className="suggestionsList">
              {suggestions.map((v, index) => (
                <li
                  key={index}
                  className="suggestionItem"
                  onClick={() => handleSelectSuggestion(v)}
                >
                  {v.economical} - {v.badge}
                </li>
              ))}
            </ul>
          )}
        </div>

        {formData.economico && (
          <>
            <div className="vehicleInfoBox">
              <p><strong>Económico:</strong> {formData.economico}</p>
              <p><strong>Placa:</strong> {formData.placa}</p>
              <p><strong>Estado Actual:</strong> {formData.estadoActual}</p>
              <p><strong>Kilometraje Actual:</strong> {Number(formData.kilometrajeActual).toLocaleString()} km</p>
            </div>

            {/* Selección de nuevo estado */}
            <div className="formGroup">
              <label>Nuevo Estado</label>
              <select
                name="nuevoEstado"
                value={formData.nuevoEstado}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione el nuevo estado</option>
                {filteredStatusOptions.map((estado, index) => (
                  <option key={index} value={estado}>{estado}</option>
                ))}
              </select>
            </div>

            {/* Si el nuevo estado requiere ingresar falla */}
            {(formData.nuevoEstado === 'OPERANDO CON FALLA' || formData.nuevoEstado === 'INDISPONIBLE') && (
              <>
                {/* Ubicación si es indisponible */}
                {formData.nuevoEstado === 'INDISPONIBLE' && (
                  <div className="formGroup">
                    <label>Ubicación del Vehículo</label>
                    <select
                      name="ubicacionIndisponible"
                      value={formData.ubicacionIndisponible}
                      onChange={handleChange}
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
                    name="tipoFalla"
                    value={selectedFailTypeId}
                    onChange={handleFailTypeChange}
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
                      name="fallaPersonalizada"
                      value={formData.fallaPersonalizada}
                      onChange={handleChange}
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
              <input
                type="number"
                name="kilometraje"
                value={formData.kilometraje}
                onChange={handleChange}
                placeholder="Ingrese el nuevo kilometraje"
                inputMode="numeric"
                maxLength={6}
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
    </div>
  );
};

export default VehicleReport;
