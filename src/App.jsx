import { useState, useEffect } from "react";
import api from "./services/api";
import CargarTrabajo from "./components/CargarTrabajo";

export default function App() {
  const [empleados, setEmpleados] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Sesión/Selección del empleado y máquina
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState("");
  const [maquinaSeleccionada, setMaquinaSeleccionada] = useState("");
  const [sesionIniciada, setSesionIniciada] = useState(false);

  const [vistaActiva, setVistaActiva] = useState("menu");

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  async function cargarDatosIniciales() {
    try {
      setCargando(true);
      const [resEmp, resMaq, resAsig] = await Promise.all([
        api.get("/empleados").catch(() => ({ data: [] })),
        api.get("/maquinas").catch(() => ({ data: [] })),
        api.get("/empleados-maquinas").catch(() => ({ data: [] })),
      ]);
      setEmpleados(resEmp.data);
      setMaquinas(resMaq.data);
      setAsignaciones(resAsig.data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setCargando(false);
    }
  }

  // Autoseleccionar la máquina cuando cambia el empleado usando la vinculación
  const handleEmpleadoChange = (e) => {
    const empId = e.target.value;
    setEmpleadoSeleccionado(empId);

    if (!empId) {
      setMaquinaSeleccionada("");
      return;
    }

    const relacion = asignaciones.find(
      (a) => String(a.empleado_id || a.empleadoId) === String(empId),
    );

    if (relacion) {
      setMaquinaSeleccionada(String(relacion.maquina_id || relacion.maquinaId));
    } else {
      setMaquinaSeleccionada("");
    }
  };

  const handleIngresar = (e) => {
    e.preventDefault();
    if (!empleadoSeleccionado) return;
    setSesionIniciada(true);
    setVistaActiva("menu");
  };

  const handleCerrarSesion = () => {
    setSesionIniciada(false);
    setEmpleadoSeleccionado("");
    setMaquinaSeleccionada("");
    setVistaActiva("menu");
  };

  if (cargando) {
    return (
      <div style={styles.containerCentrado}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: "16px", color: "#64748b" }}>Cargando datos...</p>
      </div>
    );
  }

  // --- PANTALLA DE ACCESO / LOGIN ---
  if (!sesionIniciada) {
    return (
      <div style={styles.appMobile}>
        <header style={styles.header}>
          <h1 style={styles.tituloHeader}>Pulverización Amanda</h1>
          <p style={styles.subtituloHeader}>Acceso Operarios</p>
        </header>

        <main style={styles.content}>
          <form onSubmit={handleIngresar} style={styles.formCard}>
            <div style={styles.group}>
              <label style={styles.label}>Empleado / Operario *</label>
              <select
                required
                value={empleadoSeleccionado}
                onChange={handleEmpleadoChange}
                style={styles.selectLarge}
              >
                <option value="">-- Seleccionar Nombre --</option>
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
              <label style={styles.label}>Máquina Asignada (Automática)</label>
              <select
                value={maquinaSeleccionada}
                onChange={(e) => setMaquinaSeleccionada(e.target.value)}
                style={styles.selectLarge}
              >
                <option value="">-- Sin máquina vinculada --</option>
                {maquinas.map((maq) => (
                  <option key={maq.id} value={maq.id}>
                    {maq.nombre || maq.modelo || `Máquina #${maq.id}`}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" style={styles.btnIngresar}>
              Ingresar al Sistema
            </button>
          </form>
        </main>
      </div>
    );
  }

  const empObj = empleados.find(
    (e) => String(e.id) === String(empleadoSeleccionado),
  );
  const nombreEmpleado = empObj
    ? `${empObj.nombre || ""} ${empObj.apellido || ""}`.trim() ||
      empObj.username
    : "Operario";

  return (
    <div style={styles.appMobile}>
      <header style={styles.headerLogged}>
        <div>
          <span style={styles.badgeEmpleado}>👨‍🌾 {nombreEmpleado}</span>
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
              style={{ ...styles.btnMenuGigante, backgroundColor: "#2563eb" }}
            >
              <span style={styles.iconoMenu}>🚜</span>
              <span style={styles.textoMenu}>Cargar Trabajo</span>
            </button>

            <button
              onClick={() => setVistaActiva("consumo")}
              style={{ ...styles.btnMenuGigante, backgroundColor: "#059669" }}
            >
              <span style={styles.iconoMenu}>🛢️</span>
              <span style={styles.textoMenu}>Consumos</span>
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
              <h2 style={styles.tituloForm}>Registrar Consumo</h2>
            </div>
            <p
              style={{
                color: "#64748b",
                textAlign: "center",
                margin: "20px 0",
              }}
            >
              [ Formulario de Consumo en desarrollo ]
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// Estilos móviles integrados (mismos que venías usando)
const styles = {
  appMobile: {
    maxWidth: "480px",
    margin: "0 auto",
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
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
  },
  header: {
    backgroundColor: "#0f172a",
    color: "#fff",
    padding: "24px 20px",
    textAlign: "center",
    borderBottomLeftRadius: "16px",
    borderBottomRightRadius: "16px",
  },
  headerLogged: {
    backgroundColor: "#0f172a",
    color: "#fff",
    padding: "16px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: "16px",
    borderBottomRightRadius: "16px",
  },
  tituloHeader: {
    margin: 0,
    fontSize: "1.3rem",
    fontWeight: "700",
  },
  subtituloHeader: {
    margin: "4px 0 0 0",
    fontSize: "0.85rem",
    color: "#94a3b8",
  },
  badgeEmpleado: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "#f8fafc",
  },
  btnSalir: {
    backgroundColor: "#334155",
    color: "#f8fafc",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "0.8rem",
    cursor: "pointer",
  },
  content: {
    padding: "20px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  formCard: {
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0",
  },
  group: {
    marginBottom: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#334155",
  },
  selectLarge: {
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "1rem",
    backgroundColor: "#fff",
    outline: "none",
  },
  btnIngresar: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "1.05rem",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "10px",
  },
  menuGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginTop: "10px",
  },
  btnMenuGigante: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "32px 20px",
    borderRadius: "16px",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  },
  iconoMenu: {
    fontSize: "2.8rem",
  },
  textoMenu: {
    fontSize: "1.25rem",
    fontWeight: "700",
    letterSpacing: "0.5px",
  },
  headerForm: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "12px",
  },
  btnVolver: {
    background: "none",
    border: "none",
    color: "#2563eb",
    fontWeight: "600",
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  tituloForm: {
    margin: 0,
    fontSize: "1.1rem",
    color: "#0f172a",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};
