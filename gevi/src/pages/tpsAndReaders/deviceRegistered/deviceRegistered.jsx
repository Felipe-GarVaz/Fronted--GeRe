import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './deviceRegistered.css';

const RegisteredDevice = () => {
  // Estado para los datos obtenidos del backend
  const [tpsReaders, setTpsReaders] = useState([]);

  // Estado para filtro por agencia
  const [filter, setFilter] = useState('');

  // Fetch inicial al montar el componente
  useEffect(() => {
    const token = localStorage.getItem("token");

    axios.get("http://localhost:8080/api/device", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(response => {
        setTpsReaders(response.data);
      })
      .catch(error => {
        console.error("Error al obtener dispositivos:", error);
      });
  }, []);

  const handleFilterChange = (e) => setFilter(e.target.value);

  // Filtrar por nombre de agencia
  const filtered = tpsReaders.filter(item =>
    item.workCenter.toLowerCase().includes(filter.toLowerCase())
  );

  // Calcular totales dinámicos
  const totals = filtered.reduce((acc, item) => ({
    tpNewland: acc.tpNewland + item.tpNewland,
    tpNewlandDamaged: acc.tpNewlandDamaged + item.tpNewlandDamaged,
    readerNewland: acc.readerNewland + item.readerNewland,
    readerNewlandDamaged: acc.readerNewlandDamaged + item.readerNewlandDamaged,
    tpDolphin9900: acc.tpDolphin9900 + item.tpDolphin9900,
    tpDolphin9900Damaged: acc.tpDolphin9900Damaged + item.tpDolphin9900Damaged,
    readerDolphin9900: acc.readerDolphin9900 + item.readerDolphin9900,
    readerDolphin9900Damaged: acc.readerDolphin9900Damaged + item.readerDolphin9900Damaged,
  }), {
    tpNewland: 0, tpNewlandDamaged: 0,
    readerNewland: 0, readerNewlandDamaged: 0,
    tpDolphin9900: 0, tpDolphin9900Damaged: 0,
    readerDolphin9900: 0, readerDolphin9900Damaged: 0
  });

  const totalDevices = totals.tpNewland + totals.readerNewland + totals.tpDolphin9900 + totals.readerDolphin9900;
  const totalDamaged = totals.tpNewlandDamaged + totals.readerNewlandDamaged + totals.tpDolphin9900Damaged + totals.readerDolphin9900Damaged;

  return (
    <div className="deviceListContainer">
      <h1>TPS y Lectores Registrados</h1>

      <div className="filtersSection">
        <div className="searchGroup">
          <label>Buscar por Agencia:</label>
          <input
            type="text"
            placeholder="Ej: Teziutlan"
            value={filter}
            onChange={handleFilterChange}
          />
        </div>
      </div>

      <div className="DeviceCounters">
        <div className="counterBox Total">
          <strong>Total Dispositivos:</strong> {totalDevices}
        </div>
        <div className="counterBox TotalDamaged">
          <strong>Total Dañados:</strong> {totalDamaged}
        </div>
        <div className="counterBox TPNewland">
          <strong>TP Newland:</strong> {totals.tpNewland}<br />
          <span className="damaged">Dañados: {totals.tpNewlandDamaged}</span>
        </div>
        <div className="counterBox LectorNewland">
          <strong>Lector Newland:</strong> {totals.readerNewland}<br />
          <span className="damaged">Dañados: {totals.readerNewlandDamaged}</span>
        </div>
        <div className="counterBox TPDolfin">
          <strong>TP Dolfin 9900:</strong> {totals.tpDolphin9900}<br />
          <span className="damaged">Dañados: {totals.tpDolphin9900Damaged}</span>
        </div>
        <div className="counterBox LectorDolfin">
          <strong>Lector Dolfin 9900:</strong> {totals.readerDolphin9900}<br />
          <span className="damaged">Dañados: {totals.readerDolphin9900Damaged}</span>
        </div>
      </div>

      <div className="tableContainer">
        <table>
          <thead>
            <tr>
              <th>Agencia</th>
              <th>TP Newland</th>
              <th>Lector Newland</th>
              <th>TP Dolfin 9900</th>
              <th>Lector Dolfin 9900</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((tp, index) => (
                <tr key={index}>
                  <td>{tp.workCenter}</td>
                  <td>{tp.tpNewland}</td>
                  <td>{tp.readerNewland}</td>
                  <td>{tp.tpDolphin9900}</td>
                  <td>{tp.readerDolphin9900}</td>
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
