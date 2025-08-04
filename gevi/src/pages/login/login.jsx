import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import gestion from '../../assets/images/gestion.png';
import axios from "axios";

const Login = () => {
  const [rpe, setRpe] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8080/auth/login",
        { rpe, password },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      // Desestructuramos los datos de la respuesta
      const { token, name } = response.data;

      // Guardar en localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("rpe", rpe);
      // Recuperar el nombre para visualizar
      localStorage.setItem("nombre", name);

      navigate("/home");
    } catch (error) {
      //Limpiar campos
      setRpe("");
      setPassword("");

      if (error.response?.status === 403 || error.response?.status === 401) {
        setErrorMessage("Credenciales incorrectas");
      } else if (error.code === "ERR_NETWORK") {
        setErrorMessage("No se pudo conectar con el servidor");
      } else {
        setErrorMessage("Ocurrió un error inesperado");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="loginContainer">
      <div className="loginCard">
        <h1 className="title">GERE</h1>
        <p className="subtitle">Gestión De Recursos</p>
        <img src={gestion} alt="gestion" className="logo" />

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <span className="icon">👤</span>
            <input
              type="text"
              placeholder="RPE"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
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

          {errorMessage && <div className="error-message">{errorMessage}</div>}

          <button type="submit" className="btnLogin" disabled={isLoading || !rpe || !password}>
            {isLoading ? "Cargando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
