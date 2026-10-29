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

  // Estados para nuevo cliente y campo dinámico
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState("");
  const [nuevoCampoNombre, setNuevoCampoNombre] = useState("");

  // Formulario Paso 2
  const [lotesSeleccionadosData, setLotesSeleccionadosData] = useState({});
  const [nuevoLoteNombre, setNuevoLoteNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mostrarAlertaExito, setMostrarAlertaExito] = useState(false);

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

  const handleClienteChange = (e) => {
    setClienteId(e.target.value);
    setCampoId("");
    setNuevoClienteNombre("");
    setNuevoCampoNombre("");
    setLotesSeleccionadosData({});
  };

  const handleCampoChange = (e) => {
    setCampoId(e.target.value);
    setNuevoCampoNombre("");
    setLotesSeleccionadosData({});
  };

  const confirmarCrearCliente = async () => {
    const nombreCli = nuevoClienteNombre.trim();
    const nombreCmp = nuevoCampoNombre.trim();

    if (!nombreCli || !nombreCmp) return;

    try {
      const resCli = await api.post("/clientes", { nombre: nombreCli });
      const nuevoCliId = resCli.data.id || Date.now();
      const cliObj = { id: nuevoCliId, nombre: nombreCli };

      const resCmp = await api.post("/campos", {
        cliente_id: Number(nuevoCliId),
        nombre: nombreCmp,
      });
      const nuevoCmpId = resCmp.data.id || Date.now();
      const cmpObj = {
        id: nuevoCmpId,
        cliente_id: Number(nuevoCliId),
        nombre: nombreCmp,
      };

      setClientes((prev) => [...prev, cliObj]);
      setCampos((prev) => [...prev, cmpObj]);

      setClienteId(String(nuevoCliId));
      setCampoId(String(nuevoCmpId));
      setNuevoClienteNombre("");
      setNuevoCampoNombre("");
    } catch (error) {
      console.error("Error al crear cliente y campo:", error);
    }
  };

  const confirmarCrearCampo = async () => {
    const nombreCmp = nuevoCampoNombre.trim();
    if (!nombreCmp || !clienteId) return;

    try {
      const resCmp = await api.post("/campos", {
        cliente_id: Number(clienteId),
        nombre: nombreCmp,
      });
      const nuevoCmpId = resCmp.data.id || Date.now();
      const cmpObj = {
        id: nuevoCmpId,
        cliente_id: Number(clienteId),
        nombre: nombreCmp,
      };

      setCampos((prev) => [...prev, cmpObj]);
      setCampoId(String(nuevoCmpId));
      setNuevoCampoNombre("");
    } catch (error) {
      console.error("Error al crear campo:", error);
    }
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
    if (!nuevoLoteNombre.trim() || !campoId || campoId === "nuevo") return;
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
    }
  };

  const lotesActivosArray = Object.entries(lotesSeleccionadosData);

  const paso1Valido = Boolean(
    fechaTrabajo &&
    clienteId &&
    clienteId !== "nuevo" &&
    campoId &&
    campoId !== "nuevo",
  );

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

    let mensaje = `NUEVO TRABAJO CARGADO\n`;
    mensaje += `Fecha: ${fechaTrabajo}\n`;
    mensaje += `Cliente: ${clienteObj?.nombre || "N/A"}\n`;
    mensaje += `Campo: ${campoObj?.nombre || "N/A"}\n\n`;
    mensaje += `Detalle por Lote:\n`;

    resumenTrabajo.forEach((item) => {
      mensaje += `- Lote ${item.lote}: ${item.ha} Ha | ${item.tratamiento} | ${item.cultivo}\n`;
    });

    const url = `https://wa.me/${telefonoJefe}?text=${encodeURIComponent(mensaje)}`;
    window.location.href = url;
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
        };

        const resTrabajo = await api.post("/trabajos", datosTrabajo);
        const trabajoId = resTrabajo.data.id || resTrabajo.data.insertId;

        await api.post("/pagos-clientes", {
          trabajo_id: Number(trabajoId),
          fecha: fechaTrabajo,
          monto_pendiente: 0,
          subtotal: 0,
          iva: 0,
          total: 0,
          precio_por_hectarea: 0,
        });

        resumenParaWpp.push({
          lote: loteObj?.numero_lote || loteIdStr,
          ha: data.hectareas,
          tratamiento: tratamientoFinal,
          cultivo: cultivoFinal,
        });
      }

      setMostrarAlertaExito(true);

      setTimeout(() => {
        enviarNotificacionWhatsApp(resumenParaWpp);
        setMostrarAlertaExito(false);
        onVolver();
      }, 1200);
    } catch (error) {
      console.error("Error al guardar el trabajo:", error);
    } finally {
      setGuardando(false);
    }
  };

  const lotesDelCampoActual = lotes.filter(
    (l) => Number(l.campo_id) === Number(campoId),
  );

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* INDICADOR DE PASOS */}
      <div style={styles.wizardHeader}>
        <div style={styles.stepBadge(pasoActual === 1, pasoActual > 1)}>
          1. Ubicación y Fecha
        </div>
        <span style={{ color: "#94a3b8" }}>➔</span>
        <div style={styles.stepBadge(pasoActual === 2, false)}>
          2. Lotes y Cultivos
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
        {pasoActual === 1 && (
          <div style={{ width: "100%" }}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Fecha del Trabajo</label>
              <input
                type="date"
                value={fechaTrabajo}
                onChange={(e) => setFechaTrabajo(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Cliente</label>
              <select
                value={clienteId}
                onChange={handleClienteChange}
                style={styles.select}
                required
              >
                <option value="">-- Seleccionar Cliente --</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
                <option value="nuevo">+ Nuevo Cliente...</option>
              </select>

              {clienteId === "nuevo" && (
                <div style={styles.subFormContainer}>
                  <input
                    type="text"
                    placeholder="Nombre del nuevo cliente *"
                    value={nuevoClienteNombre}
                    onChange={(e) => setNuevoClienteNombre(e.target.value)}
                    style={styles.input}
                  />
                  <input
                    type="text"
                    placeholder="Nombre del primer campo (Obligatorio) *"
                    value={nuevoCampoNombre}
                    onChange={(e) => setNuevoCampoNombre(e.target.value)}
                    style={styles.input}
                  />
                  <button
                    type="button"
                    onClick={confirmarCrearCliente}
                    style={styles.btnSecundarioAccion}
                  >
                    Guardar Nuevo Cliente y Campo
                  </button>
                </div>
              )}
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Campo</label>
              <select
                value={campoId}
                onChange={handleCampoChange}
                style={styles.select}
                disabled={!clienteId || clienteId === "nuevo"}
                required
              >
                <option value="">-- Seleccionar Campo --</option>
                {campos
                  .filter((c) => Number(c.cliente_id) === Number(clienteId))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                {clienteId && clienteId !== "nuevo" && (
                  <option value="nuevo">+ Nuevo Campo...</option>
                )}
              </select>

              {campoId === "nuevo" && (
                <div style={styles.subFormContainer}>
                  <input
                    type="text"
                    placeholder="Nombre del nuevo campo *"
                    value={nuevoCampoNombre}
                    onChange={(e) => setNuevoCampoNombre(e.target.value)}
                    style={styles.input}
                  />
                  <button
                    type="button"
                    onClick={confirmarCrearCampo}
                    style={styles.btnSecundarioAccion}
                  >
                    Guardar Nuevo Campo
                  </button>
                </div>
              )}
            </div>

            <div style={styles.actionsRowFull}>
              <button
                type="button"
                onClick={() => setPasoActual(2)}
                disabled={!paso1Valido}
                style={styles.btnSiguienteFull(!paso1Valido)}
              >
                Siguiente ➔
              </button>
            </div>
          </div>
        )}

        {pasoActual === 2 && (
          <div style={{ width: "100%" }}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Seleccionar Lotes</label>
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
                        {/* En CargarTrabajo.jsx, sección hectáreas */}
                        <input
                          type="number"
                          inputMode="decimal"
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

            {/* BOTONES DE ACCIÓN */}
            <div style={styles.actionsRowCustom}>
              <button
                type="button"
                onClick={() => setPasoActual(1)}
                style={styles.btnAtrasSmall}
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={!paso2Valido || guardando}
                style={styles.btnSubmitFull(paso2Valido && !guardando)}
              >
                {guardando ? "Guardando..." : "Guardar trabajo"}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Cartel de Éxito Flotante */}
      {mostrarAlertaExito && (
        <div style={styles.toastAlert}>
          <div>
            <strong>Guardar trabajo</strong>
            <div style={{ fontSize: "0.8rem", color: "#059669" }}>
              Operación exitosa
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wizardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "18px",
    paddingBottom: "12px",
    borderBottom: "1px solid #e2e8f0",
    width: "100%",
  },
  stepBadge: (activo, completado) => ({
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "800",
    backgroundColor: activo ? "#059669" : completado ? "#d1fae5" : "#f1f5f9",
    color: activo ? "#ffffff" : completado ? "#065f46" : "#64748b",
  }),
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "16px",
    width: "100%",
    boxSizing: "border-box",
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: "800",
    color: "#334155",
    textTransform: "uppercase",
  },
  subLabel: {
    fontSize: "0.8rem",
    fontWeight: "700",
    color: "#475569",
  },
  input: {
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff", // FONDO BLANCO LIMPIO
    color: "#0f172a",
    fontSize: "1rem",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
  },
  select: {
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff", // FONDO BLANCO LIMPIO
    color: "#0f172a",
    fontSize: "1rem",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
  },
  subFormContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "8px",
    padding: "14px",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    border: "1px dashed #059669",
    width: "100%",
    boxSizing: "border-box",
  },
  btnSecundarioAccion: {
    padding: "12px",
    backgroundColor: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "800",
    cursor: "pointer",
  },
  lotesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
    gap: "8px",
    margin: "6px 0",
    width: "100%",
  },
  loteChip: (seleccionado) => ({
    padding: "12px",
    borderRadius: "10px",
    border: `2px solid ${seleccionado ? "#059669" : "#cbd5e1"}`,
    backgroundColor: seleccionado ? "#ecfdf5" : "#ffffff",
    color: seleccionado ? "#065f46" : "#334155",
    fontWeight: "800",
    fontSize: "0.85rem",
    textAlign: "center",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
  }),
  nuevoLoteRow: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
    width: "100%",
  },
  inputSmall: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontSize: "0.9rem",
    outline: "none",
  },
  btnAgregarLote: {
    padding: "10px 16px",
    backgroundColor: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "800",
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  lotesCardContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    margin: "16px 0",
    width: "100%",
  },
  loteDetailCard: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
    boxSizing: "border-box",
  },
  loteTitle: {
    fontSize: "1rem",
    fontWeight: "900",
    color: "#065f46",
    borderBottom: "1px solid #cbd5e1",
    paddingBottom: "6px",
  },
  fieldSubGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    width: "100%",
  },
  inputNumberBig: {
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #059669",
    fontSize: "1.3rem",
    fontWeight: "900",
    color: "#065f46",
    backgroundColor: "#ecfdf5",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  },
  actionsRowFull: {
    display: "flex",
    width: "100%",
    marginTop: "24px",
  },
  btnSiguienteFull: (isDisabled) => ({
    width: "100%",
    padding: "16px",
    backgroundColor: isDisabled ? "#cbd5e1" : "#059669",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "1rem",
    fontWeight: "900",
    cursor: isDisabled ? "not-allowed" : "pointer",
    boxShadow: isDisabled ? "none" : "0 4px 15px rgba(5, 150, 105, 0.35)",
  }),
  actionsRowCustom: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "24px",
    width: "100%",
  },
  btnAtrasSmall: {
    padding: "14px 18px",
    backgroundColor: "#e2e8f0",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    fontSize: "0.85rem",
    fontWeight: "800",
    cursor: "pointer",
    flexShrink: 0,
  },
  btnSubmitFull: (activo) => ({
    flex: 1,
    padding: "16px",
    backgroundColor: activo ? "#059669" : "#cbd5e1",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    fontSize: "1rem",
    fontWeight: "900",
    cursor: activo ? "pointer" : "not-allowed",
    boxShadow: activo ? "0 4px 15px rgba(5, 150, 105, 0.35)" : "none",
  }),
  toastAlert: {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: "14px 22px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.6)",
    zIndex: 2000,
    fontSize: "0.95rem",
    borderLeft: "4px solid #10b981",
    border: "1px solid #1e293b",
    minWidth: "280px",
    textAlign: "center",
  },
};
