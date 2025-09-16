"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

type User = {
  id: number;
  username: string;
} | null;

type AuthContextType = {
  user: User;
  setUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);

  // TODO: Load from the localStorage on first render
  useEffect(() => {
    const stored = localStorage.getItem("USERNAME");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  // TODO: Save to localStorage whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("USERNAME", JSON.stringify(user));
    } else {
      localStorage.removeItem("USERNAME");
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
