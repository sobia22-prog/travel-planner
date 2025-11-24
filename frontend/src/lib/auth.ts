"use client";

export interface User {
  id: number;
  username: string;
  email: string;
  role?: {
    id: number;
    name: string;
    type: string;
  };
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("travel_token") || localStorage.getItem("jwt");
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const userJson = localStorage.getItem("travel_user");
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("travel_token", token);
  localStorage.setItem("travel_user", JSON.stringify(user));
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("travel_token");
  localStorage.removeItem("travel_user");
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

