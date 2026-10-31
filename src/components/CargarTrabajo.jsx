import { useState, useEffect } from "react";
import api from "../services/api";

// Función auxiliar para normalizar texto (elimina acentos y pasa a minúsculas)
const normalizarTexto = (texto) => {
  if (!texto) return "";
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
};

export default function CargarTrabajo({ empleadoId, maquinaId, onVolver }) {
  const [pasoActual, setPasoActual] = useState(1);

  const [clientes, setClientes] = useState([]);
  const [campos, setCampos] = useState([]);
  const [lotes, setLotes] = useState([]);

  const [fechaTrabajo, setFechaTrabajo] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [clienteId, setClienteId] = useState("");
  const [campoId, setCampoId] = useState("");

  // Modales para Nuevos Registros
  const [modalClienteAbierto, setModalClienteAbierto] = useState(false);
  const [modalCampoAbierto, setModalCampoAbierto] = useState(false);
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState("");
  const [nuevoCampoParaCliente, setNuevoCampoParaCliente] = useState("");
  const [nuevoCampoNombre, setNuevoCampoNombre] = useState("");

  // Alertas en tiempo real para inputs
  const [errorClienteInput, setErrorClienteInput] = useState("");
  const [errorCampoInput, setErrorCampoInput] = useState("");
  const [errorLoteInput, setErrorLoteInput] = useState("");

  const [lotesSeleccionadosData, setLotesSeleccionadosData] = useState({});
  const [textoLotesMultiples, setTextoLotesMultiples] = useState("");
  const [lotesNuevosSesion, setLotesNuevosSesion] = useState([]);

  const [guardando, setGuardando] = useState(false);
  const [mostrarAlertaExito, setMostrarAlertaExito] = useState(false);
  const [mensajeErrorValidacion, setMensajeErrorValidacion] = useState("");

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
    setLotesSeleccionadosData({});
    setLotesNuevosSesion([]);
    setMensajeErrorValidacion("");
  };

  const handleCampoChange = (e) => {
    setCampoId(e.target.value);
    setLotesSeleccionadosData({});
    setLotesNuevosSesion([]);
    setMensajeErrorValidacion("");
  };

  // Validación en tiempo real al tipear el nombre del cliente
  const handleClienteInputChange = (e) => {
    const valor = e.target.value;
    setNuevoClienteNombre(valor);
    setErrorClienteInput("");

    if (!valor.trim()) return;

    const normIngresado = normalizarTexto(valor);
    const existe = clientes.some(
      (c) => normalizarTexto(c.nombre) === normIngresado,
    );

    if (existe) {
      setErrorClienteInput(
        `Atención: El cliente "${valor.trim()}" ya existe en el sistema.`,
      );
    }
  };

  // Validación en tiempo real al tipear el nombre del campo nuevo
  const handleCampoInputChange = (valorTiTeado) => {
    setNuevoCampoNombre(valorTiTeado);
    setErrorCampoInput("");

    if (!valorTiTeado.trim() || !clienteId) return;

    const normIngresado = normalizarTexto(valorTiTeado);
    const camposDelCliente = campos.filter(
      (c) => Number(c.cliente_id) === Number(clienteId),
    );

    const existe = camposDelCliente.some(
      (c) => normalizarTexto(c.nombre) === normIngresado,
    );

    if (existe) {
      setErrorCampoInput(
        `Atención: El campo "${valorTiTeado.trim()}" ya está agregado a este cliente.`,
      );
    }
  };

  const confirmarCrearCliente = async () => {
    const nombreCli = nuevoClienteNombre.trim();
    const nombreCmp = nuevoCampoParaCliente.trim();

    if (!nombreCli || !nombreCmp) {
      setMensajeErrorValidacion("Complete el nombre del cliente y su campo.");
      return;
    }

    const normCli = normalizarTexto(nombreCli);
    const clienteExistente = clientes.some(
      (c) => normalizarTexto(c.nombre) === normCli,
    );

    if (clienteExistente) {
      setErrorClienteInput(
        `El cliente "${nombreCli}" ya existe en el sistema.`,
      );
      return;
    }

    setMensajeErrorValidacion("");
    setErrorClienteInput("");

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
      setNuevoCampoParaCliente("");
      setErrorClienteInput("");
      setModalClienteAbierto(false);
    } catch (error) {
      console.error("Error al crear cliente y campo:", error);
    }
  };

  const confirmarCrearCampo = async () => {
    const nombreCmp = nuevoCampoNombre.trim();
    if (!nombreCmp || !clienteId) return;

    const normCmp = normalizarTexto(nombreCmp);
    const camposDelCliente = campos.filter(
      (c) => Number(c.cliente_id) === Number(clienteId),
    );

    const campoExistente = camposDelCliente.some(
      (c) => normalizarTexto(c.nombre) === normCmp,
    );

    if (campoExistente) {
      setErrorCampoInput(
        `El campo "${nombreCmp}" ya se encuentra agregado a este cliente.`,
      );
      return;
    }

    setMensajeErrorValidacion("");
    setErrorCampoInput("");

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
      setErrorCampoInput("");
      setModalCampoAbierto(false);
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

  const procesarLotesMultiples = () => {
    if (!textoLotesMultiples.trim() || !campoId) return;
    setMensajeErrorValidacion("");
    setErrorLoteInput("");

    const nombresLotes = textoLotesMultiples
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (nombresLotes.length === 0) return;

    const lotesExistentesEnCampo = lotes.filter(
      (l) => Number(l.campo_id) === Number(campoId),
    );

    const nuevosIdsAgregados = {};
    const nuevosNombresSesion = [...lotesNuevosSesion];

    for (const nombreLote of nombresLotes) {
      const normLote = normalizarTexto(nombreLote);

      const yaExisteBD = lotesExistentesEnCampo.some(
        (l) => normalizarTexto(l.numero_lote) === normLote,
      );

      const yaExisteSesion = nuevosNombresSesion.some(
        (l) => normalizarTexto(l.numero_lote) === normLote,
      );

      if (yaExisteBD || yaExisteSesion) {
        setErrorLoteInput(
          `Error: El lote "${nombreLote}" ya se encuentra cargado para este campo.`,
        );
        return;
      }

      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

      nuevosNombresSesion.push({ tempId, numero_lote: nombreLote });

      const lotesAnteriores = Object.values(lotesSeleccionadosData);
      const ultimoLote = lotesAnteriores[lotesAnteriores.length - 1] || {};

      nuevosIdsAgregados[tempId] = {
        esNuevo: true,
        numero_lote: nombreLote,
        hectareas: "",
        tratamiento: ultimoLote.tratamiento || "",
        tratamientoOtro: ultimoLote.tratamientoOtro || "",
        tipoCultivo: ultimoLote.tipoCultivo || "",
        tipoCultivoOtro: ultimoLote.tipoCultivoOtro || "",
      };
    }

    setLotesNuevosSesion(nuevosNombresSesion);
    setLotesSeleccionadosData((prev) => ({
      ...prev,
      ...nuevosIdsAgregados,
    }));
    setTextoLotesMultiples("");
    setErrorLoteInput("");
  };

  const eliminarLoteSesion = (idTarget) => {
    setLotesSeleccionadosData((prev) => {
      const copia = { ...prev };
      delete copia[idTarget];
      return copia;
    });
    setLotesNuevosSesion((prev) => prev.filter((l) => l.tempId !== idTarget));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paso2Valido) return;

    setGuardando(true);

    try {
      const mapaIdsLotesFinales = {};

      for (const [key, data] of lotesActivosArray) {
        if (!data.esNuevo) {
          mapaIdsLotesFinales[key] = Number(key);
        }
      }

      for (const [key, data] of lotesActivosArray) {
        if (data.esNuevo) {
          const resLote = await api.post("/lotes", {
            campo_id: Number(campoId),
            numero_lote: data.numero_lote,
          });
          const loteIdReal = resLote.data.id || resLote.data.insertId;
          mapaIdsLotesFinales[key] = Number(loteIdReal);
        }
      }

      for (const [loteKey, data] of lotesActivosArray) {
        const loteIdFinal = mapaIdsLotesFinales[loteKey];
        const tratamientoFinal =
          data.tratamiento === "otro" ? data.tratamientoOtro : data.tratamiento;
        const cultivoFinal =
          data.tipoCultivo === "otro" ? data.tipoCultivoOtro : data.tipoCultivo;

        const datosTrabajo = {
          lote_id: Number(loteIdFinal),
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

      setGuardando(false);
      setMostrarAlertaExito(true);

      setTimeout(() => {
        setMostrarAlertaExito(false);
        setPasoActual(1);
        setClienteId("");
        setCampoId("");
        setLotesSeleccionadosData({});
        setLotesNuevosSesion([]);
        setTextoLotesMultiples("");
        onVolver();
      }, 3000);
    } catch (error) {
      console.error("Error al guardar el trabajo:", error);
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

      {pasoActual === 2 && (
        <div style={{ marginBottom: "20px" }}>
          <button
            type="button"
            onClick={() => setPasoActual(1)}
            style={styles.btnVolverPaso1}
          >
            ← Volver a Ubicación y Fecha
          </button>
        </div>
      )}

      {mensajeErrorValidacion && (
        <div style={styles.alertaErrorBox}>⚠️ {mensajeErrorValidacion}</div>
      )}

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
                style={styles.inputFechaCompacta}
                required
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Cliente</label>
              <div style={styles.selectWithButtonRow}>
                <select
                  value={clienteId}
                  onChange={handleClienteChange}
                  style={styles.select}
                  required
                >
                  <option
                    value=""
                    style={{ fontSize: "16px", padding: "12px" }}
                  >
                    -- Seleccionar Cliente --
                  </option>
                  {clientes.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                      style={{ fontSize: "18px", padding: "12px" }}
                    >
                      {c.nombre}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setNuevoClienteNombre("");
                    setNuevoCampoParaCliente("");
                    setErrorClienteInput("");
                    setMensajeErrorValidacion("");
                    setModalClienteAbierto(true);
                  }}
                  style={styles.btnAccionExternaModal}
                >
                  + Nuevo Cliente
                </button>
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Campo</label>
              <div style={styles.selectWithButtonRow}>
                <select
                  value={campoId}
                  onChange={handleCampoChange}
                  style={styles.select}
                  disabled={!clienteId}
                  required
                >
                  <option
                    value=""
                    style={{ fontSize: "16px", padding: "12px" }}
                  >
                    -- Seleccionar Campo --
                  </option>
                  {campos
                    .filter((c) => Number(c.cliente_id) === Number(clienteId))
                    .map((c) => (
                      <option
                        key={c.id}
                        value={c.id}
                        style={{ fontSize: "18px", padding: "12px" }}
                      >
                        {c.nombre}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setNuevoCampoNombre("");
                    setErrorCampoInput("");
                    setMensajeErrorValidacion("");
                    setModalCampoAbierto(true);
                  }}
                  disabled={!clienteId}
                  style={styles.btnAccionExternaModal}
                >
                  + Nuevo Campo
                </button>
              </div>
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
              <label style={styles.label}>Seleccionar Lotes Existentes</label>
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
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Nuevos Lotes</label>
              <div style={styles.ayudaCargaBox}>
                Escribi los lotes separados por , . Ejemplo:{" "}
                <code>1, 2, 3, Norte</code>
              </div>
              <div style={styles.nuevoLoteRow}>
                <input
                  type="text"
                  placeholder="Ej: 1, 2, 3, Norte..."
                  value={textoLotesMultiples}
                  onChange={(e) => setTextoLotesMultiples(e.target.value)}
                  style={styles.inputLoteLibre}
                />
                <button
                  type="button"
                  onClick={procesarLotesMultiples}
                  style={styles.btnAgregarLote}
                >
                  + Cargar Lotes
                </button>
              </div>
              {errorLoteInput && (
                <div style={styles.alertaErrorInputInline}>
                  ⚠️ {errorLoteInput}
                </div>
              )}
            </div>

            {lotesActivosArray.length > 0 && (
              <div style={styles.lotesCardContainer}>
                {lotesActivosArray.map(([loteIdStr, datos]) => {
                  const loteObj = lotes.find(
                    (l) => Number(l.id) === Number(loteIdStr),
                  );
                  const nombreLoteMostrar = datos.esNuevo
                    ? datos.numero_lote
                    : loteObj?.numero_lote || loteIdStr;

                  return (
                    <div key={loteIdStr} style={styles.loteDetailCard}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom: "3px solid #cbd5e1",
                          paddingBottom: "12px",
                        }}
                      >
                        <div style={styles.loteTitle}>
                          Lote {nombreLoteMostrar}
                        </div>
                        {datos.esNuevo && (
                          <button
                            type="button"
                            onClick={() => eliminarLoteSesion(loteIdStr)}
                            style={styles.btnEliminarLoteSesion}
                          >
                            Eliminar Lote
                          </button>
                        )}
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
                            style={{ fontSize: "16px", padding: "12px" }}
                          >
                            Seleccionar...
                          </option>
                          <option
                            value="Barbecho"
                            style={{ fontSize: "18px", padding: "12px" }}
                          >
                            Barbecho
                          </option>
                          <option
                            value="Pre-emergente"
                            style={{ fontSize: "18px", padding: "12px" }}
                          >
                            Pre-emergente
                          </option>
                          <option
                            value="Post-emergente"
                            style={{ fontSize: "18px", padding: "12px" }}
                          >
                            Post-emergente
                          </option>
                          <option
                            value="Clearsol"
                            style={{ fontSize: "18px", padding: "12px" }}
                          >
                            Clearsol
                          </option>
                          <option
                            value="Hoja Ancha"
                            style={{ fontSize: "18px", padding: "12px" }}
                          >
                            Hoja Ancha
                          </option>
                          <option
                            value="otro"
                            style={{ fontSize: "18px", padding: "12px" }}
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
                            style={{ fontSize: "16px", padding: "12px" }}
                          >
                            Seleccionar...
                          </option>
                          <option
                            value="Girasol"
                            style={{ fontSize: "18px", padding: "12px" }}
                          >
                            Girasol
                          </option>
                          <option
                            value="Maíz"
                            style={{ fontSize: "18px", padding: "12px" }}
                          >
                            Maíz
                          </option>
                          <option
                            value="Soja"
                            style={{ fontSize: "18px", padding: "12px" }}
                          >
                            Soja
                          </option>
                          <option
                            value="Trigo"
                            style={{ fontSize: "18px", padding: "12px" }}
                          >
                            Trigo
                          </option>
                          <option
                            value="Sorgo"
                            style={{ fontSize: "18px", padding: "12px" }}
                          >
                            Sorgo
                          </option>
                          <option
                            value="Avena"
                            style={{ fontSize: "18px", padding: "12px" }}
                          >
                            Avena
                          </option>
                          <option
                            value="Cebada"
                            style={{ fontSize: "18px", padding: "12px" }}
                          >
                            Cebada
                          </option>
                          <option
                            value="otro"
                            style={{ fontSize: "18px", padding: "12px" }}
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
                ← Volver
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

      {/* MODAL NUEVO CLIENTE (GIGANTE) */}
      {modalClienteAbierto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardGigante}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitulo}>Registrar Nuevo Cliente</span>
              <button
                type="button"
                onClick={() => setModalClienteAbierto(false)}
                style={styles.btnCloseModal}
              >
                ✕
              </button>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "25px" }}
            >
              <div style={styles.fieldGroup}>
                <label style={styles.labelModal}>Nombre del Cliente *</label>
                <input
                  type="text"
                  placeholder="Ej: Agropecuaria San José"
                  value={nuevoClienteNombre}
                  onChange={handleClienteInputChange}
                  style={styles.inputModalGigante}
                />
                {errorClienteInput && (
                  <div style={styles.alertaErrorInputInline}>
                    ⚠️ {errorClienteInput}
                  </div>
                )}
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.labelModal}>Nombre del Campo *</label>
                <input
                  type="text"
                  placeholder="Ej: Campo La Blanqueada"
                  value={nuevoCampoParaCliente}
                  onChange={(e) => setNuevoCampoParaCliente(e.target.value)}
                  style={styles.inputModalGigante}
                />
              </div>
              <button
                type="button"
                onClick={confirmarCrearCliente}
                disabled={
                  !nuevoClienteNombre.trim() ||
                  !nuevoCampoParaCliente.trim() ||
                  Boolean(errorClienteInput)
                }
                style={styles.btnModalConfirmar(
                  !nuevoClienteNombre.trim() ||
                    !nuevoCampoParaCliente.trim() ||
                    Boolean(errorClienteInput),
                )}
              >
                Guardar Cliente y Campo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO CAMPO (GIGANTE) */}
      {modalCampoAbierto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardGigante}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitulo}>Registrar Nuevo Campo</span>
              <button
                type="button"
                onClick={() => setModalCampoAbierto(false)}
                style={styles.btnCloseModal}
              >
                ✕
              </button>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "25px" }}
            >
              <div style={styles.fieldGroup}>
                <label style={styles.labelModal}>Nombre del Campo *</label>
                <input
                  type="text"
                  placeholder="Ej: El Retiro"
                  value={nuevoCampoNombre}
                  onChange={(e) => handleCampoInputChange(e.target.value)}
                  style={styles.inputModalGigante}
                />
                {errorCampoInput && (
                  <div style={styles.alertaErrorInputInline}>
                    ⚠️ {errorCampoInput}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={confirmarCrearCampo}
                disabled={!nuevoCampoNombre.trim() || Boolean(errorCampoInput)}
                style={styles.btnModalConfirmar(
                  !nuevoCampoNombre.trim() || Boolean(errorCampoInput),
                )}
              >
                Guardar Nuevo Campo
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div style={styles.toastAlertGigante}>
          <div style={{ fontSize: "3.2rem", fontWeight: "900" }}>
            ¡TRABAJO GUARDADO CON ÉXITO!
          </div>
          <div style={{ fontSize: "1.8rem", color: "#a7f3d0" }}>
            Volviendo al menú principal...
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
    marginBottom: "20px",
    borderBottom: "3px solid #f1f5f9",
    paddingBottom: "15px",
  },
  tituloForm: {
    margin: 0,
    fontSize: "2.8rem",
    color: "#0f172a",
    fontWeight: "900",
  },
  btnVolverPaso1: {
    padding: "16px 24px",
    backgroundColor: "#e2e8f0",
    color: "#334155",
    border: "3px solid #cbd5e1",
    borderRadius: "16px",
    fontSize: "1.6rem",
    fontWeight: "900",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  alertaErrorBox: {
    backgroundColor: "#fef2f2",
    border: "3px solid #fecaca",
    color: "#991b1b",
    padding: "16px 20px",
    borderRadius: "16px",
    fontSize: "1.6rem",
    fontWeight: "900",
    marginBottom: "20px",
    textAlign: "center",
  },
  alertaErrorInputInline: {
    backgroundColor: "#fff1f2",
    border: "2px solid #f43f5e",
    color: "#be123c",
    padding: "12px 16px",
    borderRadius: "12px",
    fontSize: "1.4rem",
    fontWeight: "900",
    marginTop: "8px",
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
  labelModal: {
    fontSize: "1.8rem",
    fontWeight: "900",
    color: "#0f172a",
    textTransform: "uppercase",
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
    maxWidth: "100%",
    boxSizing: "border-box",
    outline: "none",
  },
  inputFechaCompacta: {
    padding: "22px 20px",
    borderRadius: "18px",
    border: "3px solid #64748b",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontSize: "24px",
    fontWeight: "900",
    width: "100%",
    maxWidth: "320px",
    boxSizing: "border-box",
    outline: "none",
  },
  selectWithButtonRow: {
    display: "flex",
    gap: "14px",
    alignItems: "center",
    width: "100%",
    boxSizing: "border-box",
  },
  select: {
    flex: 1,
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
  btnAccionExternaModal: {
    padding: "28px 24px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "18px",
    fontSize: "1.6rem",
    fontWeight: "900",
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 6px 20px rgba(37, 99, 235, 0.3)",
  },
  ayudaCargaBox: {
    backgroundColor: "#ecfdf5",
    border: "2px dashed #059669",
    padding: "16px 20px",
    borderRadius: "16px",
    fontSize: "1.5rem",
    color: "#065f46",
    lineHeight: "1.5",
  },
  lotesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "14px",
    margin: "10px 0",
    width: "100%",
    boxSizing: "border-box",
  },
  loteChip: (seleccionado) => ({
    padding: "20px 14px",
    borderRadius: "16px",
    border: `3px solid ${seleccionado ? "#2563eb" : "#cbd5e1"}`,
    backgroundColor: seleccionado ? "#eff6ff" : "#ffffff",
    color: seleccionado ? "#1d4ed8" : "#334155",
    fontWeight: "900",
    fontSize: "1.4rem",
    textAlign: "center",
    cursor: "pointer",
    boxShadow: seleccionado ? "0 4px 12px rgba(37,99,235,0.25)" : "none",
    boxSizing: "border-box",
  }),
  nuevoLoteRow: {
    display: "flex",
    gap: "12px",
    marginTop: "14px",
    width: "100%",
    boxSizing: "border-box",
  },
  inputLoteLibre: {
    flex: 1,
    padding: "26px 22px",
    borderRadius: "16px",
    border: "3px solid #64748b",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontSize: "22px",
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
  btnEliminarLoteSesion: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    border: "2px solid #fecaca",
    padding: "8px 14px",
    borderRadius: "10px",
    fontSize: "1.2rem",
    fontWeight: "900",
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
    alignItems: "center",
    zIndex: 9999,
    boxSizing: "border-box",
    padding: "20px",
  },
  modalCardGigante: {
    backgroundColor: "#ffffff",
    padding: "50px",
    borderRadius: "32px",
    width: "100%",
    maxWidth: "800px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
    borderTop: "10px solid #2563eb",
    display: "flex",
    flexDirection: "column",
    gap: "35px",
    boxSizing: "border-box",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "3px solid #f1f5f9",
    paddingBottom: "20px",
  },
  modalTitulo: {
    fontSize: "2.6rem",
    fontWeight: "900",
    color: "#0f172a",
  },
  inputModalGigante: {
    padding: "28px 24px",
    borderRadius: "18px",
    border: "3px solid #2563eb",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontSize: "26px",
    fontWeight: "900",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  },
  btnModalConfirmar: (isDisabled) => ({
    padding: "28px",
    backgroundColor: isDisabled ? "#cbd5e1" : "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "18px",
    fontSize: "2rem",
    fontWeight: "900",
    cursor: isDisabled ? "not-allowed" : "pointer",
    boxShadow: isDisabled ? "none" : "0 10px 30px rgba(37, 99, 235, 0.4)",
    marginTop: "15px",
  }),
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
    position: "absolute",
    bottom: 0,
    left: 0,
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
    width: "60px",
    height: "60px",
    fontSize: "2.2rem",
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
  toastAlertGigante: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "25px",
    zIndex: 99999,
    padding: "30px",
    boxSizing: "border-box",
    textAlign: "center",
  },
};
