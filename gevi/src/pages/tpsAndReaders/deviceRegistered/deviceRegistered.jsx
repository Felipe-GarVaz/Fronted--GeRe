import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './deviceRegistered.css';

const RegisteredDevice = () => {
  // ===== Estados principales =====
  const [devicesByAgency, setDevicesByAgency] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // ===== Cargar datos del backend =====
  useEffect(() => {
    const token = localStorage.getItem("token");

    axios.get("/api/device", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        setDevicesByAgency(response.data);
      })
      .catch(error => {
        console.error("Error al obtener dispositivos:", error);
      });
  }, []);

  // ===== Filtro por agencia =====
  const handleSearchChange = (event) => setSearchTerm(event.target.value);

  const filteredDevices = devicesByAgency.filter(device =>
    device.workCenter.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ===== Totales dinámicos =====
  const totals = filteredDevices.reduce((acc, device) => ({
    tpNewland: acc.tpNewland + device.tpNewland,
    tpNewlandDamaged: acc.tpNewlandDamaged + device.tpNewlandDamaged,
    readerNewland: acc.readerNewland + device.readerNewland,
    readerNewlandDamaged: acc.readerNewlandDamaged + device.readerNewlandDamaged,
    tpDolphin9900: acc.tpDolphin9900 + device.tpDolphin9900,
    tpDolphin9900Damaged: acc.tpDolphin9900Damaged + device.tpDolphin9900Damaged,
    readerDolphin9900: acc.readerDolphin9900 + device.readerDolphin9900,
    readerDolphin9900Damaged: acc.readerDolphin9900Damaged + device.readerDolphin9900Damaged,
    bluebird: acc.bluebird + device.bluebird,
    bluebirdDamaged: acc.bluebirdDamaged + device.bluebirdDamaged,
    phoneOthers: acc.phoneOthers + device.phoneOthers,
    phoneOthersDamaged: acc.phoneOthersDamaged + device.phoneOthersDamaged,
  }), {
    tpNewland: 0, tpNewlandDamaged: 0,
    readerNewland: 0, readerNewlandDamaged: 0,
    tpDolphin9900: 0, tpDolphin9900Damaged: 0,
    readerDolphin9900: 0, readerDolphin9900Damaged: 0,
    bluebird: 0, bluebirdDamaged: 0,
    phoneOthers: 0, phoneOthersDamaged: 0,
  });

  const totalDevices =
    totals.tpNewland + totals.readerNewland + totals.tpDolphin9900 + totals.readerDolphin9900 +
    totals.bluebird + totals.phoneOthers;

  const totalDamaged =
    totals.tpNewlandDamaged + totals.readerNewlandDamaged + totals.tpDolphin9900Damaged + totals.readerDolphin9900Damaged +
    totals.bluebirdDamaged + totals.phoneOthersDamaged;

  // ===== Renderizado =====
  return (
    <div className="deviceListContainer">
      <h1>TPs y lectores registrados</h1>

      {/* Filtro por agencia */}
      <div className="filtersSection">
        <div className="searchGroup">
          <label>Buscar por Centro de trabajo:</label>
          <input
            type="text"
            placeholder="Ej: Teziutlan"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Contadores */}
      <div className="DeviceCounters">
        <div className="counterBox TPNewland">
          <strong>TP Newland:</strong> {totals.tpNewland}<br />
          <span className="damaged">Dañados: {totals.tpNewlandDamaged}</span>
        </div>
        <div className="counterBox LectorNewland">
          <strong>Lector Newland:</strong> {totals.readerNewland}<br />
          <span className="damaged">Dañados: {totals.readerNewlandDamaged}</span>
        </div>
        <div className="counterBox TPDolfin">
          <strong>TP Dolphin 9900:</strong> {totals.tpDolphin9900}<br />
          <span className="damaged">Dañados: {totals.tpDolphin9900Damaged}</span>
        </div>
        <div className="counterBox LectorDolfin">
          <strong>Lector Dolphin 9900:</strong> {totals.readerDolphin9900}<br />
          <span className="damaged">Dañados: {totals.readerDolphin9900Damaged}</span>
        </div>
        <div className="counterBox Bluebird">
          <strong>Bluebird:</strong> {totals.bluebird}<br />
          <span className="damaged">Dañados: {totals.bluebirdDamaged}</span>
        </div>
        <div className="counterBox PhoneOthers">
          <strong>Celulares/Otros:</strong> {totals.phoneOthers}<br />
          <span className="damaged">Dañados: {totals.phoneOthersDamaged}</span>
        </div>
        <div className="counterBox TotalDamaged">
          <strong>Total Dañados:</strong> {totalDamaged}
        </div>
        <div className="counterBox Total">
          <strong>Total Dispositivos:</strong> {totalDevices}
        </div>
      </div>

      {/* Tabla principal */}
      <div className="tableContainer">
        <table>
          <thead>
            <tr>
              <th>Centro de trabajo</th>
              <th>TP Newland</th>
              <th>Lector Newland</th>
              <th>TP Dolphin 9900</th>
              <th>Lector Dolphin 9900</th>
              <th>Bluebird</th>
              <th>Celular/Otros</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.length > 0 ? (
              filteredDevices.map((device, index) => (
                <tr key={index}>
                  <td>{device.workCenter}</td>
                  <td>{device.tpNewland}</td>
                  <td>{device.readerNewland}</td>
                  <td>{device.tpDolphin9900}</td>
                  <td>{device.readerDolphin9900}</td>
                  <td>{device.bluebird}</td>
                  <td>{device.phoneOthers}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="noResults">
                  No se encontraron registros con los filtros seleccionados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RegisteredDevice;
