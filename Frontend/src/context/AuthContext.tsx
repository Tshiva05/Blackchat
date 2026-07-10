"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setAccessToken } from "@/lib/api";
import { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  requestRegisterOtp: (identifier: string) => Promise<void>;
  verifyRegisterOtp: (params: {
    identifier: string;
    otp: string;
    name: string;
    username: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const res = await api.get("/users/me");
    setUser(res.data.user);
  }, []);

  // On first load, try to silently restore a session via the httpOnly refresh cookie.
  useEffect(() => {
    (async () => {
      try {
        const res = await api.post("/auth/refresh");
        const accessToken = res.data.accessToken as string;
        setAccessToken(accessToken);
        setToken(accessToken);
        await refreshUser();
      } catch (e) {
        setAccessToken(null);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshUser]);

  async function login(identifier: string, password: string) {
    const res = await api.post("/auth/login", { identifier, password });
    setAccessToken(res.data.accessToken);
    setToken(res.data.accessToken);
    setUser(res.data.user);
  }

  

async function requestRegisterOtp(identifier: string) {
  try {
    const response = await api.post("/auth/register/request-otp", { identifier });
    return response.data;
  } catch (error) {
    console.error("OTP request fault:", error);
    throw error;
  }
}
 

  async function verifyRegisterOtp(params: {
    identifier: string;
    otp: string;
    name: string;
    username: string;
    password: string;
  }) {
    const res = await api.post("/auth/register/verify-otp", params);
    setAccessToken(res.data.accessToken);
    setToken(res.data.accessToken);
    setUser(res.data.user);
  }

  async function logout() {
    await api.post("/auth/logout").catch(() => {});
    setAccessToken(null);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, accessToken: token, loading, login, requestRegisterOtp, verifyRegisterOtp, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
                                   }
