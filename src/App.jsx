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

  const [modalTecladoAbierto, setModalTecladoAbierto] = useState(false);
  const [modalMenuAbierto, setModalMenuAbierto] = useState(false);

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

  const handleTecladoClick = (valor) => {
    if (errorClave) setErrorClave(false);

    if (valor === "borrar") {
      setClaveIngresada((prev) => prev.slice(0, -1));
    } else {
      if (claveIngresada.length < 6) {
        setClaveIngresada((prev) => prev + valor);
      }
    }
  };

  const handleIngresar = () => {
    if (claveIngresada !== CLAVE_ACCESO_SISTEMA) {
      setErrorClave(true);
      setModalTecladoAbierto(false);
      return;
    }

    if (!empleadoSeleccionado || !maquinaSeleccionada) {
      alert("Por favor seleccione operario y máquina.");
      return;
    }

    setErrorClave(false);
    setSesionIniciada(true);
    setModalTecladoAbierto(false);
    setModalMenuAbierto(true);
    setVistaActiva("menu");
  };

  const handleSalirSesion = () => {
    setSesionIniciada(false);
    setClaveIngresada("");
    setModalMenuAbierto(false);
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
            fontSize: "1.7rem",
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

  return (
    <div style={styles.appMobile}>
      <header style={styles.header}>
        <div style={styles.headerTopBar}>
          <span style={styles.headerSubtitle}>Plataforma de Gestión</span>
        </div>
        <h1 style={styles.tituloHeader}>Pulverizaciones Amanda</h1>
        <div style={styles.headerAccentLine}></div>
      </header>

      {sesionIniciada && vistaActiva !== "menu" && (
        <div style={styles.barraSesionModulo}>
          <div style={styles.infoModuloTexto}>
            <span>
              Op:{" "}
              <strong style={{ fontSize: "1.8rem" }}>{nombreEmpleado}</strong>
            </span>
            <span>
              Máq:{" "}
              <strong style={{ color: "#34d399", fontSize: "1.8rem" }}>
                {nombreMaquina}
              </strong>
            </span>
          </div>
          <button
            onClick={() => setModalMenuAbierto(true)}
            style={styles.btnAbrirMenuFlotante}
          >
            Volver al Menú Principal
          </button>
        </div>
      )}

      <main style={styles.content}>
        {vistaActiva === "trabajo" ? (
          <div style={styles.formCard}>
            <CargarTrabajo
              empleadoId={empleadoSeleccionado}
              maquinaId={maquinaSeleccionada}
              nombreEmpleado={nombreEmpleado}
              telefonoWhatsApp={TELEFONO_WHATSAPP}
              onVolver={() => setModalMenuAbierto(true)}
            />
          </div>
        ) : vistaActiva === "consumo" ? (
          <div style={styles.formCardGrande}>
            <div style={styles.headerForm}>
              <h2 style={styles.tituloForm}>Consumos</h2>
            </div>
            <Insumos
              empleadoId={empleadoSeleccionado}
              maquinaId={maquinaSeleccionada}
            />
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "35px",
            }}
          >
            <div style={styles.formCard}>
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
                  <option
                    value=""
                    style={{ fontSize: "10px", padding: "12px" }}
                  >
                    -- Seleccionar Operario --
                  </option>
                  {empleados.map((emp) => {
                    const nombreMostrar =
                      emp.nombre || emp.apellido
                        ? `${emp.nombre || ""} ${emp.apellido || ""}`.trim()
                        : emp.username;
                    return (
                      <option
                        key={emp.id}
                        value={emp.id}
                        style={{ fontSize: "10px", padding: "12px" }}
                      >
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
                  <option
                    value=""
                    style={{ fontSize: "10px", padding: "12px" }}
                  >
                    -- Seleccionar Máquina --
                  </option>
                  {maquinas.map((maq) => (
                    <option
                      key={maq.id}
                      value={maq.id}
                      style={{ fontSize: "10px", padding: "12px" }}
                    >
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

                <div
                  onClick={() => setModalTecladoAbierto(true)}
                  style={{
                    ...styles.inputSmallKey,
                    borderColor: errorClave ? "#dc2626" : "#64748b",
                    cursor: "pointer",
                  }}
                >
                  {claveIngresada ? (
                    claveIngresada
                  ) : (
                    <span style={{ color: "#94a3b8", fontSize: "24px" }}>
                      Tocar para ingresar clave...
                    </span>
                  )}
                </div>

                {errorClave && (
                  <span style={styles.errorText}>
                    Clave incorrecta. Intente nuevamente.
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setModalTecladoAbierto(true)}
                style={styles.btnIngresar}
              >
                INGRESAR AL SISTEMA
              </button>
            </div>
          </div>
        )}
      </main>

      {modalTecladoAbierto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalTecladoCard}>
            <div style={styles.modalTecladoHeader}>
              <span style={styles.modalTecladoTitulo}>Ingrese Clave</span>
              <button
                type="button"
                onClick={() => setModalTecladoAbierto(false)}
                style={styles.btnCloseModal}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalClaveDisplay}>
              {claveIngresada ? (
                claveIngresada
              ) : (
                <span style={{ color: "#94a3b8", fontSize: "28px" }}>
                  _ _ _ _
                </span>
              )}
            </div>

            <div style={styles.tecladoGridModal}>
              {[
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "borrar",
                "0",
                "ok",
              ].map((tecla) => {
                let textoBoton = tecla;
                let estiloBoton = styles.teclaBtnModal;

                if (tecla === "borrar") {
                  textoBoton = "⌫";
                  estiloBoton = styles.teclaBorrarModal;
                } else if (tecla === "ok") {
                  textoBoton = "✓ OK";
                  estiloBoton = styles.teclaOkModal;
                }

                return (
                  <button
                    key={tecla}
                    type="button"
                    onClick={() => {
                      if (tecla === "ok") {
                        handleIngresar();
                      } else {
                        handleTecladoClick(tecla);
                      }
                    }}
                    style={estiloBoton}
                  >
                    {textoBoton}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {modalMenuAbierto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalMenuCardFull}>
            <div style={styles.menuModalHeader}>
              <span
                style={{
                  color: "#34d399",
                  fontWeight: "900",
                  fontSize: "3rem",
                  textTransform: "uppercase",
                }}
              >
                ✓ Acceso Habilitado
              </span>
            </div>

            <div style={styles.menuBotonesContainer}>
              <button
                onClick={() => {
                  setModalMenuAbierto(false);
                  setVistaActiva("trabajo");
                }}
                style={styles.btnMenuModalPrimary}
              >
                CARGAR TRABAJO
              </button>

              <button
                onClick={() => {
                  setModalMenuAbierto(false);
                  setVistaActiva("consumo");
                }}
                style={styles.btnMenuModalYellow}
              >
                CONSUMOS
              </button>
            </div>

            <div
              style={{
                marginTop: "25px",
                borderTop: "2px solid #334155",
                paddingTop: "30px",
              }}
            >
              <button onClick={handleSalirSesion} style={styles.btnSalirModal}>
                SALIR
              </button>
            </div>
          </div>
        </div>
      )}

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
    padding: "40px 20px 30px 20px",
    textAlign: "center",
    boxShadow: "0 10px 35px rgba(0,0,0,0.35)",
    position: "relative",
    width: "100%",
    boxSizing: "border-box",
  },
  headerTopBar: {
    marginBottom: "8px",
  },
  headerSubtitle: {
    fontSize: "1.8rem",
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
    width: "180px",
    height: "6px",
    backgroundColor: "#059669",
    borderRadius: "3px",
  },
  tituloHeader: {
    margin: 0,
    fontSize: "3.2rem", // Ajustado para que luzca grande pero respete el espacio
    lineHeight: "1.25", // Soluciona el problema de que el texto quede pisado
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  barraSesionModulo: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: "16px",
    borderBottom: "3px solid #34d399",
    width: "100%",
    boxSizing: "border-box",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  },
  infoModuloTexto: {
    display: "flex",
    gap: "24px",
    fontSize: "1.6rem",
    fontWeight: "800",
    flexWrap: "wrap",
    justifyContent: "center",
    textAlign: "center",
  },
  btnAbrirMenuFlotante: {
    backgroundColor: "#1e3a8a", // Color azul corporativo distinto al verde
    color: "#ffffff",
    border: "3px solid #3b82f6",
    padding: "22px 24px", // Más alto y cómodo para tocar
    borderRadius: "16px",
    fontSize: "1.8rem",
    fontWeight: "900",
    cursor: "pointer",
    width: "100%",
    boxSizing: "border-box",
    boxShadow: "0 8px 25px rgba(30, 58, 138, 0.4)",
    letterSpacing: "0.5px",
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
    padding: "60px 40px",
    borderRadius: "32px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
    border: "1px solid #cbd5e1",
    width: "100%",
    boxSizing: "border-box",
    transition: "all 0.3s ease",
  },
  formCardGrande: {
    backgroundColor: "#ffffff",
    padding: "60px 40px",
    borderRadius: "32px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
    border: "1px solid #cbd5e1",
    width: "100%",
    maxWidth: "1400px",
    margin: "0 auto",
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
    fontSize: "1.6rem",
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
    fontSize: "2.3rem",
    fontWeight: "900",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },
  labelCentered: {
    fontSize: "2.3rem",
    fontWeight: "900",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    textAlign: "center",
  },
  inputSmallKey: {
    padding: "20px 24px",
    borderRadius: "18px",
    border: "3px solid #64748b",
    fontSize: "36px",
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: "8px",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    width: "100%",
    maxWidth: "100%",
    minHeight: "85px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    boxShadow: "inset 0 4px 10px rgba(0,0,0,0.05)",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    zIndex: 9999,
    boxSizing: "border-box",
  },
  modalTecladoCard: {
    backgroundColor: "#ffffff",
    padding: "35px 24px 50px 24px",
    borderRadius: "36px 36px 0 0",
    width: "100%",
    maxWidth: "100%",
    boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
    borderTop: "5px solid #059669",
    display: "flex",
    flexDirection: "column",
    gap: "25px",
    boxSizing: "border-box",
  },
  modalTecladoHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "2px solid #f1f5f9",
    paddingBottom: "15px",
  },
  modalTecladoTitulo: {
    fontSize: "2.4rem",
    fontWeight: "900",
    color: "#0f172a",
    textTransform: "uppercase",
  },
  btnCloseModal: {
    background: "#fee2e2",
    border: "none",
    borderRadius: "50%",
    width: "55px",
    height: "55px",
    fontSize: "2rem",
    fontWeight: "900",
    color: "#991b1b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalClaveDisplay: {
    padding: "22px",
    borderRadius: "18px",
    backgroundColor: "#f8fafc",
    border: "3px solid #64748b",
    fontSize: "52px",
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: "12px",
    color: "#0f172a",
    minHeight: "85px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  },
  tecladoGridModal: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    width: "100%",
  },
  teclaBtnModal: {
    padding: "32px 10px",
    fontSize: "2.8rem",
    fontWeight: "900",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    border: "3px solid #cbd5e1",
    borderRadius: "22px",
    cursor: "pointer",
    boxShadow: "0 6px 15px rgba(0,0,0,0.06)",
    textAlign: "center",
  },
  teclaBorrarModal: {
    padding: "32px 10px",
    fontSize: "2.6rem",
    fontWeight: "900",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    border: "3px solid #fecaca",
    borderRadius: "22px",
    cursor: "pointer",
    boxShadow: "0 6px 15px rgba(0,0,0,0.06)",
    textAlign: "center",
  },
  teclaOkModal: {
    padding: "32px 10px",
    fontSize: "2.4rem",
    fontWeight: "900",
    backgroundColor: "#059669",
    color: "#ffffff",
    border: "3px solid #047857",
    borderRadius: "22px",
    cursor: "pointer",
    boxShadow: "0 6px 15px rgba(5,150,105,0.3)",
    textAlign: "center",
  },
  modalMenuCardFull: {
    backgroundColor: "#0f172a",
    padding: "60px 40px",
    borderRadius: "36px",
    width: "95%",
    maxWidth: "800px",
    maxHeight: "95vh",
    overflowY: "auto",
    boxShadow: "0 30px 90px rgba(0,0,0,0.85)",
    border: "5px solid #34d399",
    display: "flex",
    flexDirection: "column",
    gap: "35px",
    boxSizing: "border-box",
    margin: "auto",
  },
  menuModalHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    borderBottom: "2px solid #334155",
    paddingBottom: "20px",
    textAlign: "center",
  },
  menuBotonesContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  btnMenuModalPrimary: {
    width: "100%",
    padding: "42px 20px",
    backgroundColor: "#059669",
    color: "#ffffff",
    border: "none",
    borderRadius: "22px",
    fontSize: "2.5rem",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 12px 35px rgba(5, 150, 105, 0.5)",
    textAlign: "center",
  },
  btnMenuModalYellow: {
    width: "100%",
    padding: "42px 20px",
    backgroundColor: "#d97706",
    color: "#ffffff",
    border: "none",
    borderRadius: "22px",
    fontSize: "2.5rem",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 12px 35px rgba(217, 119, 6, 0.5)",
    textAlign: "center",
  },
  btnSalirModal: {
    width: "100%",
    padding: "32px",
    backgroundColor: "#dc2626",
    color: "#ffffff",
    border: "none",
    borderRadius: "20px",
    fontSize: "2.3rem",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(220, 38, 38, 0.5)",
    textAlign: "center",
  },
  errorText: {
    fontSize: "1.2rem",
    color: "#dc2626",
    fontWeight: "900",
  },
  selectLarge: {
    padding: "30px 22px",
    borderRadius: "18px",
    border: "3px solid #64748b",
    fontSize: "25px",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    fontWeight: "900",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24'><path fill='%230f172a' d='M7 10l5 5 5-5z'/></svg>")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 22px center",
    backgroundSize: "32px",
  },
  checkboxContainer: {
    margin: "35px 0 45px 0",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    fontSize: "2.3rem",
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
    fontSize: "2.45rem",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 12px 35px rgba(5, 150, 105, 0.5)",
    letterSpacing: "1px",
  },
  headerForm: {
    display: "flex",
    alignItems: "center",
    gap: "25px",
    marginBottom: "40px",
    borderBottom: "3px solid #f1f5f9",
    paddingBottom: "24px",
  },
  btnVolver: {
    backgroundColor: "rgba(0,0,0,0.06)",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    padding: "12px 20px",
    borderRadius: "12px",
    fontWeight: "900",
    fontSize: "1.9rem",
    cursor: "pointer",
  },
  tituloForm: {
    margin: 0,
    fontSize: "2.8rem",
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
    padding: "20px 15px",
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
    height: "150px",
    objectFit: "contain",
  },
};
