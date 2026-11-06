import { useState, useEffect, useMemo } from "react";
import api from "../services/api";

export default function VerResumen({ empleadoId, maquinaId, onVolver }) {
  const [trabajos, setTrabajos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [campos, setCampos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados de filtrado temporal
  const [filtroTemporal, setFiltroTemporal] = useState("todos");
  const [valorFecha, setValorFecha] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  useEffect(() => {
    let montado = true;

    const cargarDatosResumen = async () => {
      try {
        setCargando(true);
        const [resTrab, resCli, resCam, resLot] = await Promise.all([
          api.get("/trabajos").catch(() => ({ data: [] })),
          api.get("/clientes").catch(() => ({ data: [] })),
          api.get("/campos").catch(() => ({ data: [] })),
          api.get("/lotes").catch(() => ({ data: [] })),
        ]);

        if (montado) {
          setTrabajos(resTrab.data || []);
          setClientes(resCli.data || []);
          setCampos(resCam.data || []);
          setLotes(resLot.data || []);
        }
      } catch (error) {
        console.error(
          "Error al cargar datos para el resumen del operario:",
          error,
        );
      } finally {
        if (montado) {
          setCargando(false);
        }
      }
    };

    cargarDatosResumen();

    return () => {
      montado = false;
    };
  }, []);

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "-";
    const partes = fechaStr.split("T")[0].split("-");
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fechaStr;
  };

  // Combinar los trabajos con las descripciones y mantener los IDs de empleado y máquina
  const registrosTrabajos = useMemo(() => {
    return trabajos.map((t, idx) => {
      const loteObj = lotes.find((l) => Number(l.id) === Number(t.lote_id));
      const campoObj = campos.find(
        (c) => Number(c.id) === Number(loteObj?.campo_id),
      );
      const clienteObj = clientes.find(
        (cli) => Number(cli.id) === Number(campoObj?.cliente_id),
      );

      return {
        id: `trabajo_${t.id || idx}`,
        empleadoId: t.empleado_id || t.empleadoId,
        maquinaId: t.maquina_id || t.maquinaId,
        fecha: t.fecha || "",
        clienteNombre: clienteObj?.nombre || "N/A",
        campoNombre: campoObj?.nombre || "N/A",
        loteNombre: loteObj?.numero_lote || "N/A",
        tratamiento: t.tratamiento || "-",
        cultivo: t.tipo_cultivo || t.tipoCultivo || "-",
        hectareas: Number(t.cantidad_hectareas) || 0,
      };
    });
  }, [trabajos, lotes, campos, clientes]); // Mantenemos dependencias limpias

  // Filtrar estrictamente por el empleado, la máquina seleccionada y el período
  const trabajosFiltrados = useMemo(() => {
    return registrosTrabajos
      .filter((r) => {
        // Filtro por el empleado logueado
        if (empleadoId && String(r.empleadoId) !== String(empleadoId)) {
          return false;
        }

        // Filtro por la máquina seleccionada en esta sesión
        if (maquinaId && String(r.maquinaId) !== String(maquinaId)) {
          return false;
        }

        // Filtros temporales
        if (filtroTemporal !== "todos" && r.fecha) {
          const fechaTrabajoStr = r.fecha.split("T")[0];

          if (filtroTemporal === "dia" && valorFecha) {
            if (fechaTrabajoStr !== valorFecha) return false;
          } else if (filtroTemporal === "semana") {
            if (fechaDesde && fechaTrabajoStr < fechaDesde) return false;
            if (fechaHasta && fechaTrabajoStr > fechaHasta) return false;
          } else if (filtroTemporal === "mes" && valorFecha) {
            if (!fechaTrabajoStr.startsWith(valorFecha)) return false;
          } else if (filtroTemporal === "anio" && valorFecha) {
            if (!fechaTrabajoStr.startsWith(valorFecha)) return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const fechaA = a.fecha ? new Date(a.fecha) : new Date(0);
        const fechaB = b.fecha ? new Date(b.fecha) : new Date(0);
        return fechaB - fechaA; // Orden descendente (más recientes primero)
      });
  }, [
    registrosTrabajos,
    empleadoId,
    maquinaId,
    filtroTemporal,
    valorFecha,
    fechaDesde,
    fechaHasta,
  ]);

  const limpiarFiltros = () => {
    setFiltroTemporal("todos");
    setValorFecha("");
    setFechaDesde("");
    setFechaHasta("");
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
          Cargando registros...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerForm}>
        <h2 style={styles.tituloForm}>Mis Trabajos Realizados</h2>
        <button onClick={onVolver} style={styles.btnVolver}>
          ✕ Volver al Menú
        </button>
      </div>

      {/* Contenedor de Filtros */}
      <div style={styles.filtrosContainer}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Filtrar por Período</label>
          <select
            value={filtroTemporal}
            onChange={(e) => {
              setFiltroTemporal(e.target.value);
              setValorFecha("");
              setFechaDesde("");
              setFechaHasta("");
            }}
            style={styles.select}
          >
            <option value="todos">Todos mis registros</option>
            <option value="dia">Día específico</option>
            <option value="semana">Rango de fechas (Desde / Hasta)</option>
            <option value="mes">Mes</option>
            <option value="anio">Año</option>
          </select>
        </div>

        {filtroTemporal === "dia" && (
          <div style={styles.inputGroupDestacado}>
            <label style={styles.labelDestacado}>Seleccionar Día</label>
            <input
              type="date"
              value={valorFecha}
              onChange={(e) => setValorFecha(e.target.value)}
              style={styles.input}
            />
          </div>
        )}

        {filtroTemporal === "semana" && (
          <>
            <div style={styles.inputGroupDestacado}>
              <label style={styles.labelDestacado}>Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroupDestacado}>
              <label style={styles.labelDestacado}>Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                style={styles.input}
              />
            </div>
          </>
        )}

        {filtroTemporal === "mes" && (
          <div style={styles.inputGroupDestacado}>
            <label style={styles.labelDestacado}>Seleccionar Mes</label>
            <input
              type="month"
              value={valorFecha}
              onChange={(e) => setValorFecha(e.target.value)}
              style={styles.input}
            />
          </div>
        )}

        {filtroTemporal === "anio" && (
          <div style={styles.inputGroupDestacado}>
            <label style={styles.labelDestacado}>Ingrese Año</label>
            <input
              type="number"
              placeholder="2026"
              value={valorFecha}
              onChange={(e) => setValorFecha(e.target.value)}
              style={styles.input}
            />
          </div>
        )}

        <div style={styles.inputGroupBtn}>
          <button onClick={limpiarFiltros} style={styles.btnReset}>
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Tabla de Registros */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Fecha</th>
              <th style={styles.th}>Cliente</th>
              <th style={styles.th}>Campo</th>
              <th style={styles.th}>Lote</th>
              <th style={styles.th}>Hectáreas</th> {/* Columna movida aquí */}
              <th style={styles.th}>Tratamiento</th>
              <th style={styles.th}>Cultivo</th>
            </tr>
          </thead>
          <tbody>
            {trabajosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="7" style={styles.tdVacio}>
                  No se encontraron registros de trabajos tuyos para esta
                  máquina en los filtros seleccionados.
                </td>
              </tr>
            ) : (
              trabajosFiltrados.map((t, index) => {
                const bgRow = index % 2 === 0 ? "#ffffff" : "#f8fafc";
                return (
                  <tr key={t.id} style={{ backgroundColor: bgRow }}>
                    <td style={styles.td}>{formatearFecha(t.fecha)}</td>
                    <td style={styles.td}>{t.clienteNombre}</td>
                    <td style={styles.td}>{t.campoNombre}</td>
                    <td style={styles.td}>Lote {t.loteNombre}</td>
                    <td
                      style={{
                        ...styles.td,
                        fontWeight: "bold",
                        color: "#059669",
                      }}
                    >
                      {t.hectareas} ha
                    </td>
                    <td style={styles.td}>{t.tratamiento}</td>
                    <td style={styles.td}>{t.cultivo}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    boxSizing: "border-box",
  },
  containerCentrado: {
    padding: "60px",
    textAlign: "center",
  },
  headerForm: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    borderBottom: "3px solid #f1f5f9",
    paddingBottom: "20px",
    flexWrap: "wrap",
    gap: "15px",
  },
  tituloForm: {
    margin: 0,
    fontSize: "2.6rem",
    color: "#0f172a",
    fontWeight: "900",
  },
  btnVolver: {
    backgroundColor: "#64748b",
    color: "#ffffff",
    border: "none",
    padding: "16px 28px",
    borderRadius: "14px",
    fontWeight: "900",
    fontSize: "1.6rem",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(100, 116, 139, 0.3)",
  },
  filtrosContainer: {
    backgroundColor: "#f8fafc",
    border: "2px solid #e2e8f0",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "30px",
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    alignItems: "flex-end",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minWidth: "240px",
    flex: "1",
  },
  inputGroupDestacado: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minWidth: "220px",
    flex: "1",
    backgroundColor: "#eff6ff",
    padding: "10px 14px",
    borderRadius: "12px",
    border: "2px dashed #3b82f6",
  },
  inputGroupBtn: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  label: {
    fontSize: "1.4rem",
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
  },
  labelDestacado: {
    fontSize: "1.4rem",
    fontWeight: "900",
    color: "#1d4ed8",
    textTransform: "uppercase",
  },
  input: {
    padding: "14px 16px",
    borderRadius: "12px",
    border: "2px solid #cbd5e1",
    fontSize: "1.6rem",
    backgroundColor: "#fff",
    boxSizing: "border-box",
    width: "100%",
    fontWeight: "700",
  },
  select: {
    padding: "14px 16px",
    borderRadius: "12px",
    border: "2px solid #cbd5e1",
    fontSize: "1.6rem",
    backgroundColor: "#fff",
    boxSizing: "border-box",
    width: "100%",
    fontWeight: "700",
  },
  btnReset: {
    padding: "16px 24px",
    backgroundColor: "#475569",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "1.6rem",
    fontWeight: "900",
    height: "58px",
    whiteSpace: "nowrap",
  },
  tableCard: {
    backgroundColor: "#ffffff",
    border: "2px solid #e2e8f0",
    borderRadius: "20px",
    padding: "15px",
    maxHeight: "65vh",
    overflowY: "auto",
    overflowX: "auto",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "1.6rem",
  },
  th: {
    textAlign: "left",
    padding: "18px 14px",
    color: "#ffffff",
    fontWeight: "900",
    backgroundColor: "#0f172a",
    textTransform: "uppercase",
    fontSize: "1.5rem",
    letterSpacing: "0.5px",
  },
  td: {
    padding: "16px 14px",
    textAlign: "left",
    verticalAlign: "middle",
    borderBottom: "2px solid #f1f5f9",
    color: "#1e293b",
    fontWeight: "700",
  },
  tdVacio: {
    textAlign: "center",
    color: "#64748b",
    padding: "40px",
    fontSize: "1.8rem",
    fontWeight: "800",
  },
  spinner: {
    width: "65px",
    height: "65px",
    border: "6px solid #334155",
    borderTop: "6px solid #34d399",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto",
  },
};
