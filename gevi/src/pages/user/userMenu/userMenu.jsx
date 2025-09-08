import React, { } from "react";
import { useNavigate } from 'react-router-dom';
import '../../home/home.css';
import { useAuth } from '../../../components/useAuth';

const UserMenu = () => {
    const navigate = useNavigate();
    const { roles } = useAuth();
    const isAdmin = roles.includes("ADMIN");

    // ===== Módulos =====
    const userModules = [
        isAdmin && {
            title: "Agregar Usuario",
            icon: "➕",
            onClick: () => navigate("/agregar-usuario")
        },
        isAdmin && {
            title: "Eliminar Usuario",
            icon: "❌",
            onClick: () => navigate("/eliminar-usuario")
        }
    ].filter(Boolean);

    return (
        <div className="homeContainer">
            <main className="modulesContainer">
                {userModules.map((module, index) => (
                    <div
                        key={index}
                        className={`moduleCard ${module.disabled ? "isDisabled" : ""}`}
                        onClick={() => !module.disabled && module.onClick()}
                        role="button"
                        tabIndex={module.disabled ? -1 : 0}
                        onKeyDown={(e) => {
                            if (!module.disabled && (e.key === "Enter" || e.key === " ")) {
                                module.onClick();
                            }
                        }}
                        aria-label={`Ir a ${module.title}`}
                        aria-disabled={module.disabled ? "true" : "false"}
                    >
                        <div className="moduleIcon">{module.icon}</div>
                        <h3 className="moduleTitle">{module.title}</h3>
                    </div>
                ))}
            </main>
        </div>
    );
};

export default UserMenu;
