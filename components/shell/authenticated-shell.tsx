"use client";

import React, { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useTasas } from "@/context/tasas-context";
import { AppShell } from "./app-shell";

type Props = {
  children: ReactNode;
};

/**
 * Envoltorio de Cliente Reactivo que consume sesión, perfil y tasas directamente
 * desde la memoria del navegador (AuthContext y TasasContext), garantizando navegación
 * instantánea (0ms) sin bloqueos de servidor.
 */
export function AuthenticatedShell({ children }: Props) {
  const router = useRouter();
  const { user, perfil, isLoading, signOut } = useAuth();
  const { tasaUsd, tasaEur, tasaSiguiente } = useTasas();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  const handleCerrarSesion = async () => {
    await signOut();
    router.push("/login");
  };

  const usuarioEmail = user?.email ?? "Usuario";
  const usuarioRol =
    perfil?.rol ?? (user as { role?: string } | null)?.role ?? "operativo";

  return (
    <AppShell
      usuarioEmail={usuarioEmail}
      usuarioRol={usuarioRol}
      tasaHoy={tasaUsd}
      tasaEurHoy={tasaEur}
      tasaSiguiente={tasaSiguiente}
      accionCerrarSesion={handleCerrarSesion}
    >
      {children}
    </AppShell>
  );
}
