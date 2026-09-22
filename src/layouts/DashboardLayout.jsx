import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import PageBackground from "../components/PageBackground";
import InventoryAssistant from "../components/InventoryAssistant";

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarColapsado, setSidebarColapsado] = useState(() => {
    try {
      return localStorage.getItem("sidebar_colapsado") === "1";
    } catch {
      return false;
    }
  });

  const navItems = [
    { to: "/", label: "Inicio" },
    { to: "/productos", label: "Productos" },
    { to: "/categorias", label: "Categorías" },
    { to: "/movimientos", label: "Movimientos" },
    { to: "/reportes", label: "Reportes" },
    { to: "/configuracion", label: "Configuración" },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen w-full bg-background">
      <aside className={`sidebar${sidebarColapsado ? " collapsed" : ""} ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <span>PAPELERÍA</span>
        </div>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={`sidebar-link${item.to === window.location.pathname ? " active" : ""}`}
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {sidebarColapsado ? "▶" : "◀"}
        </button>
      </aside>

      <div className="flex-1 flex flex-col">
        <PageBackground />
        <main className="p-6 flex-1">
          <Outlet />
        </main>
      </div>

      <InventoryAssistant />
    </div>
  );
}

export default DashboardLayout;