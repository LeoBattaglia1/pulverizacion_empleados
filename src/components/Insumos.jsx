import { useState, useEffect } from "react";
import api from "../services/api";

const styles = {
  container: {
    padding: "10px 0",
    width: "100%",
    boxSizing: "border-box",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "30px",
    width: "100%",
  },
  tanqueCard: (colorBorde) => ({
    backgroundColor: "#ffffff",
    borderRadius: "28px",
    border: `4px solid ${colorBorde}`,
    padding: "30px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 12px 35px rgba(0,0,0,0.08)",
    position: "relative",
    width: "100%",
    boxSizing: "border-box",
  }),
  tanqueHeader: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "18px",
  },
  tanqueNombre: {
    fontSize: "1.6rem",
    fontWeight: "900",
    color: "#0f172a",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tanqueContenedorGrafico: {
    width: "180px",
    height: "260px",
    backgroundColor: "#f8fafc",
    borderRadius: "20px",
    border: "4px solid #94a3b8",
    position: "relative",
    overflow: "hidden",
    boxShadow: "inset 0 6px 15px rgba(0,0,0,0.12)",
    marginBottom: "22px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  liquidoTanque: {
    width: "100%",
    transition: "height 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    backgroundImage:
      "linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.1) 100%)",
  },
  reflejoLiquido: {
    position: "absolute",
    top: 0,
    left: "15%",
    width: "25%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    filter: "blur(3px)",
  },
  tapaSuperiorTanque: {
    position: "absolute",
    top: "-8px",
    left: "25%",
    width: "50%",
    height: "8px",
    backgroundColor: "#475569",
    borderRadius: "4px 4px 0 0",
  },
  infoTotales: {
    textAlign: "center",
    marginBottom: "24px",
  },
  cantidadActualText: {
    fontSize: "2.2rem",
    fontWeight: "900",
    color: "#0f172a",
  },
  capacidadMaxText: {
    fontSize: "1rem",
    color: "#64748b",
    fontWeight: "700",
    marginTop: "4px",
  },
  botonesAccion: {
    display: "flex",
    gap: "16px",
    width: "100%",
  },
  btnCargarStock: {
    flex: 1,
    padding: "18px",
    backgroundColor: "#059669",
    color: "#ffffff",
    border: "none",
    borderRadius: "16px",
    fontSize: "1.15rem",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(5, 150, 105, 0.4)",
    letterSpacing: "0.5px",
  },
  btnUsarStock: {
    flex: 1,
    padding: "18px",
    backgroundColor: "#dc2626",
    color: "#ffffff",
    border: "none",
    borderRadius: "16px",
    fontSize: "1.15rem",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(220, 38, 38, 0.4)",
    letterSpacing: "0.5px",
  },
  // MODAL GIGANTE Y CON LETRAS MAS GRANDES
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "16px",
    boxSizing: "border-box",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    padding: "45px 36px",
    borderRadius: "32px",
    maxWidth: "520px",
    width: "100%",
    boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
    position: "relative",
    border: "3px solid #64748b",
  },
  btnCloseX: {
    position: "absolute",
    top: "22px",
    right: "22px",
    background: "#f1f5f9",
    border: "2px solid #cbd5e1",
    borderRadius: "50%",
    width: "48px",
    height: "48px",
    fontSize: "1.6rem",
    fontWeight: "900",
    color: "#0f172a",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "28px",
  },
  label: {
    fontSize: "1.2rem",
    fontWeight: "900",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },
  input: {
    padding: "22px 20px",
    borderRadius: "16px",
    border: "3px solid #64748b",
    fontSize: "1.2rem", // Letras grandes dentro del input
    fontWeight: "900",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    boxSizing: "border-box",
    width: "100%",
    outline: "none",
  },
  btnModalSubmit: (isReponer) => ({
    flex: 1,
    padding: "22px",
    backgroundColor: isReponer ? "#059669" : "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "16px",
    fontSize: "1.25rem",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: isReponer
      ? "0 8px 25px rgba(5,150,105,0.4)"
      : "0 8px 25px rgba(220,38,38,0.4)",
    letterSpacing: "0.5px",
  }),
  btnModalCancel: {
    padding: "22px 24px",
    backgroundColor: "#e2e8f0",
    color: "#334155",
    border: "2px solid #cbd5e1",
    borderRadius: "16px",
    fontSize: "1.2rem",
    fontWeight: "900",
    cursor: "pointer",
  },
  alertaBox: {
    backgroundColor: "#fef2f2",
    border: "3px solid #fecaca",
    color: "#991b1b",
    padding: "16px 20px",
    borderRadius: "14px",
    fontSize: "1.1rem",
    marginBottom: "24px",
    fontWeight: "900",
    textAlign: "center",
  },
  toastContainer: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  toast: (tipo) => ({
    padding: "14px 22px",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "1.05rem",
    fontWeight: "800",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
    backgroundColor: tipo === "error" ? "#dc2626" : "#059669",
  }),
};

