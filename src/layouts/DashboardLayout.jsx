import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { getLowStockProducts } from "../services/api";
import PageBackground from "../components/PageBackground";
import InventoryAssistant from "../components/InventoryAssistant";
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
  const navRef = useRef(null);
  const indicatorRef = useRef(null);
  const bottomNavRef = useRef(null);

  const updateSidebarIndicator = useCallback(() => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    if (!nav || !indicator) return;
    const activeLink = nav.querySelector(".sidebar-link.active");
    if (!activeLink) {
      indicator.style.opacity = "0";
      return;
    }
    indicator.style.transform = `translateY(${activeLink.offsetTop}px)`;
    indicator.style.height = `${activeLink.offsetHeight}px`;
    indicator.style.opacity = "1";
  }, []);

  useEffect(() => {
    updateSidebarIndicator();
  }, [location.pathname, sidebarColapsado, updateSidebarIndicator]);

  useEffect(() => {
    window.addEventListener("resize", updateSidebarIndicator);
    return () => window.removeEventListener("resize", updateSidebarIndicator);
  }, [updateSidebarIndicator]);

  const updateBottomNavNotch = useCallback(() => {
    const bar = bottomNavRef.current;
    if (!bar) return;
    const active = bar.querySelector(".bottom-nav-link.active");
    if (!active) return;
    const center = active.offsetLeft + active.offsetWidth / 2;
    bar.style.setProperty("--nav-notch-x", `${center}px`);
  }, []);

  useLayoutEffect(() => {
    updateBottomNavNotch();
  }, [location.pathname, updateBottomNavNotch]);

  useEffect(() => {
    window.addEventListener("resize", updateBottomNavNotch);
    return () => window.removeEventListener("resize", updateBottomNavNotch);
  }, [updateBottomNavNotch]);

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
    { to: "/movimientos", label: "Movimientos", icon: FaExchangeAlt },
    { to: "/productos", label: "Productos", icon: FaBoxOpen },
    { to: "/categorias", label: "Categorías", icon: FaTags },
    { to: "/reportes", label: "Reportes", icon: FaChartBar },
    { to: "/configuracion", label: "Configuración", icon: FaCog },
  ];

  const mobileNavItems = [
    { to: "/", label: "Inicio", icon: FaHome },
    { to: "/movimientos", label: "Movimientos", icon: FaExchangeAlt },
    { to: "/productos", label: "Productos", icon: FaBoxOpen },
    { to: "/categorias", label: "Categorías", icon: FaTags },
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

        <nav className="sidebar-nav" ref={navRef}>
          <div className="sidebar-active-indicator" ref={indicatorRef} aria-hidden="true" />
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
          <div className="topbar-left">
            <div className="topbar-brand">
              <span className="brand-cup" aria-hidden="true">
                <FaPencilAlt className="bpc p1" />
                <FaPencilAlt className="bpc p2" />
                <FaPencilAlt className="bpc p3" />
                <FaPencilAlt className="bpc p4" />
              </span>
              <span className="brand-text">PAPELERÍA</span>
            </div>
          </div>
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
          </div>
        </header>

        <main className="dashboard-content">
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      <nav ref={bottomNavRef} className="bottom-nav" aria-label="Navegación móvil">
        <div className="bottom-nav-pill" aria-hidden="true" />
        <span className="bottom-nav-bubble" aria-hidden="true" />
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className="bottom-nav-link"
            onClick={closeSidebar}
            aria-label={item.label}
          >
            <item.icon />
          </NavLink>
        ))}
      </nav>

      <InventoryAssistant />

    </div>
  );
}

export default DashboardLayout;