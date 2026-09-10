import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { getLowStockProducts } from "../services/api";
import PageBackground from "../components/PageBackground";
import {
  FaHome,
  FaBoxOpen,
  FaTags,
  FaExchangeAlt,
  FaChartBar,
FaCog,
  FaBell,
  FaChevronLeft,
  FaChevronRight,
  FaUserCircle,
  FaSearch,
  FaBook,
  FaPencilAlt,
  FaPaperclip,
  FaStickyNote,
  FaRulerCombined,
  FaCut,
  FaStar,
} from "react-icons/fa";

function DashboardLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarColapsado, setSidebarColapsado] = useState(() => {
    try {
      return localStorage.getItem("sidebar_colapsado") === "1";
    } catch {
      return false;
    }
  });
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [alertas, setAlertas] = useState([]);
  const notifRef = useRef(null);

  const toggleSidebarColapsado = () => {
    setSidebarColapsado((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar_colapsado", next ? "1" : "0");
      } catch {
        // el estado se mantiene solo en memoria si localStorage no está disponible
      }
      return next;
    });
  };

  const showTopbarSearch = location.pathname === "/productos";

  useEffect(() => {
    getLowStockProducts()
      .then((data) => setAlertas(data))
      .catch(() => setAlertas([]));
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return;
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationsOpen]);

  const estadoLabel = {
    en_stock: "En stock",
    stock_bajo: "Stock bajo",
    agotado: "Agotado",
  };

  const navItems = [
    { to: "/", label: "Inicio", icon: FaHome },
    { to: "/productos", label: "Productos", icon: FaBoxOpen },
    { to: "/categorias", label: "Categorías", icon: FaTags },
    { to: "/movimientos", label: "Movimientos", icon: FaExchangeAlt },
    { to: "/reportes", label: "Reportes", icon: FaChartBar },
    { to: "/configuracion", label: "Configuración", icon: FaCog },
  ];

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className={`dashboard-layout${sidebarColapsado ? " sidebar-colapsado" : ""}`}>
      <aside className={`dashboard-sidebar ${sidebarOpen ? "open" : ""}${sidebarColapsado ? " collapsed" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-cup" aria-hidden="true">
            <FaPencilAlt className="bpc p1" />
            <FaPencilAlt className="bpc p2" />
            <FaPencilAlt className="bpc p3" />
            <FaPencilAlt className="bpc p4" />
          </span>
          <span className="brand-text">PAPELERÍA</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={closeSidebar}
              title={sidebarColapsado ? item.label : undefined}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Espacio reservado para ilustraciones */}
        <div className="sidebar-illustration" aria-hidden="true">
          <span className="ill ill-book lg">
            <FaBook />
          </span>
          <span className="ill ill-book2">
            <FaBook />
          </span>
          <span className="ill ill-pencil">
            <FaPencilAlt />
          </span>
          <span className="ill ill-ruler">
            <FaRulerCombined />
          </span>
          <span className="ill ill-clip">
            <FaPaperclip />
          </span>
          <span className="ill ill-scissors">
            <FaCut />
          </span>
          <span className="ill ill-note">
            <FaStickyNote />
          </span>
          <span className="ill ill-star">
            <FaStar />
          </span>
        </div>

        <p className="sidebar-quote handwritten">Todo para tus grandes ideas 😊</p>
      </aside>

      <button
        type="button"
        className="sidebar-collapse-btn"
        onClick={toggleSidebarColapsado}
        aria-label={sidebarColapsado ? "Expandir menú" : "Colapsar menú"}
        title={sidebarColapsado ? "Expandir" : "Colapsar"}
      >
        {sidebarColapsado ? <FaChevronRight /> : <FaChevronLeft />}
      </button>

      {sidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}

      <div className="dashboard-main">
        <PageBackground />
        <header className="dashboard-topbar">
          <button
            className="topbar-menu-btn"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
          </button>

          {showTopbarSearch && (
            <div className="topbar-search">
              <FaSearch />
              <input type="text" placeholder="Buscar productos..." />
            </div>
          )}

          <div className="topbar-right">
            <div className="notif-wrapper" ref={notifRef}>
              <button
                className="topbar-icon-btn"
                onClick={() => setNotificationsOpen((open) => !open)}
                aria-label="Notificaciones"
              >
                <FaBell />
                {alertas.length > 0 && <span className="notif-badge">{alertas.length}</span>}
              </button>
              {notificationsOpen && (
                <div className="notif-dropdown">
                  <div className="notif-title">Alertas de stock</div>
                  {alertas.length === 0 ? (
                    <p className="notif-empty">Sin alertas</p>
                  ) : (
                    <ul>
                      {alertas.map((a) => (
                        <li key={a.id}>
                          <span className="notif-name">{a.nombre}</span>
                          <span className={`notif-badge-mini ${a.estado}`}>
                            {estadoLabel[a.estado] || "Alerta"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="dropdown">
              <button
                className="topbar-user dropdown-toggle"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <FaUserCircle size={26} />
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <button className="dropdown-item" onClick={() => {}}>
                    Cerrar sesión
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </header>

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;