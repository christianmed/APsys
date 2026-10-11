import {
  Banknote,
  Bell,
  BookOpen,
  ClipboardList,
  Flame,
  LayoutDashboard,
  MessageSquare,
  Package,
  PlusCircle,
  Tag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  rolRequerido?: "gerencial";
  exactMatch?: boolean;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const NAVIGATION_GROUPS: NavGroup[] = [
  {
    title: "Operaciones",
    items: [
      {
        label: "Inicio",
        href: "/",
        icon: LayoutDashboard,
        exactMatch: true,
      },
      {
        label: "Pedidos",
        href: "/pedidos",
        icon: ClipboardList,
        exactMatch: true,
      },
      {
        label: "Nueva Orden",
        href: "/pedidos/nuevo",
        icon: PlusCircle,
        exactMatch: true,
      },
      {
        label: "Taller (Producción)",
        href: "/taller",
        icon: Flame,
      },
      {
        label: "Recordatorios",
        href: "/recordatorios",
        icon: Bell,
      },
    ],
  },
  {
    title: "Gestión Comercial",
    items: [
      {
        label: "Clientes",
        href: "/clientes",
        icon: Users,
      },
      {
        label: "Catálogo de Servicios",
        href: "/servicios",
        icon: Tag,
      },
      {
        label: "Plantillas WhatsApp",
        href: "/plantillas",
        icon: MessageSquare,
      },
    ],
  },
  {
    title: "Finanzas & Gerencia",
    items: [
      {
        label: "Dashboard de Ingresos",
        href: "/dashboard",
        icon: TrendingUp,
        rolRequerido: "gerencial",
        exactMatch: true,
      },
      {
        label: "Cuentas por Cobrar",
        href: "/cuentas-por-cobrar",
        icon: Wallet,
        rolRequerido: "gerencial",
      },
      {
        label: "Rotación de Servicios",
        href: "/dashboard/rotacion",
        icon: Package,
        rolRequerido: "gerencial",
      },
      {
        label: "Tasa de Cambio",
        href: "/tasas",
        icon: Banknote,
        rolRequerido: "gerencial",
      },
    ],
  },
  {
    title: "Soporte",
    items: [
      {
        label: "Guía y Ayuda",
        href: "/ayuda",
        icon: BookOpen,
      },
    ],
  },
];
