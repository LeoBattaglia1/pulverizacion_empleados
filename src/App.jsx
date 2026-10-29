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

  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState("");
  const [maquinaSeleccionada, setMaquinaSeleccionada] = useState("");
  const [vinculacionActiva, setVinculacionActiva] = useState(true);
  const [sesionIniciada, setSesionIniciada] = useState(false);

  const CLAVE_ACCESO_SISTEMA = "1234";
  const TELEFONO_WHATSAPP = "5492494553810";

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
        <p
          style={{
            marginTop: "20px",
            color: "#34d399",
            fontWeight: "800",
            fontSize: "1.4rem",
          }}
        >
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
                  style={{ accentColor: "#059669", transform: "scale(1.4)" }}
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
                  borderColor: errorClave ? "#dc2626" : "#64748b",
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
          <div style={styles.badgeRow}>
            <span style={styles.badgeLabel}>Operario:</span>
            <span style={styles.badgeValue}>{nombreEmpleado}</span>
          </div>
          <div style={styles.badgeRow}>
            <span style={styles.badgeLabel}>Máquina:</span>
            <span style={styles.badgeValueMaquina}>{nombreMaquina}</span>
          </div>
        </div>

        {/* Botón de Atrás o Cerrar Sesión */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            width: "100%",
            marginTop: "8px",
          }}
        >
          {vistaActiva !== "menu" ? (
            <button
              onClick={() => setVistaActiva("menu")}
              style={styles.btnAtrasHeader}
            >
              ← Atrás (Menú)
            </button>
          ) : (
            <button onClick={handleCerrarSesion} style={styles.btnAtrasHeader}>
              Cerrar Sesión
            </button>
          )}
        </div>
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
    width: "100%",
    minHeight: "100vh",
    margin: "0 auto",
    backgroundColor: "#f1f5f9",
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
    backgroundColor: "#000000",
    color: "#ffffff",
  },
  header: {
    backgroundColor: "#000000",
    color: "#ffffff",
    padding: "52px 24px 44px 24px",
    textAlign: "center",
    boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
    position: "relative",
    width: "100%",
    boxSizing: "border-box",
  },
  headerTopBar: {
    marginBottom: "12px",
  },
  headerSubtitle: {
    fontSize: "1.1rem",
    textTransform: "uppercase",
    letterSpacing: "3px",
    color: "#34d399",
    fontWeight: "900",
  },
  headerAccentLine: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "160px",
    height: "6px",
    backgroundColor: "#059669",
    borderRadius: "3px",
  },
  headerLogged: {
    backgroundColor: "#000000",
    color: "#ffffff",
    padding: "32px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
    width: "100%",
    boxSizing: "border-box",
    borderBottom: "4px solid #059669",
  },
  headerInfoContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    width: "100%",
  },
  badgeRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: "16px 20px",
    borderRadius: "14px",
  },
  badgeLabel: {
    fontSize: "1.15rem",
    color: "#94a3b8",
    fontWeight: "800",
    textTransform: "uppercase",
  },
  badgeValue: {
    fontSize: "1.35rem",
    color: "#ffffff",
    fontWeight: "900",
  },
  badgeValueMaquina: {
    fontSize: "1.35rem",
    color: "#34d399",
    fontWeight: "900",
  },
  btnAtrasHeader: {
    backgroundColor: "rgba(255,255,255,0.12)",
    color: "#cbd5e1",
    border: "1px solid #475569",
    padding: "10px 18px",
    borderRadius: "10px",
    fontSize: "1rem",
    fontWeight: "800",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tituloHeader: {
    margin: 0,
    fontSize: "2.4rem",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  content: {
    padding: "45px 20px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    width: "100%",
    boxSizing: "border-box",
    justifyContent: "center",
  },
  formCard: {
    backgroundColor: "#ffffff",
    padding: "60px 40px", // Misma tarjeta masiva y espaciosa que el login
    borderRadius: "32px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
    border: "1px solid #cbd5e1",
    width: "100%",
    boxSizing: "border-box",
  },
  loginBannerDecorativo: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "40px",
    paddingBottom: "22px",
    borderBottom: "3px solid #f1f5f9",
  },
  bannerPuntoLuminoso: {
    width: "14px",
    height: "14px",
    backgroundColor: "#059669",
    borderRadius: "50%",
    boxShadow: "0 0 15px #059669",
  },
  bannerText: {
    fontSize: "1.25rem",
    fontWeight: "900",
    color: "#059669",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  group: {
    marginBottom: "40px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    width: "100%",
  },
  groupCentered: {
    marginBottom: "48px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
    width: "100%",
    marginTop: "25px",
  },
  label: {
    fontSize: "1.3rem",
    fontWeight: "900",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },
  labelCentered: {
    fontSize: "1.3rem",
    fontWeight: "900",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    textAlign: "center",
  },
  inputSmallKey: {
    padding: "24px",
    borderRadius: "18px",
    border: "2px solid #64748b",
    fontSize: "16px",
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: "12px",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    outline: "none",
    width: "100%",
    maxWidth: "300px",
    boxSizing: "border-box",
  },
  errorText: {
    fontSize: "1.1rem",
    color: "#dc2626",
    fontWeight: "900",
  },
  selectLarge: {
    padding: "26px 22px",
    borderRadius: "18px",
    border: "2px solid #64748b",
    fontSize: "16px",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    fontWeight: "800",
  },
  checkboxContainer: {
    margin: "35px 0 45px 0",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    fontSize: "1.3rem",
    color: "#334155",
    cursor: "pointer",
    fontWeight: "800",
  },
  btnIngresar: {
    width: "100%",
    padding: "28px",
    backgroundColor: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: "22px",
    fontSize: "1.45rem",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 12px 35px rgba(5, 150, 105, 0.5)",
    letterSpacing: "1px",
  },
  menuGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "40px",
    width: "100%",
  },
  btnMenuGigantePrimary: {
    width: "100%",
    padding: "50px 24px",
    backgroundColor: "#059669",
    color: "#ffffff",
    border: "none",
    borderRadius: "28px",
    fontSize: "1.9rem",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 14px 40px rgba(5, 150, 105, 0.5)",
    textAlign: "center",
    letterSpacing: "0.5px",
  },
  btnMenuGiganteSecondary: {
    width: "100%",
    padding: "50px 24px",
    backgroundColor: "#334155",
    color: "#ffffff",
    border: "none",
    borderRadius: "28px",
    fontSize: "1.9rem",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 14px 40px rgba(51, 65, 85, 0.4)",
    textAlign: "center",
    letterSpacing: "0.5px",
  },
  headerForm: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "35px",
    borderBottom: "3px solid #f1f5f9",
    paddingBottom: "24px",
  },
  tituloForm: {
    margin: 0,
    fontSize: "2.1rem",
    color: "#0f172a",
    fontWeight: "900",
  },
  spinner: {
    width: "65px",
    height: "65px",
    border: "6px solid #334155",
    borderTop: "6px solid #34d399",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  footer: {
    backgroundColor: "#000000",
    padding: "45px 20px",
    textAlign: "center",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    boxSizing: "border-box",
    borderTop: "2px solid #1e293b",
    boxShadow: "0 -8px 30px rgba(0,0,0,0.3)",
  },
  footerLogo: {
    height: "110px",
    objectFit: "contain",
  },
};
