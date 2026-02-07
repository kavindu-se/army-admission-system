import React, { createContext, useContext, useEffect, useState } from "react";
import { getMe, login as apiLogin, loginAdmin as apiLoginAdmin } from "../api.js";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("token")));
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem("eportalProfile");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (token) {
      setLoading(true);
      getMe()
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          setUser(null);
          setToken(null);
          localStorage.removeItem("token");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (e_no, password) => {
    const res = await apiLogin(e_no, password);
    setToken(res.data.token);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    const saved = localStorage.getItem("eportalProfile");
    setProfile(saved ? JSON.parse(saved) : null);
    return res.data.user;
  };

  const loginAdmin = async (email, password) => {
    const res = await apiLoginAdmin(email, password);
    setToken(res.data.token);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    setProfile(null);
    return res.data.user;
  };

  const loginAuto = async (identifier, password) => {
    const looksLikeEmail = identifier.includes("@");
    const attempts = looksLikeEmail ? [loginAdmin, login] : [login, loginAdmin];
    let lastError = null;
    for (const attempt of attempts) {
      try {
        const user = await attempt(identifier, password);
        return user;
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error("Login failed");
  };

  const logout = () => {
    setUser(null);  
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("eportalProfile");
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, profile, loading, login, loginAdmin, loginAuto, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
