import { useState, useEffect } from "react";
import api from "../services/api";

export default function CargarTrabajo({
  empleadoId,
  maquinaId,
  nombreEmpleado,
  telefonoWhatsApp,
  onVolver,
}) {
  const [pasoActual, setPasoActual] = useState(1);

  const [clientes, setClientes] = useState([]);
  const [campos, setCampos] = useState([]);
  const [lotes, setLotes] = useState([]);

  const [fechaTrabajo, setFechaTrabajo] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [clienteId, setClienteId] = useState("");
  const [campoId, setCampoId] = useState("");

  const [nuevoClienteNombre, setNuevoClienteNombre] = useState("");
  const [nuevoCampoNombre, setNuevoCampoNombre] = useState("");

  const [lotesSeleccionadosData, setLotesSeleccionadosData] = useState({});
  const [nuevoLoteNombre, setNuevoLoteNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mostrarAlertaExito, setMostrarAlertaExito] = useState(false);

  // Estados para el teclado numérico flotante en hectáreas
  const [tecladoHectareasAbierto, setTecladoHectareasAbierto] = useState(false);
  const [loteActualId, setLoteActualId] = useState(null);

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

  // Funciones para el teclado táctil de hectáreas
  const handleTecladoHectareasClick = (valor) => {
    if (loteActualId === null) return;
    const actual = String(
      lotesSeleccionadosData[loteActualId]?.hectareas || "",
    );

    if (valor === "borrar") {
      const nuevoValor = actual.slice(0, -1);
      handleActualizarLoteData(loteActualId, "hectareas", nuevoValor);
    } else if (valor === ".") {
      if (!actual.includes(".")) {
        handleActualizarLoteData(loteActualId, "hectareas", actual + ".");
      }
    } else {
      if (actual.length < 8) {
        handleActualizarLoteData(loteActualId, "hectareas", actual + valor);
      }
    }
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

  const enviarNotificacionWhatsApp = () => {
    const campoObj = campos.find((c) => Number(c.id) === Number(campoId));
    const nombreCampo = campoObj?.nombre || "N/A";
    const cantidadLotes = lotesActivosArray.length;

    const totalHectareas = lotesActivosArray.reduce((acc, [, data]) => {
      return acc + (Number(data.hectareas) || 0);
    }, 0);

    const mensaje = `Nuevo trabajo\nFecha: ${fechaTrabajo}\nOperario: ${nombreEmpleado}\nCampo: ${nombreCampo}\nCantidad de lotes: ${cantidadLotes}\nCantidad de hectáreas: ${totalHectareas}`;

    const url = `whatsapp://send?phone=${telefonoWhatsApp}&text=${encodeURIComponent(
      mensaje,
    )}`;
    window.location.href = url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paso2Valido) return;

    setGuardando(true);

    try {
      for (const [loteIdStr, data] of lotesActivosArray) {
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
      }

      setMostrarAlertaExito(true);

      setTimeout(() => {
        enviarNotificacionWhatsApp();
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
    <div
      style={{ position: "relative", width: "100%", boxSizing: "border-box" }}
    >
      <div style={styles.headerForm}>
        <h2 style={styles.tituloForm}>Nuevo Trabajo</h2>
      </div>

      <div style={styles.wizardHeader}>
        <div style={styles.stepBadge(pasoActual === 1, pasoActual > 1)}>
          1. Ubicación y Fecha
        </div>
        <span
          style={{ color: "#94a3b8", fontSize: "1.4rem", fontWeight: "900" }}
        >
          ➔
        </span>
        <div style={styles.stepBadge(pasoActual === 2, false)}>
          2. Lotes y Cultivos
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ width: "100%", boxSizing: "border-box" }}
      >
        {pasoActual === 1 && (
          <div style={{ width: "100%" }}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Fecha del Trabajo</label>
              <input
                type="date"
                value={fechaTrabajo}
                onChange={(e) => setFechaTrabajo(e.target.value)}
                style={styles.inputDateFixed}
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
                <option value="" style={{ fontSize: "10px", padding: "12px" }}>
                  -- Seleccionar Cliente --
                </option>
                {clientes.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                    style={{ fontSize: "10px", padding: "12px" }}
                  >
                    {c.nombre}
                  </option>
                ))}
                <option
                  value="nuevo"
                  style={{ fontSize: "10px", padding: "12px" }}
                >
                  + Nuevo Cliente...
                </option>
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
                <option value="" style={{ fontSize: "10px", padding: "12px" }}>
                  -- Seleccionar Campo --
                </option>
                {campos
                  .filter((c) => Number(c.cliente_id) === Number(clienteId))
                  .map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                      style={{ fontSize: "10px", padding: "12px" }}
                    >
                      {c.nombre}
                    </option>
                  ))}
                {clienteId && clienteId !== "nuevo" && (
                  <option
                    value="nuevo"
                    style={{ fontSize: "10px", padding: "12px" }}
                  >
                    + Nuevo Campo...
                  </option>
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
                        <div
                          onClick={() => {
                            setLoteActualId(loteIdStr);
                            setTecladoHectareasAbierto(true);
                          }}
                          style={styles.inputNumberBigClickable}
                        >
                          {datos.hectareas !== "" ? (
                            datos.hectareas
                          ) : (
                            <span
                              style={{ color: "#94a3b8", fontSize: "20px" }}
                            >
                              Tocar para ingresar hectáreas...
                            </span>
                          )}
                        </div>
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
                          <option
                            value=""
                            style={{ fontSize: "10px", padding: "12px" }}
                          >
                            Seleccionar...
                          </option>
                          <option
                            value="Barbecho"
                            style={{ fontSize: "10px", padding: "12px" }}
                          >
                            Barbecho
                          </option>
                          <option
                            value="Pre-emergente"
                            style={{ fontSize: "10px", padding: "12px" }}
                          >
                            Pre-emergente
                          </option>
                          <option
                            value="Post-emergente"
                            style={{ fontSize: "10px", padding: "12px" }}
                          >
                            Post-emergente
                          </option>
                          <option
                            value="Clearsol"
                            style={{ fontSize: "10px", padding: "12px" }}
                          >
                            Clearsol
                          </option>
                          <option
                            value="Hoja Ancha"
                            style={{ fontSize: "10px", padding: "12px" }}
                          >
                            Hoja Ancha
                          </option>
                          <option
                            value="otro"
                            style={{ fontSize: "10px", padding: "12px" }}
                          >
                            Otro
                          </option>
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
                            style={{ ...styles.input, marginTop: "10px" }}
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
                          <option
                            value=""
                            style={{ fontSize: "10px", padding: "12px" }}
                          >
                            Seleccionar...
                          </option>
                          <option
                            value="Girasol"
                            style={{ fontSize: "10px", padding: "12px" }}
                          >
                            Girasol
                          </option>
                          <option
                            value="Maíz"
                            style={{ fontSize: "10px", padding: "12px" }}
                          >
                            Maíz
                          </option>
                          <option
                            value="Soja"
                            style={{ fontSize: "10px", padding: "12px" }}
                          >
                            Soja
                          </option>
                          <option
                            value="Trigo"
                            style={{ fontSize: "10px", padding: "12px" }}
                          >
                            Trigo
                          </option>
                          <option
                            value="Sorgo"
                            style={{ fontSize: "10px", padding: "12px" }}
                          >
                            Sorgo
                          </option>
                          <option
                            value="Avena"
                            style={{ fontSize: "10px", padding: "12px" }}
                          >
                            Avena
                          </option>
                          <option
                            value="Cebada"
                            style={{ fontSize: "10px", padding: "12px" }}
                          >
                            Cebada
                          </option>
                          <option
                            value="otro"
                            style={{ fontSize: "10px", padding: "12px" }}
                          >
                            Otro
                          </option>
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
                            style={{ ...styles.input, marginTop: "10px" }}
                            required
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={styles.actionsRowCustom}>
              <button
                type="button"
                onClick={() => setPasoActual(1)}
                style={styles.btnAtrasSmall}
              >
                ← Atrás
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

      {/* MODAL TECLADO TÁCTIL PARA HECTÁREAS */}
      {tecladoHectareasAbierto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalTecladoCardFull}>
            <div style={styles.modalTecladoHeader}>
              <span style={styles.modalTecladoTitulo}>
                Cantidad de Hectáreas
              </span>
              <button
                type="button"
                onClick={() => setTecladoHectareasAbierto(false)}
                style={styles.btnCloseModal}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalClaveDisplay}>
              {loteActualId !== null &&
              lotesSeleccionadosData[loteActualId]?.hectareas !== "" ? (
                lotesSeleccionadosData[loteActualId].hectareas
              ) : (
                <span style={{ color: "#94a3b8", fontSize: "28px" }}>0</span>
              )}
            </div>

            <div style={styles.tecladoGridModalFull}>
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
                ".",
                "0",
                "borrar",
                "ok",
              ].map((tecla) => {
                let textoBoton = tecla;
                let estiloBoton = styles.teclaBtnModalFull;

                if (tecla === "borrar") {
                  textoBoton = "⌫";
                  estiloBoton = styles.teclaBorrarModalFull;
                } else if (tecla === "ok") {
                  textoBoton = "✓ OK";
                  estiloBoton = styles.teclaOkModalFull;
                  // Hacemos que ocupe más espacio o se destaque
                }

                return (
                  <button
                    key={tecla}
                    type="button"
                    onClick={() => {
                      if (tecla === "ok") {
                        setTecladoHectareasAbierto(false);
                      } else {
                        handleTecladoHectareasClick(tecla);
                      }
                    }}
                    style={{
                      ...estiloBoton,
                      ...(tecla === "ok" ? { gridColumn: "span 3" } : {}),
                    }}
                  >
                    {textoBoton}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {mostrarAlertaExito && (
        <div style={styles.toastAlert}>
          <div>
            <strong>Guardar trabajo</strong>
            <div style={{ fontSize: "1.2rem", color: "#059669" }}>
              Operación exitosa
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  headerForm: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: "30px",
    borderBottom: "3px solid #f1f5f9",
    paddingBottom: "20px",
  },
  tituloForm: {
    margin: 0,
    fontSize: "2.8rem",
    color: "#0f172a",
    fontWeight: "900",
  },
  wizardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "28px",
    paddingBottom: "16px",
    borderBottom: "2px solid #e2e8f0",
    width: "100%",
  },
  stepBadge: (activo, completado) => ({
    padding: "12px 20px",
    borderRadius: "20px",
    fontSize: "1.2rem",
    fontWeight: "900",
    backgroundColor: activo ? "#059669" : completado ? "#d1fae5" : "#f1f5f9",
    color: activo ? "#ffffff" : completado ? "#065f46" : "#64748b",
  }),
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginBottom: "32px",
    width: "100%",
    boxSizing: "border-box",
  },
  label: {
    fontSize: "2.3rem",
    fontWeight: "900",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },
  subLabel: {
    fontSize: "1.8rem",
    fontWeight: "900",
    color: "#334155",
    textTransform: "uppercase",
  },
  input: {
    padding: "30px 22px",
    borderRadius: "18px",
    border: "3px solid #64748b",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontSize: "25px",
    fontWeight: "900",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  },
  inputDateFixed: {
    padding: "24px 22px",
    borderRadius: "18px",
    border: "3px solid #64748b",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontSize: "25px",
    fontWeight: "900",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    outline: "none",
  },
  select: {
    padding: "30px 22px",
    borderRadius: "18px",
    border: "3px solid #64748b",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontSize: "25px",
    fontWeight: "900",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24'><path fill='%230f172a' d='M7 10l5 5 5-5z'/></svg>")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 22px center",
    backgroundSize: "32px",
  },
  subFormContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginTop: "14px",
    padding: "20px",
    backgroundColor: "#f8fafc",
    borderRadius: "16px",
    border: "2px dashed #059669",
    width: "100%",
    boxSizing: "border-box",
  },
  btnSecundarioAccion: {
    padding: "24px",
    backgroundColor: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    fontWeight: "900",
    cursor: "pointer",
    fontSize: "1.8rem",
  },
  lotesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: "14px",
    margin: "10px 0",
    width: "100%",
    boxSizing: "border-box",
  },
  loteChip: (seleccionado) => ({
    padding: "20px 14px",
    borderRadius: "16px",
    border: `3px solid ${seleccionado ? "#059669" : "#cbd5e1"}`,
    backgroundColor: seleccionado ? "#ecfdf5" : "#ffffff",
    color: seleccionado ? "#065f46" : "#334155",
    fontWeight: "900",
    fontSize: "1.4rem",
    textAlign: "center",
    cursor: "pointer",
    boxShadow: seleccionado ? "0 4px 12px rgba(5,150,105,0.2)" : "none",
    boxSizing: "border-box",
  }),
  nuevoLoteRow: {
    display: "flex",
    gap: "12px",
    marginTop: "14px",
    width: "100%",
    boxSizing: "border-box",
  },
  inputSmall: {
    flex: 1,
    padding: "26px 22px",
    borderRadius: "16px",
    border: "3px solid #cbd5e1",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontSize: "25px",
    fontWeight: "900",
    outline: "none",
    boxSizing: "border-box",
  },
  btnAgregarLote: {
    padding: "26px 30px",
    backgroundColor: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: "16px",
    fontWeight: "900",
    fontSize: "1.8rem",
    cursor: "pointer",
  },
  lotesCardContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    margin: "24px 0",
    width: "100%",
    boxSizing: "border-box",
  },
  loteDetailCard: {
    backgroundColor: "#f8fafc",
    border: "3px solid #cbd5e1",
    borderRadius: "24px",
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    width: "100%",
    boxSizing: "border-box",
    boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
  },
  loteTitle: {
    fontSize: "1.8rem",
    fontWeight: "900",
    color: "#065f46",
    borderBottom: "3px solid #cbd5e1",
    paddingBottom: "12px",
    textTransform: "uppercase",
  },
  fieldSubGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "100%",
    boxSizing: "border-box",
  },
  inputNumberBigClickable: {
    padding: "28px",
    borderRadius: "16px",
    border: "4px solid #059669",
    fontSize: "32px",
    fontWeight: "900",
    color: "#065f46",
    backgroundColor: "#ecfdf5",
    width: "100%",
    boxSizing: "border-box",
    textAlign: "center",
    cursor: "pointer",
    boxShadow: "inset 0 4px 10px rgba(0,0,0,0.04)",
  },
  actionsRowFull: {
    display: "flex",
    width: "100%",
    marginTop: "30px",
    boxSizing: "border-box",
  },
  btnSiguienteFull: (isDisabled) => ({
    width: "100%",
    padding: "32px",
    backgroundColor: isDisabled ? "#cbd5e1" : "#059669",
    color: "#fff",
    border: "none",
    borderRadius: "20px",
    fontSize: "2.2rem",
    fontWeight: "900",
    cursor: isDisabled ? "not-allowed" : "pointer",
    boxShadow: isDisabled ? "none" : "0 10px 30px rgba(5, 150, 105, 0.4)",
    letterSpacing: "0.5px",
    boxSizing: "border-box",
  }),
  actionsRowCustom: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginTop: "30px",
    width: "100%",
    boxSizing: "border-box",
  },
  btnAtrasSmall: {
    padding: "28px 30px",
    backgroundColor: "#e2e8f0",
    color: "#334155",
    border: "3px solid #cbd5e1",
    borderRadius: "18px",
    fontSize: "1.8rem",
    fontWeight: "900",
    cursor: "pointer",
    flexShrink: 0,
    boxSizing: "border-box",
  },
  btnSubmitFull: (activo) => ({
    flex: 1,
    padding: "32px",
    backgroundColor: activo ? "#059669" : "#cbd5e1",
    color: "#ffffff",
    border: "none",
    borderRadius: "20px",
    fontSize: "2.2rem",
    fontWeight: "900",
    cursor: activo ? "pointer" : "not-allowed",
    boxShadow: activo ? "0 10px 30px rgba(5, 150, 105, 0.4)" : "none",
    letterSpacing: "0.5px",
    boxSizing: "border-box",
  }),
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
  modalTecladoCardFull: {
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
    fontSize: "48px",
    fontWeight: "900",
    textAlign: "center",
    color: "#0f172a",
    minHeight: "85px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  },
  tecladoGridModalFull: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    width: "100%",
    boxSizing: "border-box",
  },
  teclaBtnModalFull: {
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
  teclaBorrarModalFull: {
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
  teclaOkModalFull: {
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
  toastAlert: {
    position: "fixed",
    bottom: "30px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: "20px 28px",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 12px 35px rgba(0, 0, 0, 0.5)",
    zIndex: 2000,
    fontSize: "1.5rem",
    borderLeft: "6px solid #10b981",
    border: "1px solid #1e293b",
    minWidth: "320px",
    textAlign: "center",
  },
};
