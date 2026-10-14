"use client";

import React, { type ReactNode } from "react";
import { AuthProvider } from "@/context/auth-context";
import { TasasProvider } from "@/context/tasas-context";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Proveedor unificado de contextos en el cliente para la arquitectura Client-First.
 * Mantiene la sesión activa y las tasas de cambio en memoria del navegador
 * para navegación instantánea a 0ms.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <TasasProvider>
        {children}
      </TasasProvider>
    </AuthProvider>
  );
}
