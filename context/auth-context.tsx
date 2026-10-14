"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type PerfilUsuario = {
  rol: string;
  nombre?: string;
} | null;

export type UsuarioSesion = {
  id: string;
  email?: string;
  role?: string;
};

export interface AuthContextType {
  user: UsuarioSesion | User | null;
  session: Session | null;
  perfil: PerfilUsuario;
  rol: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export interface AuthProviderProps {
  children: React.ReactNode;
  initialUser?: UsuarioSesion | User | null;
  initialPerfil?: PerfilUsuario;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Proveedor de contexto de autenticación y rol para la arquitectura Client-First.
 * Mantiene la sesión en memoria del navegador eliminando bloqueos de servidor
 * en la navegación entre módulos.
 */
export function AuthProvider({
  children,
  initialUser = null,
  initialPerfil = null,
}: AuthProviderProps) {
  const [user, setUser] = useState<UsuarioSesion | User | null>(initialUser);
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<PerfilUsuario>(initialPerfil);
  const [isLoading, setIsLoading] = useState<boolean>(!initialUser);

  const rol = useMemo(() => {
    return perfil?.rol ?? (user as { role?: string } | null)?.role ?? null;
  }, [perfil, user]);

  const isAuthenticated = Boolean(user);

  const fetchPerfil = useCallback(async (userId: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("perfiles")
        .select("rol")
        .eq("usuario_id", userId)
        .maybeSingle();

      if (!error && data) {
        setPerfil(data as PerfilUsuario);
      } else {
        setPerfil(null);
      }
    } catch {
      setPerfil(null);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const currentSession = data.session;
    setSession(currentSession);
    setUser(currentSession?.user ?? null);
    if (currentSession?.user) {
      await fetchPerfil(currentSession.user.id);
    } else {
      setPerfil(null);
    }
    setIsLoading(false);
  }, [fetchPerfil]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // 1. Si no hay usuario inicial, cargar sesión activa desde Supabase
    if (!initialUser) {
      supabase.auth.getSession().then((res: { data: { session: Session | null } }) => {
        const currentSession = res.data.session;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          fetchPerfil(currentSession.user.id).finally(() => {
            setIsLoading(false);
          });
        } else {
          setIsLoading(false);
        }
      });
    }

    // 2. Suscribirse a cambios de sesión en tiempo real (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, newSession: Session | null) => {
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);

      if (newUser) {
        await fetchPerfil(newUser.id);
      } else {
        setPerfil(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialUser, fetchPerfil]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setPerfil(null);
  }, []);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      perfil,
      rol,
      isLoading,
      isAuthenticated,
      signOut,
      refreshSession,
    }),
    [user, session, perfil, rol, isLoading, isAuthenticated, signOut, refreshSession],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para consumir la sesión y rol del usuario en cualquier Client Component
 * sin latencia de red.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
  }
  return context;
}
