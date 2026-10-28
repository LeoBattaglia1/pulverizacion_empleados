import { useState, useEffect } from "react";
import api from "../services/api";

export default function CargarTrabajo({ empleadoId, maquinaId, onVolver }) {
  const [pasoActual, setPasoActual] = useState(1);

  const [clientes, setClientes] = useState([]);
  const [campos, setCampos] = useState([]);
  const [lotes, setLotes] = useState([]);

  // Formulario Paso 1
  const [fechaTrabajo, setFechaTrabajo] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [clienteId, setClienteId] = useState("");
  const [campoId, setCampoId] = useState("");

  // Formulario Paso 2
  const [lotesSeleccionadosData, setLotesSeleccionadosData] = useState({});
  const [nuevoLoteNombre, setNuevoLoteNombre] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resCli, resCam, resLot] = await Promise.all([
          api.get("/clientes").catch(() => ({ data: [] })),
          api.get("/campos").catch(() => ({ data: [] })),
          api.get("/lotes").catch(() => ({ data: [] })),
        ]);
        setClientes(resCli.data);
        setCampos(resCam.data);
        setLotes(resLot.data);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };
    fetchData();
  }, []);

  const handleCampoChange = (e) => {
    setCampoId(e.target.value);
    setLotesSeleccionadosData({});
  };

  const toggleSeleccionLote = (loteId) => {
    setLotesSeleccionadosData((prev) => {
      const yaSeleccionado = !!prev[loteId];
      if (yaSeleccionado) {
        const copia = { ...prev };
        delete copia[loteId];
        return copia;
      } else {
        const lotesAnteriores = Object.values(prev);
        const ultimoLote = lotesAnteriores[lotesAnteriores.length - 1] || {};

        return {
          ...prev,
          [loteId]: {
            hectareas: "",
            tratamiento: ultimoLote.tratamiento || "",
            tratamientoOtro: ultimoLote.tratamientoOtro || "",
            tipoCultivo: ultimoLote.tipoCultivo || "",
            tipoCultivoOtro: ultimoLote.tipoCultivoOtro || "",
          },
        };
      }
    });
  };

  const handleActualizarLoteData = (loteIdTarget, campo, valor) => {
    setLotesSeleccionadosData((prev) => {
      const keys = Object.keys(prev);
      const targetIndex = keys.indexOf(String(loteIdTarget));
      if (targetIndex === -1) return prev;

      const actualizado = { ...prev };
      const esCascada =
        campo === "tratamiento" ||
        campo === "tratamientoOtro" ||
        campo === "tipoCultivo" ||
        campo === "tipoCultivoOtro";

      if (esCascada) {
        for (let i = targetIndex; i < keys.length; i++) {
          const k = keys[i];
          actualizado[k] = { ...actualizado[k], [campo]: valor };
          if (campo === "tratamiento" && valor !== "otro")
            actualizado[k].tratamientoOtro = "";
          if (campo === "tipoCultivo" && valor !== "otro")
            actualizado[k].tipoCultivoOtro = "";
        }
      } else {
        actualizado[loteIdTarget] = {
          ...actualizado[loteIdTarget],
          [campo]: valor,
        };
      }

      return actualizado;
    });
  };

  const agregarNuevoLoteDirecto = async () => {
    if (!nuevoLoteNombre.trim() || !campoId) return;
    try {
      const res = await api.post("/lotes", {
        campo_id: Number(campoId),
        numero_lote: nuevoLoteNombre.trim(),
      });

      const nuevoLoteObj = {
        id: res.data.id || Date.now(),
        campo_id: Number(campoId),
        numero_lote: nuevoLoteNombre.trim(),
      };

      setLotes((prev) => [...prev, nuevoLoteObj]);

      const lotesAnteriores = Object.values(lotesSeleccionadosData);
      const ultimoLote = lotesAnteriores[lotesAnteriores.length - 1] || {};

      setLotesSeleccionadosData((prev) => ({
        ...prev,
        [nuevoLoteObj.id]: {
          hectareas: "",
          tratamiento: ultimoLote.tratamiento || "",
          tratamientoOtro: ultimoLote.tratamientoOtro || "",
          tipoCultivo: ultimoLote.tipoCultivo || "",
          tipoCultivoOtro: ultimoLote.tipoCultivoOtro || "",
        },
      }));

      setNuevoLoteNombre("");
    } catch (error) {
      console.error("Error al crear nuevo lote:", error);
      alert("No se pudo agregar el nuevo lote.");
    }
  };

  const lotesActivosArray = Object.entries(lotesSeleccionadosData);

  const paso1Valido = Boolean(fechaTrabajo && clienteId && campoId);

  const paso2Valido =
    lotesActivosArray.length > 0 &&
    lotesActivosArray.every(
      ([, data]) =>
        Number(data.hectareas) > 0 &&
        (data.tratamiento !== "otro"
          ? data.tratamiento
          : data.tratamientoOtro) &&
        (data.tipoCultivo !== "otro" ? data.tipoCultivo : data.tipoCultivoOtro),
    );

  const enviarNotificacionWhatsApp = (resumenTrabajo) => {
    const telefonoJefe = "5492494553810";
    const clienteObj = clientes.find((c) => Number(c.id) === Number(clienteId));
    const campoObj = campos.find((c) => Number(c.id) === Number(campoId));

    let mensaje = `🚜 *NUEVO TRABAJO CARGADO*\n`;
    mensaje += `📅 *Fecha:* ${fechaTrabajo}\n`;
    mensaje += `👤 *Cliente:* ${clienteObj?.nombre || "N/A"}\n`;
    mensaje += `🌾 *Campo:* ${campoObj?.nombre || "N/A"}\n\n`;
    mensaje += `*Detalle por Lote:*\n`;

    resumenTrabajo.forEach((item) => {
      mensaje += `• *Lote ${item.lote}:* ${item.ha} Ha | ${item.tratamiento} | ${item.cultivo}\n`;
    });

    const url = `https://wa.me/${telefonoJefe}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paso2Valido) return;

    setGuardando(true);
    const resumenParaWpp = [];

    try {
      for (const [loteIdStr, data] of lotesActivosArray) {
        const loteObj = lotes.find((l) => Number(l.id) === Number(loteIdStr));
        const tratamientoFinal =
          data.tratamiento === "otro" ? data.tratamientoOtro : data.tratamiento;
        const cultivoFinal =
          data.tipoCultivo === "otro" ? data.tipoCultivoOtro : data.tipoCultivo;

        const datosTrabajo = {
          lote_id: Number(loteIdStr),
          maquina_id: Number(maquinaId),
          empleado_id: Number(empleadoId),
          cantidad_hectareas: Number(data.hectareas),
          tratamiento: tratamientoFinal || "General",
          tipo_cultivo: cultivoFinal || "General",
          fecha: fechaTrabajo,
          pendiente_precio: true, // Indicador para que el jefe complete la liquidación
        };

        await api.post("/trabajos", datosTrabajo);

        resumenParaWpp.push({
          lote: loteObj?.numero_lote || loteIdStr,
          ha: data.hectareas,
          tratamiento: tratamientoFinal,
          cultivo: cultivoFinal,
        });
      }

      alert("¡Trabajo guardado con éxito!");
      enviarNotificacionWhatsApp(resumenParaWpp);
      onVolver();
    } catch (error) {
      console.error("Error al guardar el trabajo:", error);
      alert("Hubo un error al guardar el trabajo en la base de datos.");
    } finally {
      setGuardando(false);
    }
  };

  const lotesDelCampoActual = lotes.filter(
    (l) => Number(l.campo_id) === Number(campoId),
  );

  return (
    <div>
      {/* INDICADOR DE PASOS */}
      <div style={styles.wizardHeader}>
        <div style={styles.stepBadge(pasoActual === 1, pasoActual > 1)}>
          1. Ubicación y Fecha
        </div>
        <span style={{ color: "#cbd5e1" }}>➔</span>
        <div style={styles.stepBadge(pasoActual === 2, false)}>
          2. Lotes y Cultivos
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {pasoActual === 1 && (
          <div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>📅 Fecha del Trabajo</label>
              <input
                type="date"
                value={fechaTrabajo}
                onChange={(e) => setFechaTrabajo(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>👤 Cliente</label>
              <select
                value={clienteId}
                onChange={(e) => {
                  setClienteId(e.target.value);
                  setCampoId("");
                  setLotesSeleccionadosData({});
                }}
                style={styles.select}
                required
              >
                <option value="">-- Seleccionar Cliente --</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>🌾 Campo</label>
              <select
                value={campoId}
                onChange={handleCampoChange}
                style={styles.select}
                disabled={!clienteId}
                required
              >
                <option value="">-- Seleccionar Campo --</option>
                {campos
                  .filter(
                    (c) =>
                      !clienteId || Number(c.cliente_id) === Number(clienteId),
                  )
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
              </select>
            </div>

            <div style={styles.actionsRow}>
              <button
                type="button"
                onClick={() => setPasoActual(2)}
                disabled={!paso1Valido}
                style={styles.btnSiguiente(!paso1Valido)}
              >
                Siguiente ➔
              </button>
            </div>
          </div>
        )}

        {pasoActual === 2 && (
          <div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>📍 Seleccionar Lotes</label>
              <div style={styles.lotesGrid}>
                {lotesDelCampoActual.map((lote) => {
                  const seleccionado = !!lotesSeleccionadosData[lote.id];
                  return (
                    <div
                      key={lote.id}
                      onClick={() => toggleSeleccionLote(lote.id)}
                      style={styles.loteChip(seleccionado)}
                    >
                      Lote {lote.numero_lote}
                    </div>
                  );
                })}
              </div>

              <div style={styles.nuevoLoteRow}>
                <input
                  type="text"
                  placeholder="Añadir nuevo lote..."
                  value={nuevoLoteNombre}
                  onChange={(e) => setNuevoLoteNombre(e.target.value)}
                  style={styles.inputSmall}
                />
                <button
                  type="button"
                  onClick={agregarNuevoLoteDirecto}
                  style={styles.btnAgregarLote}
                >
                  + Lote
                </button>
              </div>
            </div>

            {/* DETALLE DE LOTES SELECCIONADOS */}
            {lotesActivosArray.length > 0 && (
              <div style={styles.lotesCardContainer}>
                {lotesActivosArray.map(([loteIdStr, datos]) => {
                  const loteObj = lotes.find(
                    (l) => Number(l.id) === Number(loteIdStr),
                  );
                  return (
                    <div key={loteIdStr} style={styles.loteDetailCard}>
                      <div style={styles.loteTitle}>
                        Lote {loteObj?.numero_lote || loteIdStr}
                      </div>

                      <div style={styles.fieldSubGroup}>
                        <label style={styles.subLabel}>
                          Hectáreas Realizadas *
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={datos.hectareas}
                          onChange={(e) =>
                            handleActualizarLoteData(
                              loteIdStr,
                              "hectareas",
                              e.target.value,
                            )
                          }
                          style={styles.inputNumberBig}
                          required
                        />
                      </div>

                      <div style={styles.fieldSubGroup}>
                        <label style={styles.subLabel}>Tratamiento *</label>
                        <select
                          value={datos.tratamiento}
                          onChange={(e) =>
                            handleActualizarLoteData(
                              loteIdStr,
                              "tratamiento",
                              e.target.value,
                            )
                          }
                          style={styles.select}
                          required
                        >
                          <option value="">Seleccionar...</option>
                          <option value="Barbecho">Barbecho</option>
                          <option value="Pre-emergente">Pre-emergente</option>
                          <option value="Post-emergente">Post-emergente</option>
                          <option value="Clearsol">Clearsol</option>
                          <option value="Hoja Ancha">Hoja Ancha</option>
                          <option value="otro">Otro</option>
                        </select>
                        {datos.tratamiento === "otro" && (
                          <input
                            type="text"
                            placeholder="Especificar tratamiento..."
                            value={datos.tratamientoOtro}
                            onChange={(e) =>
                              handleActualizarLoteData(
                                loteIdStr,
                                "tratamientoOtro",
                                e.target.value,
                              )
                            }
                            style={{ ...styles.input, marginTop: "6px" }}
                            required
                          />
                        )}
                      </div>

                      <div style={styles.fieldSubGroup}>
                        <label style={styles.subLabel}>Cultivo *</label>
                        <select
                          value={datos.tipoCultivo}
                          onChange={(e) =>
                            handleActualizarLoteData(
                              loteIdStr,
                              "tipoCultivo",
                              e.target.value,
                            )
                          }
                          style={styles.select}
                          required
                        >
                          <option value="">Seleccionar...</option>
                          <option value="Girasol">Girasol</option>
                          <option value="Maíz">Maíz</option>
                          <option value="Soja">Soja</option>
                          <option value="Trigo">Trigo</option>
                          <option value="Sorgo">Sorgo</option>
                          <option value="Avena">Avena</option>
                          <option value="Cebada">Cebada</option>
                          <option value="otro">Otro</option>
                        </select>
                        {datos.tipoCultivo === "otro" && (
                          <input
                            type="text"
                            placeholder="Especificar cultivo..."
                            value={datos.tipoCultivoOtro}
                            onChange={(e) =>
                              handleActualizarLoteData(
                                loteIdStr,
                                "tipoCultivoOtro",
                                e.target.value,
                              )
                            }
                            style={{ ...styles.input, marginTop: "6px" }}
                            required
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={styles.actionsRow}>
              <button
                type="button"
                onClick={() => setPasoActual(1)}
                style={styles.btnAtras}
              >
                ⬅ Atrás
              </button>
              <button
                type="submit"
                disabled={!paso2Valido || guardando}
                style={styles.btnSubmit(paso2Valido && !guardando)}
              >
                {guardando ? "Guardando..." : "💾 GUARDAR TRABAJO Y NOTIFICAR"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

const styles = {
  wizardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid #e2e8f0",
  },
  stepBadge: (activo, completado) => ({
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "700",
    backgroundColor: activo ? "#2563eb" : completado ? "#dcfce7" : "#f1f5f9",
    color: activo ? "#ffffff" : completado ? "#15803d" : "#64748b",
  }),
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "14px",
  },
  label: {
    fontSize: "0.9rem",
    fontWeight: "700",
    color: "#334155",
  },
  subLabel: {
    fontSize: "0.8rem",
    fontWeight: "600",
    color: "#475569",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "1rem",
    width: "100%",
    boxSizing: "border-box",
  },
  select: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "1rem",
    backgroundColor: "#fff",
    width: "100%",
    boxSizing: "border-box",
  },
  lotesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
    gap: "8px",
    margin: "6px 0",
  },
  loteChip: (seleccionado) => ({
    padding: "10px",
    borderRadius: "8px",
    border: `2px solid ${seleccionado ? "#2563eb" : "#cbd5e1"}`,
    backgroundColor: seleccionado ? "#eff6ff" : "#ffffff",
    color: seleccionado ? "#1d4ed8" : "#334155",
    fontWeight: "700",
    fontSize: "0.85rem",
    textAlign: "center",
  }),
  nuevoLoteRow: {
    display: "flex",
    gap: "8px",
    marginTop: "4px",
  },
  inputSmall: {
    flex: 1,
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "0.85rem",
  },
  btnAgregarLote: {
    padding: "8px 14px",
    backgroundColor: "#0284c7",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontWeight: "700",
    fontSize: "0.85rem",
  },
  lotesCardContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    margin: "14px 0",
  },
  loteDetailCard: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  loteTitle: {
    fontSize: "0.95rem",
    fontWeight: "800",
    color: "#1e293b",
    borderBottom: "1px solid #cbd5e1",
    paddingBottom: "4px",
  },
  fieldSubGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  inputNumberBig: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #93c5fd",
    fontSize: "1.2rem",
    fontWeight: "700",
    color: "#1e3a8a",
    backgroundColor: "#eff6ff",
    width: "100%",
    boxSizing: "border-box",
  },
  actionsRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px",
  },
  btnAtras: {
    padding: "12px 20px",
    backgroundColor: "#64748b",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },
  btnSiguiente: (activo) => ({
    padding: "12px 24px",
    backgroundColor: activo ? "#2563eb" : "#cbd5e1",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: activo ? "pointer" : "not-allowed",
    width: "100%",
  }),
  btnSubmit: (activo) => ({
    flex: 1,
    padding: "14px",
    backgroundColor: activo ? "#16a34a" : "#cbd5e1",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: "800",
    cursor: activo ? "pointer" : "not-allowed",
  }),
};
