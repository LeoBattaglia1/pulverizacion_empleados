import { useState, useEffect } from "react";
import api from "./services/api";
import CargarTrabajo from "./components/CargarTrabajo";
import Insumos from "./components/Insumos";
import logoEmprendimiento from "./assets/L.png";

export default function App() {
  const [empleados, setEmpleados] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Sesión/Selección del empleado y máquina
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState("");
  const [maquinaSeleccionada, setMaquinaSeleccionada] = useState("");
  const [vinculacionActiva, setVinculacionActiva] = useState(true);
  const [sesionIniciada, setSesionIniciada] = useState(false);

  // ========================================== //
  // CLAVE DE ACCESO GENERAL PARA LOS EMPLEADOS //
  const CLAVE_ACCESO_SISTEMA = "1234";
  // ========================================== //

  // ========================================== //
  // NÚMERO DE WHATSAPP PARA LOS ENVÍOS         //
  const TELEFONO_WHATSAPP = "5492494553810";
  // ========================================== //

  const [claveIngresada, setClaveIngresada] = useState("");
  const [errorClave, setErrorClave] = useState(false);

  const [vistaActiva, setVistaActiva] = useState("menu");

  useEffect(() => {
    let montado = true;

    const obtenerDatosIniciales = async () => {
      try {
        setCargando(true);
        const [resEmp, resMaq, resAsig] = await Promise.all([
          api.get("/empleados").catch(() => ({ data: [] })),
          api.get("/maquinas").catch(() => ({ data: [] })),
          api.get("/empleados-maquinas").catch(() => ({ data: [] })),
        ]);

        if (montado) {
          setEmpleados(resEmp.data);
          setMaquinas(resMaq.data);
          setAsignaciones(resAsig.data);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        if (montado) {
          setCargando(false);
        }
      }
    };

    obtenerDatosIniciales();

    return () => {
      montado = false;
    };
  }, []);

  const handleEmpleadoChange = (e) => {
    const empId = e.target.value;
    setEmpleadoSeleccionado(empId);

    if (!empId || !vinculacionActiva) return;

    const relacion = asignaciones.find(
      (a) => String(a.empleado_id || a.empleadoId) === String(empId),
    );

    if (relacion) {
      setMaquinaSeleccionada(String(relacion.maquina_id || relacion.maquinaId));
    } else {
      setMaquinaSeleccionada("");
    }
  };

  const handleMaquinaChange = (e) => {
    const maqId = e.target.value;
    setMaquinaSeleccionada(maqId);

    if (!maqId || !vinculacionActiva) return;

    const relacion = asignaciones.find(
      (a) => String(a.maquina_id || a.maquinaId) === String(maqId),
    );

    if (relacion) {
      setEmpleadoSeleccionado(
        String(relacion.empleado_id || relacion.empleadoId),
      );
    }
  };

  const handleIngresar = (e) => {
    e.preventDefault();

    if (claveIngresada !== CLAVE_ACCESO_SISTEMA) {
      setErrorClave(true);
      return;
    }

    if (!empleadoSeleccionado || !maquinaSeleccionada) {
      alert("Por favor seleccione operario y máquina.");
      return;
    }

    setErrorClave(false);
    setSesionIniciada(true);
    setVistaActiva("menu");
  };

  const handleCerrarSesion = () => {
    setSesionIniciada(false);
    setEmpleadoSeleccionado("");
    setMaquinaSeleccionada("");
    setClaveIngresada("");
    setErrorClave(false);
    setVistaActiva("menu");
  };

  if (cargando) {
    return (
      <div style={styles.containerCentrado}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: "16px", color: "#047857", fontWeight: "600" }}>
          Cargando sistema...
        </p>
      </div>
    );
  }

  const empObj = empleados.find(
    (e) => String(e.id) === String(empleadoSeleccionado),
  );
  const maquinaObj = maquinas.find(
    (m) => String(m.id) === String(maquinaSeleccionada),
  );

  const nombreEmpleado = empObj
    ? `${empObj.nombre || ""} ${empObj.apellido || ""}`.trim() ||
      empObj.username
    : "Operario";

  const nombreMaquina = maquinaObj
    ? maquinaObj.nombre || maquinaObj.modelo || maquinaObj.patente || "Máquina"
    : "Sin máquina";

  // --- PANTALLA DE ACCESO / LOGIN ---
  if (!sesionIniciada) {
    return (
      <div style={styles.appMobile}>
        <header style={styles.header}>
          <div style={styles.headerTopBar}>
            <span style={styles.headerSubtitle}>Plataforma de Gestión</span>
          </div>
          <h1 style={styles.tituloHeader}>Pulverizaciones Amanda</h1>
          <div style={styles.headerAccentLine}></div>
        </header>

        <main style={styles.content}>
          <form onSubmit={handleIngresar} style={styles.formCard}>
            <div style={styles.loginBannerDecorativo}>
              <div style={styles.bannerPuntoLuminoso}></div>
              <span style={styles.bannerText}>Panel de Identificación</span>
            </div>

            <div style={styles.group}>
              <label style={styles.label}>Operario</label>
              <select
                required
                value={empleadoSeleccionado}
                onChange={handleEmpleadoChange}
                style={styles.selectLarge}
              >
                <option value="">-- Seleccionar Operario --</option>
                {empleados.map((emp) => {
                  const nombreMostrar =
                    emp.nombre || emp.apellido
                      ? `${emp.nombre || ""} ${emp.apellido || ""}`.trim()
                      : emp.username || `Empleado #${emp.id}`;
                  return (
                    <option key={emp.id} value={emp.id}>
                      {nombreMostrar}
                    </option>
                  );
                })}
              </select>
            </div>

            <div style={styles.group}>
              <label style={styles.label}>Máquina</label>
              <select
                required
                value={maquinaSeleccionada}
                onChange={handleMaquinaChange}
                style={styles.selectLarge}
              >
                <option value="">-- Seleccionar Máquina --</option>
                {maquinas.map((maq) => (
                  <option key={maq.id} value={maq.id}>
                    {maq.nombre ||
                      maq.modelo ||
                      maq.patente ||
                      `Máquina #${maq.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.checkboxContainer}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={vinculacionActiva}
                  onChange={(e) => setVinculacionActiva(e.target.checked)}
                  style={{ accentColor: "#059669", transform: "scale(1.2)" }}
                />
                Vinculación automática de equipo
              </label>
            </div>

            <div style={styles.groupCentered}>
              <label style={styles.labelCentered}>Clave de Acceso</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="••••"
                required
                value={claveIngresada}
                onChange={(e) => {
                  setClaveIngresada(e.target.value);
                  if (errorClave) setErrorClave(false);
                }}
                style={{
                  ...styles.inputSmallKey,
                  borderColor: errorClave ? "#dc2626" : "#cbd5e1",
                }}
              />
              {errorClave && (
                <span style={styles.errorText}>
                  Clave incorrecta. Intente nuevamente.
                </span>
              )}
            </div>

            <button type="submit" style={styles.btnIngresar}>
              INGRESAR AL SISTEMA
            </button>
          </form>
        </main>

        <footer style={styles.footer}>
          <img
            src={logoEmprendimiento}
            alt="Logo Empresa"
            style={styles.footerLogo}
          />
        </footer>
      </div>
    );
  }

  return (
    <div style={styles.appMobile}>
      <header style={styles.headerLogged}>
        <div style={styles.headerInfoContainer}>
          <span style={styles.badgeEmpleado}>
            Operario: <strong>{nombreEmpleado}</strong>
          </span>
          <span style={styles.badgeMaquina}>
            Máquina: <strong>{nombreMaquina}</strong>
          </span>
        </div>
        <button onClick={handleCerrarSesion} style={styles.btnSalir}>
          Salir
        </button>
      </header>

      <main style={styles.content}>
        {vistaActiva === "menu" && (
          <div style={styles.menuGrid}>
            <button
              onClick={() => setVistaActiva("trabajo")}
              style={styles.btnMenuGigantePrimary}
            >
              Cargar Trabajo
            </button>

            <button
              onClick={() => setVistaActiva("consumo")}
              style={styles.btnMenuGiganteSecondary}
            >
              Consumos e Insumos
            </button>
          </div>
        )}

        {vistaActiva === "trabajo" && (
          <div style={styles.formCard}>
            <div style={styles.headerForm}>
              <button
                onClick={() => setVistaActiva("menu")}
                style={styles.btnVolver}
              >
                ← Volver
              </button>
              <h2 style={styles.tituloForm}>Nuevo Trabajo</h2>
            </div>

            <CargarTrabajo
              empleadoId={empleadoSeleccionado}
              maquinaId={maquinaSeleccionada}
              nombreEmpleado={nombreEmpleado}
              telefonoWhatsApp={TELEFONO_WHATSAPP}
              onVolver={() => setVistaActiva("menu")}
            />
          </div>
        )}

        {vistaActiva === "consumo" && (
          <div style={styles.formCard}>
            <div style={styles.headerForm}>
              <button
                onClick={() => setVistaActiva("menu")}
                style={styles.btnVolver}
              >
                ← Volver
              </button>
              <h2 style={styles.tituloForm}>Consumos e Insumos</h2>
            </div>
            <Insumos
              empleadoId={empleadoSeleccionado}
              maquinaId={maquinaSeleccionada}
            />
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <img
          src={logoEmprendimiento}
          alt="Logo Empresa"
          style={styles.footerLogo}
        />
      </footer>
    </div>
  );
}

const styles = {
  appMobile: {
    width: "100%", // Ocupa el 100% de la pantalla sin restricciones
    minHeight: "100vh",
    margin: "0 auto",
    backgroundColor: "#f8fafc",
    color: "#1e293b",
    display: "flex",
    flexDirection: "column",
    fontFamily: "system-ui, -apple-system, sans-serif",
    boxSizing: "border-box",
  },
  containerCentrado: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    color: "#1e293b",
  },
  header: {
    backgroundColor: "#0f172a", // Color exacto del fondo del logo
    color: "#ffffff",
    padding: "28px 20px 24px 20px",
    textAlign: "center",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    position: "relative",
    width: "100%",
    boxSizing: "border-box",
  },
  headerTopBar: {
    marginBottom: "4px",
  },
  headerSubtitle: {
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    color: "#34d399",
    fontWeight: "700",
  },
  headerAccentLine: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "80px",
    height: "4px",
    backgroundColor: "#059669",
    borderRadius: "2px",
  },
  headerLogged: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    width: "100%",
    boxSizing: "border-box",
  },
  headerInfoContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  tituloHeader: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  badgeEmpleado: {
    fontSize: "0.85rem",
    color: "#cbd5e1",
  },
  badgeMaquina: {
    fontSize: "0.85rem",
    color: "#34d399",
    fontWeight: "700",
  },
  btnSalir: {
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.2)",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: "700",
    cursor: "pointer",
  },
  content: {
    padding: "24px 16px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    width: "100%",
    boxSizing: "border-box",
    justifyContent: "center",
  },
  formCard: {
    backgroundColor: "#ffffff",
    padding: "28px 22px",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
    width: "100%",
    boxSizing: "border-box",
  },
  loginBannerDecorativo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "22px",
    paddingBottom: "14px",
    borderBottom: "2px solid #f1f5f9",
  },
  bannerPuntoLuminoso: {
    width: "10px",
    height: "10px",
    backgroundColor: "#059669",
    borderRadius: "50%",
    boxShadow: "0 0 10px #059669",
  },
  bannerText: {
    fontSize: "0.9rem",
    fontWeight: "800",
    color: "#059669",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  group: {
    marginBottom: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
  },
  groupCentered: {
    marginBottom: "24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    width: "100%",
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: "800",
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  labelCentered: {
    fontSize: "0.85rem",
    fontWeight: "800",
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    textAlign: "center",
  },
  inputSmallKey: {
    padding: "14px",
    borderRadius: "12px",
    border: "2px solid #cbd5e1",
    fontSize: "16px",
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: "6px",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    outline: "none",
    width: "100%",
    maxWidth: "180px",
    boxSizing: "border-box",
  },
  errorText: {
    fontSize: "0.8rem",
    color: "#dc2626",
    fontWeight: "700",
  },
  selectLarge: {
    padding: "16px",
    borderRadius: "12px",
    border: "2px solid #cbd5e1",
    fontSize: "16px",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    fontWeight: "600",
  },
  checkboxContainer: {
    margin: "16px 0 20px 0",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "0.9rem",
    color: "#475569",
    cursor: "pointer",
    fontWeight: "600",
  },
  btnIngresar: {
    width: "100%",
    padding: "18px",
    backgroundColor: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    fontSize: "1.05rem",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(5, 150, 105, 0.4)",
    letterSpacing: "0.5px",
  },
  menuGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    width: "100%",
  },
  btnMenuGigantePrimary: {
    width: "100%",
    padding: "28px 20px",
    backgroundColor: "#059669",
    color: "#ffffff",
    border: "none",
    borderRadius: "18px",
    fontSize: "1.25rem",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 8px 25px rgba(5, 150, 105, 0.4)",
    textAlign: "center",
  },
  btnMenuGiganteSecondary: {
    width: "100%",
    padding: "28px 20px",
    backgroundColor: "#334155",
    color: "#ffffff",
    border: "none",
    borderRadius: "18px",
    fontSize: "1.25rem",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 8px 25px rgba(51, 65, 85, 0.3)",
    textAlign: "center",
  },
  headerForm: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
    borderBottom: "2px solid #f1f5f9",
    paddingBottom: "14px",
  },
  btnVolver: {
    background: "none",
    border: "none",
    color: "#059669",
    fontWeight: "800",
    fontSize: "0.95rem",
    cursor: "pointer",
  },
  tituloForm: {
    margin: 0,
    fontSize: "1.2rem",
    color: "#0f172a",
    fontWeight: "900",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #cbd5e1",
    borderTop: "4px solid #059669",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  footer: {
    backgroundColor: "#0f172a", // Mismo tono oscuro exacto del logo
    padding: "24px 20px",
    textAlign: "center",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    boxSizing: "border-box",
    borderTop: "1px solid #1e293b",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
  },
  footerLogo: {
    height: "65px",
    objectFit: "contain",
  },
};
