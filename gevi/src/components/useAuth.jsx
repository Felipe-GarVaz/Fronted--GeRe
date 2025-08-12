import { jwtDecode } from "jwt-decode";

function isExpired(payload) {
  if (!payload?.exp) return false;
  const nowInSec = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSec;
}

function normalizeRole(r) {
  return r?.toString()
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, ""); // ROLE_ADMIN -> ADMIN
}

export function useAuth() {
  const token = localStorage.getItem("token");
  if (!token) return { isAuth: false, roles: [], token: null };

  try {
    const payload = jwtDecode(token);
    if (isExpired(payload)) {
      localStorage.removeItem("token");
      return { isAuth: false, roles: [], token: null };
    }

    // Acepta "roles" o "authorities"; array o string
    let raw = payload.roles ?? payload.authorities ?? [];
    if (!Array.isArray(raw)) {
      raw = String(raw).split(","); // "ADMIN,USER" -> ["ADMIN","USER"]
    }
    const roles = raw.map(normalizeRole).filter(Boolean);

    return { isAuth: true, roles, token };
  } catch (e) {
    return { isAuth: false, roles: [], token: null };
  }
}

export function hasAnyRole(userRoles = [], allowed = []) {
  const normUser = userRoles.map(normalizeRole);
  const normAllowed = allowed.map(normalizeRole);
  return normAllowed.length === 0 || normAllowed.some(r => normUser.includes(r));
}

export function hasAllRoles(userRoles = [], required = []) {
  const normUser = userRoles.map(normalizeRole);
  const normReq = required.map(normalizeRole);
  return normReq.every(r => normUser.includes(r));
}
