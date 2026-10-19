"use client";

import React, { type ReactNode } from "react";
import { AuthProvider } from "@/context/auth-context";
import { TasasProvider } from "@/context/tasas-context";
import { ThemeProvider } from "@/components/providers/theme-provider";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Proveedor unificado de contextos en el cliente para la arquitectura Client-First.
 * Mantiene la sesión activa, las tasas de cambio y el tema (claro/oscuro Tokyo Night)
 * en memoria del navegador para navegación instantánea a 0ms.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TasasProvider>
          {children}
        </TasasProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