const paletaBordesCards = [
  "#059669",
  "#0284c7",
  "#d97706",
  "#8b5cf6",
  "#db2777",
  "#14b8a6",
  "#f97316",
  "#6366f1",
];

const paletaColoresBarril = [
  "#0284c7",
  "#059669",
  "#d97706",
  "#9333ea",
  "#db2777",
  "#0d9488",
  "#4f46e5",
  "#ca8a04",
];

export default function Insumos({ empleadoId, maquinaId }) {
  const [insumos, setInsumos] = useState([]);
  const [toasts, setToasts] = useState([]);

  const [modalCargarAbierto, setModalCargarAbierto] = useState(false);
  const [modalUsarAbierto, setModalUsarAbierto] = useState(false);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);

  const [cantidadCargar, setCantidadCargar] = useState("");
  const [fechaIngreso, setFechaIngreso] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [cantidadUsar, setCantidadUsar] = useState("");
  const [fechaUso, setFechaUso] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [errorStock, setErrorStock] = useState("");

  const mostrarToast = (mensaje, tipo = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const cargarInsumos = async () => {
    try {
      const resInsumos = await api.get("/insumos").catch(() => ({ data: [] }));
      setInsumos(resInsumos.data);
    } catch (error) {
      console.error("Error al cargar insumos:", error);
    }
  };

  useEffect(() => {
    let montado = true;

    const obtenerDatos = async () => {
      try {
        const resInsumos = await api
          .get("/insumos")
          .catch(() => ({ data: [] }));
        if (montado) {
          setInsumos(resInsumos.data);
        }
      } catch (error) {
        console.error("Error al obtener insumos:", error);
      }
    };

    obtenerDatos();

    return () => {
      montado = false;
    };
  }, []);

  const handleCargarStock = async (e) => {
    e.preventDefault();
    if (!insumoSeleccionado) return;

    try {
      await api.post("/insumos/ingresos", {
        insumo_id: Number(insumoSeleccionado.id),
        cantidad: Number(cantidadCargar),
        fecha: fechaIngreso,
        empleado_id: empleadoId ? Number(empleadoId) : null,
        maquina_id: maquinaId ? Number(maquinaId) : null,
      });

      setModalCargarAbierto(false);
      setCantidadCargar("");
      mostrarToast("Stock repuesto correctamente");
      cargarInsumos();
    } catch (error) {
      console.error("Error al registrar ingreso:", error);
      mostrarToast("Error al registrar la reposición", "error");
    }
  };

  const handleUsarInsumo = async (e) => {
    e.preventDefault();
    if (!insumoSeleccionado) return;

    const cantidadRetiro = Number(cantidadUsar);
    const stockActual = Number(insumoSeleccionado.stock_actual) || 0;

    if (cantidadRetiro > stockActual) {
      setErrorStock(
        "La cantidad supera el stock actual disponible (" + stockActual + "L).",
      );
      return;
    }

    try {
      await api.post("/insumos/retiros", {
        insumo_id: Number(insumoSeleccionado.id),
        empleado_id: empleadoId ? Number(empleadoId) : null,
        maquina_id: maquinaId ? Number(maquinaId) : null,
        cantidad: cantidadRetiro,
        fecha: fechaUso,
      });

      setModalUsarAbierto(false);
      setCantidadUsar("");
      setErrorStock("");
      mostrarToast("Retiro registrado con éxito");
      cargarInsumos();
    } catch (error) {
      console.error("Error al registrar retiro:", error);
      mostrarToast("Error al registrar el retiro", "error");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.toastContainer}>
        {toasts.map((t) => (
          <div key={t.id} style={styles.toast(t.tipo)}>
            {t.mensaje}
          </div>
        ))}
      </div>

      <div style={styles.grid}>
        {insumos.map((i, index) => {
          const colorBordeCard =
            paletaBordesCards[index % paletaBordesCards.length];
          const stockActual = Math.round(Number(i.stock_actual) || 0);

          const esGasoil = i.nombre.toLowerCase().includes("gasoil");
          const capacidadMaxRef = esGasoil ? 1500 : 200;
          const umbralAlerta = esGasoil ? 100 : 20;

          const porcentaje = Math.min(
            Math.round((stockActual / capacidadMaxRef) * 100),
            100,
          );

          let colorLiquido =
            paletaColoresBarril[index % paletaColoresBarril.length];
          if (stockActual <= 0) {
            colorLiquido = "#94a3b8";
          } else if (stockActual <= umbralAlerta) {
            colorLiquido = "#dc2626";
          }

          return (
            <div key={i.id} style={styles.tanqueCard(colorBordeCard)}>
              <div style={styles.tanqueHeader}>
                <div style={styles.tanqueNombre}>{i.nombre}</div>
              </div>

              {stockActual <= umbralAlerta && stockActual > 0 && (
                <div
                  style={{
                    fontSize: "0.95rem",
                    backgroundColor: "#fee2e2",
                    color: "#991b1b",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    marginBottom: "16px",
                    fontWeight: "900",
                  }}
                >
                  ⚠️ Stock Bajo (≤ {umbralAlerta}L)
                </div>
              )}

              <div style={styles.tanqueContenedorGrafico}>
                <div style={styles.tapaSuperiorTanque}></div>
                <div
                  style={{
                    ...styles.liquidoTanque,
                    height: `${stockActual > 0 ? Math.max(porcentaje, 6) : 0}%`,
                    backgroundColor: colorLiquido,
                  }}
                >
                  <div style={styles.reflejoLiquido}></div>
                </div>
              </div>

              <div style={styles.infoTotales}>
                <div style={styles.cantidadActualText}>
                  {stockActual.toLocaleString()} L
                </div>
                <div style={styles.capacidadMaxText}>
                  Capacidad ref: {capacidadMaxRef} L
                </div>
              </div>

              <div style={styles.botonesAccion}>
                <button
                  onClick={() => {
                    setInsumoSeleccionado(i);
                    setCantidadCargar("");
                    setFechaIngreso(new Date().toISOString().split("T")[0]);
                    setModalCargarAbierto(true);
                  }}
                  style={styles.btnCargarStock}
                >
                  Reponer
                </button>
                <button
                  onClick={() => {
                    setInsumoSeleccionado(i);
                    setCantidadUsar("");
                    setFechaUso(new Date().toISOString().split("T")[0]);
                    setErrorStock("");
                    setModalUsarAbierto(true);
                  }}
                  style={styles.btnUsarStock}
                >
                  Retirar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL REPOSICIÓN GIGANTE */}
      {modalCargarAbierto && insumoSeleccionado && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <button
              onClick={() => setModalCargarAbierto(false)}
              style={styles.btnCloseX}
            >
              ✕
            </button>
            <h3
              style={{
                marginBottom: "12px",
                color: "#0f172a",
                fontSize: "1.7rem",
                fontWeight: "900",
              }}
            >
              Reponer: {insumoSeleccionado.nombre}
            </h3>
            <p
              style={{
                fontSize: "1.15rem",
                color: "#64748b",
                marginBottom: "28px",
                fontWeight: "800",
              }}
            >
              Stock actual:{" "}
              <b style={{ color: "#0f172a" }}>
                {Math.round(Number(insumoSeleccionado.stock_actual) || 0)} L
              </b>
            </p>
            <form onSubmit={handleCargarStock}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Cantidad a Ingresar *</label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  step="1"
                  placeholder="Ej: 200"
                  required
                  value={cantidadCargar}
                  onChange={(e) => setCantidadCargar(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Fecha *</label>
                <input
                  type="date"
                  required
                  value={fechaIngreso}
                  onChange={(e) => setFechaIngreso(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  marginTop: "35px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setModalCargarAbierto(false)}
                  style={styles.btnModalCancel}
                >
                  Cancelar
                </button>
                <button type="submit" style={styles.btnModalSubmit(true)}>
                  Confirmar Reposición
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RETIRO GIGANTE */}
      {modalUsarAbierto && insumoSeleccionado && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <button
              onClick={() => setModalUsarAbierto(false)}
              style={styles.btnCloseX}
            >
              ✕
            </button>
            <h3
              style={{
                marginBottom: "12px",
                color: "#0f172a",
                fontSize: "1.7rem",
                fontWeight: "900",
              }}
            >
              Retirar: {insumoSeleccionado.nombre}
            </h3>
            <p
              style={{
                fontSize: "1.15rem",
                color: "#64748b",
                marginBottom: "28px",
                fontWeight: "800",
              }}
            >
              Stock disponible:{" "}
              <b style={{ color: "#0f172a" }}>
                {Math.round(Number(insumoSeleccionado.stock_actual) || 0)} L
              </b>
            </p>

            {errorStock && <div style={styles.alertaBox}>{errorStock}</div>}

            <form onSubmit={handleUsarInsumo}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Cantidad a Retirar *</label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  step="1"
                  placeholder="Ej: 50"
                  required
                  value={cantidadUsar}
                  onChange={(e) => {
                    setCantidadUsar(e.target.value);
                    if (errorStock) setErrorStock("");
                  }}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Fecha *</label>
                <input
                  type="date"
                  required
                  value={fechaUso}
                  onChange={(e) => setFechaUso(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  marginTop: "35px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setModalUsarAbierto(false)}
                  style={styles.btnModalCancel}
                >
                  Cancelar
                </button>
                <button type="submit" style={styles.btnModalSubmit(false)}>
                  Confirmar Retiro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
