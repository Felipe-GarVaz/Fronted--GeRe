import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import gestionImage from '../../assets/images/GEVIDI.png';
import axios from "axios";

const Login = () => {

  // ===== Estados del formulario =====
  const [rpe, setRpe] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // ===== Envío del formulario =====
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:8080/auth/login", {
        rpe,
        password
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const { token, name, roles } = response.data;

      // Guardar sesión en localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("rpe", rpe);
      localStorage.setItem("nombre", name);

      console.log('roles backend', roles);

      // Redirigir al home
      navigate("/home");

    } catch (error) {
      setRpe("");
      setPassword("");

      if (error.response?.status === 401 || error.response?.status === 403) {
        setErrorMessage("Credenciales incorrectas");
      } else if (error.code === "ERR_NETWORK") {
        setErrorMessage("No se pudo conectar con el servidor");
      } 
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Renderizado ===== 
  return (
    <div className="loginContainer">
      <div className="loginCard">
        <h1 className="title">GEVIDI</h1>
        <p className="subtitle">Gestor de Vehículos y Dispositivos</p>
        <img src={gestionImage} alt="Logo Gestión" className="logo" />

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <span className="icon">👤</span>
            <input
              type="text"
              placeholder="RPE"
              value={rpe}
              onChange={(e) => {
                            const upper = e.target.value.toUpperCase();
                            setRpe(upper);
                            setErrorMessage("");
                        }}
              required
            />
          </div>

          <div className="formGroup">
            <span className="icon">🔒</span>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Mensaje de error */}
          {errorMessage && (
            <div className="errorMessage">{errorMessage}</div>
          )}

          <button
            type="submit"
            className="btnLogin"
            disabled={isLoading || !rpe || !password}
          >
            {isLoading ? "Cargando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
