import { useRef, useState } from "react";
import {
  FaSlidersH,
  FaDatabase,
  FaBell,
  FaPalette,
  FaFileDownload,
  FaFileUpload,
  FaCog,
  FaStar,
  FaPaperclip,
} from "react-icons/fa";
import { aplicarColores, getColorInicial } from "../theme.js";
import { exportBackup, restoreBackup } from "../services/api";

const TABS = [
  { id: "preferencias", label: "Preferencias del sistema", icon: FaSlidersH },
  { id: "respaldo", label: "Respaldo y mantenimiento", icon: FaDatabase },
  { id: "notificaciones", label: "Notificaciones", icon: FaBell },
  { id: "colores", label: "Colores del sistema", icon: FaPalette },
];

function Configuracion() {
  const [activeTab, setActiveTab] = useState("preferencias");
  const [umbral, setUmbral] = useState(() => {
    try {
      const raw = localStorage.getItem("umbralStockBajo");
      if (raw === null || raw === "") return 5;
      const v = Number(raw);
      return Number.isFinite(v) && v >= 0 ? v : 5;
    } catch {
      return 5;
    }
  });
  const [notif, setNotif] = useState(() => {
    const base = { stockBajo: true, agotados: true };
    try {
      const s = localStorage.getItem("notifStockBajo");
      const a = localStorage.getItem("notifAgotados");
      if (s !== null) base.stockBajo = s === "1";
      if (a !== null) base.agotados = a === "1";
    } catch {
      // valores por defecto
    }
    return base;
  });
  const coloresIniciales = getColorInicial();
  const [colorPrincipal, setColorPrincipal] = useState(coloresIniciales.principal);
  const [colorSecundario, setColorSecundario] = useState(coloresIniciales.secundario);
  const [aviso, setAviso] = useState("");
  const [avisoError, setAvisoError] = useState("");
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    try {
      setAviso("");
      setAvisoError("");
      const resp = await exportBackup();
      setAviso(`Respaldo exportado: ${resp.nombreArchivo}`);
    } catch (err) {
      setAvisoError(`Error al exportar el respaldo: ${err.message}`);
    }
  };

  const handleRestoreFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;

    const confirmar = window.confirm(
      "Esto reemplazará TODOS los datos actuales (productos, categorías, movimientos) con los del archivo. Esta acción no se puede deshacer. ¿Continuar?"
    );
    if (!confirmar) return;

    setAviso("");
    setAvisoError("");

    try {
      const texto = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
        reader.readAsText(file);
      });

      let json;
      try {
        json = JSON.parse(texto);
      } catch {
        throw new Error("El archivo no es un JSON válido");
      }

      const resumen = await restoreBackup(json);
      setAviso(
        `Respaldo restaurado: ${resumen.categorias} categorías, ${resumen.productos} productos, ${resumen.movimientos} movimientos`
      );
    } catch (err) {
      setAvisoError(`Error al restaurar el respaldo: ${err.message}`);
    }
  };

  const handleCancel = () => {
    setAviso("");
    setAvisoError("");
  };

  const handleSave = () => {
    setAviso("");
    setAvisoError("");

    if (activeTab === "respaldo") {
      return;
    }

    if (activeTab === "colores") {
      aplicarColores(colorPrincipal, colorSecundario);
      setAviso("Cambios guardados.");
      return;
    }

    if (activeTab === "preferencias") {
      const n = Number(umbral);
      if (!Number.isInteger(n) || n < 0) {
        setAvisoError("El umbral de stock bajo debe ser un número entero mayor o igual a 0.");
        return;
      }
      try {
        localStorage.setItem("umbralStockBajo", String(n));
      } catch {
        setAvisoError("No se pudo guardar el umbral de stock bajo en este dispositivo.");
        return;
      }
      setUmbral(n);
      setAviso("Cambios guardados.");
      return;
    }

    if (activeTab === "notificaciones") {
      try {
        localStorage.setItem("notifStockBajo", notif.stockBajo ? "1" : "0");
        localStorage.setItem("notifAgotados", notif.agotados ? "1" : "0");
      } catch {
        setAvisoError("No se pudieron guardar las notificaciones en este dispositivo.");
        return;
      }
      setAviso("Cambios guardados.");
    }
  };

  const renderSection = () => {
    switch (activeTab) {
      case "preferencias":
        return (
          <form className="product-form" onSubmit={(e) => e.preventDefault()} aria-label="Preferencias del sistema">
            <label>
              Umbral de stock bajo
              <input type="number" min="0" step="1" value={umbral} onChange={(e) => setUmbral(Number(e.target.value))} />
              <small className="form-hint">
                Se alertará cuando la cantidad de un producto sea menor o igual a este valor.
              </small>
            </label>
          </form>
        );
      case "respaldo":
        return (
          <div>
            <p className="report-hint">Genera y restaura copias de seguridad de tu información.</p>
            <div className="report-actions">
              <button type="button" onClick={handleExport}>
                <FaFileDownload /> Exportar respaldo
              </button>
              <button type="button" className="btn-secondary" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                <FaFileUpload /> Restaurar respaldo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: "none" }}
                onChange={handleRestoreFile}
              />
            </div>
          </div>
        );
      case "notificaciones":
        return (
          <div>
            <p className="report-hint">Configura qué alertas deseas recibir en el sistema.</p>
            <div className="form-check form-switch config-switch">
              <input className="form-check-input" type="checkbox" id="notif-stock" checked={notif.stockBajo} onChange={(e) => setNotif((p) => ({ ...p, stockBajo: e.target.checked }))} />
              <label className="form-check-label" htmlFor="notif-stock">Notificar stock bajo</label>
            </div>
            <div className="form-check form-switch config-switch">
              <input className="form-check-input" type="checkbox" id="notif-agotados" checked={notif.agotados} onChange={(e) => setNotif((p) => ({ ...p, agotados: e.target.checked }))} />
              <label className="form-check-label" htmlFor="notif-agotados">Notificar productos agotados</label>
            </div>
          </div>
        );
      case "colores":
        return (
          <div>
            <p className="report-hint">Personaliza los colores de la aplicación (solo vista previa).</p>
            <div className="color-fields">
              <label className="color-field">
                Color principal
                <span className="color-input-wrap">
                  <input type="color" value={colorPrincipal} onChange={(e) => setColorPrincipal(e.target.value)} />
                  <span>{colorPrincipal}</span>
                </span>
              </label>
              <label className="color-field">
                Color secundario
                <span className="color-input-wrap">
                  <input type="color" value={colorSecundario} onChange={(e) => setColorSecundario(e.target.value)} />
                  <span>{colorSecundario}</span>
                </span>
              </label>
            </div>
            <button
              type="button"
              className="color-preview"
              style={{ background: colorPrincipal, borderColor: colorSecundario }}
              onClick={() => {}}
            >
              Vista previa <span className="color-dot" style={{ background: colorSecundario }} />
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="page-banner">
        <div className="page-banner-text">
          <span className="page-banner-icon">
            <FaCog />
          </span>
          <div>
            <h1>Configuración</h1>
            <p>Personaliza la información y el aspecto de tu papelería.</p>
          </div>
        </div>
        <div className="page-banner-art" aria-hidden="true">
          <FaSlidersH className="art art-pencil" />
          <FaBell className="art art-book" />
          <FaPalette className="art art-ruler" />
          <FaDatabase className="art art-pen" />
          <FaStar className="art art-star" />
          <FaPaperclip className="art art-clip" />
        </div>
        <div className="banner-note">
          <span className="banner-note-text handwritten">Ajustes a tu medida 🎨</span>
        </div>
      </div>

      <div className="container config-container">
        {aviso && <div className="success-banner">{aviso}</div>}
      {avisoError && <div className="error-banner">{avisoError}</div>}

      <div className="row g-3">
        <div className="col-12 col-md-4 col-xl-3">
          <div className="config-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`config-tab${activeTab === tab.id ? " active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="col-12 col-md-8 col-xl-9">
          <div className="page-card config-panel">
            <h2 className="page-card-title">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h2>
            {renderSection()}
            <div className="form-actions config-footer">
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Cancelar
              </button>
              <button type="button" onClick={handleSave}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

export default Configuracion;