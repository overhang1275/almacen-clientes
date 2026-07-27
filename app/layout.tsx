import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Almacen Clientes",
  description: "Inventario fisico de materiales en consignacion"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
