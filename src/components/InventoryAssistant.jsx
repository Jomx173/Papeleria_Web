import { useState, useCallback, useRef, useEffect } from "react";
import { FaRobot, FaTimes, FaTrash } from "react-icons/fa";
import AssistantMessage from "./AssistantMessage";
import ConfirmationCard from "./ConfirmationCard";
import AssistantInput from "./AssistantInput";
import { creaoUpsertProduct, searchProducts, createMovement } from "../services/api";
import { parseNaturalLanguage, cleanProductNameForSearch } from "../utils/parseNaturalLanguage";
import { combinedSimilarity as similarity } from "../utils/parseNaturalLanguage";

// Clasificador de intención: prioridad CONVERSACION -> OPERACION -> CONSULTA
const clasificarIntencion = (text) => {
  const lower = text.toLowerCase().trim();
  
  // Patrones de conversación normal
  const patronesConversacion = [
    /^(hola)$/,
    /^(buenos d[ií]as)$/,
    /^(buenas tardes)$/,
    /^(buenas noches)$/,
    /^(gracias|muchas gracias|thx|thanks)$/,
    /^(de nada|no hay de qu[eé])$/,
    /^(c[oó]mo est[aá]s?|qu[eé] tal)$/,
    /^(qu[eé] puedes hacer|para qu[eé] sirves|para qu[eé] sirve)$/,
    /^(c[oó]mo funciona|qu[eé] haces|ay[uú]dame|help)$/,
    /^(c[oó]mo (puedo|se) (registrar|agregar|crear) (un )?producto)$/,
    /^(qu[eé] es esto|para qu[eé] es)$/,
    /^(adios|adiós|chao|hasta luego|nos vemos)$/,
    /^(bien|bien y t[uú]?|todo bien)$/,
  ];

  // Patrones claros de operación de inventario (entrada/salida)
  const patronesInventario = [
    /\b(tengo|agrega|agregar|agregue|agreguen|entran|llegaron|llego|compre|compro|compré|trae|traigan|ingresan|ingrese|ingresen)\b/,
    /\b(vend[íi]|vendio|salida|salieron|se vendi|se vendi[oó])\b/,
    /\b(agrega|agregar|agregue|agreguen|anota|anota)\b/,
    /\b(compr[ée]|compro|compra)\b/,
    /\b(vend[ií]|vendi|vendió|vendio|venta)\b/,
    /\b(salida|salieron|egres[oó]|egresaron)\b/,
  ];

  for (const patron of patronesConversacion) {
    if (patron.test(lower)) {
      return "CONVERSACION";
    }
  }

  // B) OPERACION: verbo de acción reconocido Y un número
  const verboOperacion = /\b(tengo|agrega|agregar|compr[ée]|vend[íi]?|entran|llegaron|salió|salieron|egresaron)\b/.test(lower);
  const tieneNumero = /\d+/.test(lower);

  if (verboOperacion && tieneNumero) {
    return "OPERACION";
  }

  // C) CONSULTA (DEFAULT): cualquier otro caso — buscar producto directamente
  return "CONSULTA";
};

function InventoryAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [lastPreview, setLastPreview] = useState(null);
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, preview, scrollToBottom]);

  const addMessage = (text, isUser = false, isError = false) => {
    setMessages((prev) => [...prev, { id: Date.now(), text, isUser, isError }]);
  };

  const clearChat = () => {
    setMessages([]);
    setPreview(null);
    setLastPreview(null);
  };

  const closeAssistant = () => {
    setIsOpen(false);
    setTimeout(() => {
      clearChat();
    }, 300);
  };

  const openAssistant = () => {
    setIsOpen(true);
    setMessages([
      { id: 1, text: "¡Hola! Soy tu asistente de inventario. Escribe en lenguaje natural lo que necesitas registrar.", isUser: false }
    ]);
  };

  const handleSend = async (text) => {
    if (isProcessing) return;
    
    addMessage(text, true);
    setIsProcessing(true);
    setPreview(null);

    try {
      // Clasificar intención antes de procesar
      const intencion = clasificarIntencion(text);
      
      // Si es conversación normal, responder naturalmente sin procesar inventario
      if (intencion === "CONVERSACION") {
        const respuestasConversacion = {
          "hola": "¡Hola! ¿En qué puedo ayudarte hoy?",
          "buenos días": "¡Buenos días! ¿En qué puedo ayudarte?",
          "buenas tardes": "¡Buenas tardes! ¿En qué te ayudo?",
          "buenas noches": "¡Buenas noches! ¿En qué te ayudo?",
          "gracias": "¡De nada! ¿Hay algo más en lo que te pueda ayudar?",
          "de nada": "¡Con gusto! ¿Algo más?",
          "cómo estás": "¡Muy bien, gracias por preguntar! ¿Y tú qué tal?",
          "qué tal": "¡Todo bien! ¿En qué te ayudo?",
          "qué puedes hacer": "Puedo ayudarte a registrar entradas de productos, salidas/ventas, buscar productos y actualizar el inventario. Solo dime en lenguaje natural qué necesitas, por ejemplo: 'Tengo 30 cuadernos a 45 lempiras' o 'Vendí 5 lápices'.",
          "qué haces": "Soy tu asistente de inventario. Puedo registrar entradas, salidas, buscar productos y actualizar stock. ¡Solo dime qué necesitas!",
          "cómo funciona": "Escribe en lenguaje natural lo que quieres registrar. Ejemplo: 'Tengo 30 cuadernos a 45 lempiras' o 'Vendí 5 lápices'. Yo entiendo, busco el producto y te pido confirmación antes de guardar.",
          "cómo funciona el asistente": "Escribe en lenguaje natural lo que quieres registrar. Yo interpreto, busco el producto y te pido confirmación antes de guardar.",
          "ayúdame": "¡Claro! Puedes decirme cosas como 'Tengo 10 cuadernos a 20 lempiras' para registrar entrada, o 'Vendí 5 bolígrafos' para registrar salida. ¿En qué te ayudo?",
          "help": "I can help you register inventory entries and exits. Just tell me in natural language what you want to record.",
          "ayuda": "Puedo registrar entradas, salidas, buscar productos y actualizar stock. Ejemplos: 'Tengo 10 cuadernos a 20', 'Vendí 5 lápices', 'Busca bolígrafos'.",
        };
        
        const lower = text.toLowerCase().trim();
        const respuesta = respuestasConversacion[lower] || "¡Hola! ¿En qué puedo ayudarte? Puedes registrar entradas, salidas o buscar productos. Ejemplo: 'Tengo 10 cuadernos a 20 lempiras'.";
        addMessage(respuesta, false);
        setIsProcessing(false);
        return;
      }
      
      // Si es CONSULTA: buscar productos y mostrar información SIN modificar inventario
      if (intencion === "CONSULTA") {
        // Parsear el texto localmente
        const parsed = parseNaturalLanguage(text);
        
        if (!parsed.producto || parsed.producto.length < 2) {
          addMessage("No pude identificar qué producto buscas. Intenta ser más específico.\nEjemplo: 'cuaderno norma' o 'buscar lápices'.", false);
          setIsProcessing(false);
          return;
        }
        
        // Buscar productos que coincidan - probar variantes singular/plural
        const searchVariants = cleanProductNameForSearch(parsed.producto);
        let products = [];
        for (const variant of searchVariants) {
          const found = await searchProducts(variant, 10);
          if (found.length > 0) {
            products = found;
            break;
          }
        }
        // Si no se encontró nada, intentar búsqueda general con el término original
        if (products.length === 0) {
          products = await searchProducts(parsed.producto, 10);
        }
        
        const serialize = (p) => {
          const estado = p.cantidad === 0 ? "agotado" : p.cantidad <= p.stock_minimo ? "stock_bajo" : "en_stock";
          return {
            id: p.id,
            nombre: p.nombre,
            codigo: p.codigo,
            cantidad: p.cantidad,
            stock_minimo: p.stock_minimo,
            estado,
            stockBajo: estado !== "en_stock",
            precio: Number(p.precio),
            categoria_id: p.categoria_id,
            categoria: p.categoria ?? null
          };
        };
        
        const resultados = products.map(serialize);
        
        if (resultados.length === 0) {
          addMessage(`No encontré ningún producto similar a "${parsed.producto}". ¿Quieres que lo cree?`, false);
          setIsProcessing(false);
          return;
        }
        
        // Buscar el mejor producto coincidente usando similitud
        const MIN_SIMILARITY = 0.65;
        const HIGH_SIMILARITY = 0.85;
        
        let sugerido = null;
        
        if (resultados.length > 0) {
          const productosConSimilitud = resultados.map(p => ({
            producto: p,
            similitud: similarity(parsed.producto, p.nombre)
          }));
          
          productosConSimilitud.sort((a, b) => b.similitud - a.similitud);
          
          const mejor = productosConSimilitud[0];
          
          if (mejor.similitud >= HIGH_SIMILARITY) {
            sugerido = mejor.producto;
          } else if (mejor.similitud >= MIN_SIMILARITY) {
            const candidatosSimilares = productosConSimilitud.filter(p => p.similitud >= MIN_SIMILARITY);
            if (candidatosSimilares.length > 1) {
              sugerido = mejor.producto;
            } else {
              sugerido = mejor.producto;
            }
          } else {
            sugerido = null;
          }
        }
        
        if (sugerido) {
          let mensaje = `📦 <strong>${sugerido.nombre}</strong>\n`;
          mensaje += `📦 Stock actual: <strong>${sugerido.cantidad}</strong> unidades\n`;
          mensaje += `💰 Precio: <strong>L.${Number(sugerido.precio).toFixed(2)}</strong>\n`;
          if (sugerido.categoria) {
            mensaje += `📂 Categoría: <strong>${sugerido.categoria}</strong>\n`;
          }
          if (sugerido.codigo) {
            mensaje += `🏷️ Código: <strong>${sugerido.codigo}</strong>\n`;
          }
          mensaje += `\n<i>¿Quieres registrar una entrada o salida para este producto?</i>`;
          
          const preview = {
            accion: "consulta",
            texto_original: text,
            interpretacion: {
              producto_buscar: parsed.producto,
              cantidad: 0,
              precio: parsed.precio,
              categoria_inferida: null,
              tipo: "consulta"
            },
            productos_encontrados: resultados,
            sugerido: sugerido ? {
              ...sugerido,
              existencia_actual: sugerido.cantidad,
              nueva_existencia: sugerido.cantidad,
              precio_actual: sugerido.precio,
              precio_nuevo: sugerido.precio
            } : null,
            requiere_confirmacion: false,
            multiples_candidatos: false,
            mensaje: mensaje,
          };
          
          setLastPreview(preview);
          setPreview(preview);
          
          addMessage(
            `📦 <strong>${sugerido.nombre}</strong> (stock actual: ${sugerido.cantidad}). ${preview.mensaje.replace(/<[^>]*>/g, '')}`,
            false
          );
          setIsProcessing(false);
          return;
        } else {
          // No se encontró producto
          addMessage(`No encontré ningún producto similar a "${parsed.producto}". ¿Quieres que lo cree?`, false);
          setIsProcessing(false);
          return;
        }
      }
      
      // Si es OPERACION: procesar operación de inventario (entrada/salida)
      if (intencion === "OPERACION") {
        // Parsear el texto localmente (sin llamada a API)
        const parsed = parseNaturalLanguage(text);
        
        if (!parsed.producto || parsed.producto.length < 2) {
          addMessage("No pude identificar el producto en tu mensaje. Intenta ser más específico.", false);
          setIsProcessing(false);
          return;
        }
        
        if (!parsed.cantidad || parsed.cantidad <= 0) {
          addMessage("No pude identificar la cantidad. Indica cuántas unidades.", false);
          setIsProcessing(false);
          return;
        }
        
        // Buscar productos que coincidan - probar variantes singular/plural
        const searchVariants = cleanProductNameForSearch(parsed.producto);
        let products = [];
        for (const variant of searchVariants) {
          const found = await searchProducts(variant, 10);
          if (found.length > 0) {
            products = found;
            break;
          }
        }
        // Si no se encontró nada, intentar búsqueda general con el término original
        if (products.length === 0) {
          products = await searchProducts(parsed.producto, 10);
        }
        
        const serialize = (p) => {
          const estado = p.cantidad === 0 ? "agotado" : p.cantidad <= p.stock_minimo ? "stock_bajo" : "en_stock";
          return {
            id: p.id,
            nombre: p.nombre,
            codigo: p.codigo,
            cantidad: p.cantidad,
            stock_minimo: p.stock_minimo,
            estado,
            stockBajo: estado !== "en_stock",
            precio: Number(p.precio),
            categoria_id: p.categoria_id,
            categoria: p.categoria ?? null
          };
        };
        
        const resultados = products.map(serialize);
        
        // Buscar el mejor producto coincidente usando similitud
        const MIN_SIMILARITY = 0.65; // Umbral de similitud para considerar coincidencia
        const HIGH_SIMILARITY = 0.85; // Umbral para coincidencia muy segura
        
        let sugerido = null;
        let multiplesCandidatos = false;
        
        if (resultados.length > 0) {
          // Calcular similitud para cada producto
          const productosConSimilitud = resultados.map(p => ({
            producto: p,
            similitud: similarity(parsed.producto, p.nombre)
          }));
          
          // Ordenar por similitud descendente
          productosConSimilitud.sort((a, b) => b.similitud - a.similitud);
          
          const mejor = productosConSimilitud[0];
          
          if (mejor.similitud >= HIGH_SIMILARITY) {
            // Coincidencia muy segura - usar directamente
            sugerido = mejor.producto;
          } else if (mejor.similitud >= MIN_SIMILARITY) {
            // Coincidencia moderada - verificar si hay múltiples candidatos similares
            const candidatosSimilares = productosConSimilitud.filter(p => p.similitud >= MIN_SIMILARITY);
            if (candidatosSimilares.length > 1) {
              multiplesCandidatos = true;
              // Usar el mejor para preview, pero avisar al usuario
              sugerido = mejor.producto;
            } else {
              sugerido = mejor.producto;
            }
          } else {
            // Similitud baja - no hay coincidencia segura
            sugerido = null;
          }
        }
        
        // Determinar acción basada en el tipo detectado (entrada/salida)
        const esSalida = parsed.tipo === "salida";
        const accion = sugerido ? (esSalida ? "salida" : "entrada") : "crear";
        
        let preview = {
          accion,
          texto_original: parsed.originalText,
          interpretacion: {
            producto_buscar: parsed.producto,
            cantidad: parsed.cantidad,
            precio: parsed.precio,
            categoria_inferida: null,
            tipo: parsed.tipo
          },
          productos_encontrados: resultados,
          sugerido: sugerido ? {
            ...sugerido,
            existencia_actual: sugerido.cantidad,
            nueva_existencia: esSalida 
              ? Math.max(0, sugerido.cantidad - parsed.cantidad)
              : sugerido.cantidad + parsed.cantidad,
            precio_actual: sugerido.precio,
            precio_nuevo: parsed.precio
          } : null,
          requiere_confirmacion: true,
          multiples_candidatos: multiplesCandidatos,
          mensaje: sugerido
            ? multiplesCandidatos
              ? `Encontré "${sugerido.nombre}" (stock: ${sugerido.cantidad}) como la opción más similar. Hay otros productos similares. ${esSalida ? `Se restarían ${parsed.cantidad} unidades → nuevo stock: ${Math.max(0, sugerido.cantidad - parsed.cantidad)}.` : `Se sumarían ${parsed.cantidad} unidades → nuevo stock: ${sugerido.cantidad + parsed.cantidad}.`} ¿Es este el correcto?`
              : esSalida
                ? `Encontré "${sugerido.nombre}" (stock: ${sugerido.cantidad}). Se restarían ${parsed.cantidad} unidades → nuevo stock: ${Math.max(0, sugerido.cantidad - parsed.cantidad)}.`
                : `Encontré "${sugerido.nombre}" (stock: ${sugerido.cantidad}). Se sumarían ${parsed.cantidad} unidades → nuevo stock: ${sugerido.cantidad + parsed.cantidad}.`
            : `No existe "${parsed.producto}". Se crearía como producto nuevo con ${parsed.cantidad} unidades.`
        };
        
        // Si hay precio indicado y difiere del actual
        if (sugerido && parsed.precio && Number(sugerido.precio) !== parsed.precio) {
          preview.advertencia_precio = `El producto "${sugerido.nombre}" actualmente tiene precio L.${Number(sugerido.precio).toFixed(2)} y estás indicando L.${parsed.precio.toFixed(2)}. ¿Quieres actualizar también el precio?`;
          preview.requiere_confirmacion_precio = true;
        }
        
        // Si no hay categoría y hay sugerido, usar su categoría
        if (sugerido && sugerido.categoria_id) {
          preview.interpretacion.categoria_inferida = sugerido.categoria_id;
        }
        
        setLastPreview(preview);
        setPreview(preview);
        
        if (sugerido) {
          addMessage(
            `Encontré <strong>${sugerido.nombre}</strong> (stock actual: ${sugerido.cantidad}). ${preview.mensaje}`,
            false
          );
        } else if (resultados.length > 0) {
          addMessage(
            `Encontré ${resultados.length} producto(s) relacionado(s). Selecciona el correcto o confirma para crear uno nuevo.`,
            false
          );
        } else {
          addMessage(preview.mensaje, false);
        }
        setIsProcessing(false);
        return;
      }
      
      // Si es CONSULTA: buscar productos y mostrar información SIN modificar inventario
      if (intencion === "CONSULTA") {
        // Parsear el texto localmente
        const parsed = parseNaturalLanguage(text);
        
        if (!parsed.producto || parsed.producto.length < 2) {
          addMessage("No pude identificar qué producto buscas. Intenta ser más específico.\nEjemplo: 'cuaderno norma' o 'buscar lápices'.", false);
          setIsProcessing(false);
          return;
        }
        
        // Buscar productos que coincidan - probar variantes singular/plural
        const searchVariants = cleanProductNameForSearch(parsed.producto);
        let products = [];
        for (const variant of searchVariants) {
          const found = await searchProducts(variant, 10);
          if (found.length > 0) {
            products = found;
            break;
          }
        }
        // Si no se encontró nada, intentar búsqueda general con el término original
        if (products.length === 0) {
          products = await searchProducts(parsed.producto, 10);
        }
        
        const serialize = (p) => {
          const estado = p.cantidad === 0 ? "agotado" : p.cantidad <= p.stock_minimo ? "stock_bajo" : "en_stock";
          return {
            id: p.id,
            nombre: p.nombre,
            codigo: p.codigo,
            cantidad: p.cantidad,
            stock_minimo: p.stock_minimo,
            estado,
            stockBajo: estado !== "en_stock",
            precio: Number(p.precio),
            categoria_id: p.categoria_id,
            categoria: p.categoria ?? null
          };
        };
        
        const resultados = products.map(serialize);
        
        if (resultados.length === 0) {
          addMessage(`No encontré ningún producto similar a "${parsed.producto}". ¿Quieres que lo cree?`, false);
          setIsProcessing(false);
          return;
        }
        
        // Buscar el mejor producto coincidente usando similitud
        const MIN_SIMILARITY = 0.65;
        const HIGH_SIMILARITY = 0.85;
        
        let sugerido = null;
        
        if (resultados.length > 0) {
          const productosConSimilitud = resultados.map(p => ({
            producto: p,
            similitud: similarity(parsed.producto, p.nombre)
          }));
          
          productosConSimilitud.sort((a, b) => b.similitud - a.similitud);
          
          const mejor = productosConSimilitud[0];
          
          if (mejor.similitud >= HIGH_SIMILARITY) {
            sugerido = mejor.producto;
          } else if (mejor.similitud >= MIN_SIMILARITY) {
            const candidatosSimilares = productosConSimilitud.filter(p => p.similitud >= MIN_SIMILARITY);
            if (candidatosSimilares.length > 1) {
              // multiplesCandidatos = true; // Not used in CONSULTA mode
              sugerido = mejor.producto;
            } else {
              sugerido = mejor.producto;
            }
          } else {
            sugerido = null;
          }
        }
        
        if (sugerido) {
          // const stockActual = sugerido.cantidad; // No longer used directly
          // const nuevaExistencia = sugerido.cantidad; // Solo consulta, no cambia stock
          
          let mensaje = `📦 <strong>${sugerido.nombre}</strong>\n`;
          mensaje += `📦 Stock actual: <strong>${sugerido.cantidad}</strong> unidades\n`;
          mensaje += `💰 Precio: <strong>L.${Number(sugerido.precio).toFixed(2)}</strong>\n`;
          if (sugerido.categoria) {
            mensaje += `📂 Categoría: <strong>${sugerido.categoria}</strong>\n`;
          }
          if (sugerido.codigo) {
            mensaje += `🏷️ Código: <strong>${sugerido.codigo}</strong>\n`;
          }
          mensaje += `\n<i>¿Quieres registrar una entrada o salida para este producto?</i>`;
          
          const preview = {
            accion: "consulta",
            texto_original: text,
            interpretacion: {
              producto_buscar: parsed.producto,
              cantidad: 0,
              precio: parsed.precio,
              categoria_inferida: null,
              tipo: "consulta"
            },
            productos_encontrados: resultados,
            sugerido: sugerido ? {
              ...sugerido,
              existencia_actual: sugerido.cantidad,
              nueva_existencia: sugerido.cantidad,
              precio_actual: sugerido.precio,
              precio_nuevo: sugerido.precio
            } : null,
            requiere_confirmacion: false,
            multiples_candidatos: false,
            mensaje: mensaje,
            // accion: "consulta"  // Duplicado - ya definido arriba
          };
          
          setLastPreview(preview);
          setPreview(preview);
          
          addMessage(
            `📦 <strong>${sugerido.nombre}</strong> (stock actual: ${sugerido.cantidad}). ${preview.mensaje.replace(/<[^>]*>/g, '')}`,
            false
          );
          setIsProcessing(false);
          return;
        } else {
          // No se encontró producto
          addMessage(`No encontré ningún producto similar a "${parsed.producto}". ¿Quieres que lo cree?`, false);
          setIsProcessing(false);
          return;
        }
      }
      
      // Parsear el texto localmente (sin llamada a API)
      const parsed = parseNaturalLanguage(text);
      
      if (!parsed.producto || parsed.producto.length < 2) {
        throw new Error("No pude identificar el producto en tu mensaje. Intenta ser más específico.\nEjemplo: 'Tengo 30 cuadernos Norma a 45 lempiras cada uno'");
      }
      
      if (!parsed.cantidad || parsed.cantidad <= 0) {
        throw new Error("No pude identificar la cantidad. Indica cuántas unidades.\nEjemplo: 'Tengo 30 cuadernos...'");
      }
      
      // Buscar productos que coincidan - probar variantes singular/plural
      const searchVariants = cleanProductNameForSearch(parsed.producto);
      let products = [];
      for (const variant of searchVariants) {
        const found = await searchProducts(variant, 10);
        if (found.length > 0) {
          products = found;
          break;
        }
      }
      // Si no se encontró nada, intentar búsqueda general con el término original
      if (products.length === 0) {
        products = await searchProducts(parsed.producto, 10);
      }
      
      const serialize = (p) => {
        const estado = p.cantidad === 0 ? "agotado" : p.cantidad <= p.stock_minimo ? "stock_bajo" : "en_stock";
        return {
          id: p.id,
          nombre: p.nombre,
          codigo: p.codigo,
          cantidad: p.cantidad,
          stock_minimo: p.stock_minimo,
          estado,
          stockBajo: estado !== "en_stock",
          precio: Number(p.precio),
          categoria_id: p.categoria_id,
          categoria: p.categoria ?? null
        };
      };
      
      const resultados = products.map(serialize);
      
      // Buscar el mejor producto coincidente usando similitud
      const MIN_SIMILARITY = 0.65; // Umbral de similitud para considerar coincidencia
      const HIGH_SIMILARITY = 0.85; // Umbral para coincidencia muy segura
      
      let sugerido = null;
      let multiplesCandidatos = false;
      
      if (resultados.length > 0) {
        // Calcular similitud para cada producto
        const productosConSimilitud = resultados.map(p => ({
          producto: p,
          similitud: similarity(parsed.producto, p.nombre)
        }));
        
        // Ordenar por similitud descendente
        productosConSimilitud.sort((a, b) => b.similitud - a.similitud);
        
        const mejor = productosConSimilitud[0];
        
        if (mejor.similitud >= HIGH_SIMILARITY) {
          // Coincidencia muy segura - usar directamente
          sugerido = mejor.producto;
        } else if (mejor.similitud >= MIN_SIMILARITY) {
          // Coincidencia moderada - verificar si hay múltiples candidatos similares
          const candidatosSimilares = productosConSimilitud.filter(p => p.similitud >= MIN_SIMILARITY);
          if (candidatosSimilares.length > 1) {
            multiplesCandidatos = true;
            // Usar el mejor para preview, pero avisar al usuario
            sugerido = mejor.producto;
          } else {
            sugerido = mejor.producto;
          }
        } else {
          // Similitud baja - no hay coincidencia segura
          sugerido = null;
        }
      }
      
      // Determinar acción basada en el tipo detectado (entrada/salida)
      const esSalida = parsed.tipo === "salida";
      const accion = sugerido ? (esSalida ? "salida" : "entrada") : "crear";
      
      let preview = {
        accion,
        texto_original: parsed.originalText,
        interpretacion: {
          producto_buscar: parsed.producto,
          cantidad: parsed.cantidad,
          precio: parsed.precio,
          categoria_inferida: null,
          tipo: parsed.tipo
        },
        productos_encontrados: resultados,
        sugerido: sugerido ? {
          ...sugerido,
          existencia_actual: sugerido.cantidad,
          nueva_existencia: esSalida 
            ? Math.max(0, sugerido.cantidad - parsed.cantidad)
            : sugerido.cantidad + parsed.cantidad,
          precio_actual: sugerido.precio,
          precio_nuevo: parsed.precio
        } : null,
        requiere_confirmacion: true,
        multiples_candidatos: multiplesCandidatos,
        mensaje: sugerido
          ? multiplesCandidatos
            ? `Encontré "${sugerido.nombre}" (stock: ${sugerido.cantidad}) como la opción más similar. Hay otros productos similares. ${esSalida ? `Se restarían ${parsed.cantidad} unidades → nuevo stock: ${Math.max(0, sugerido.cantidad - parsed.cantidad)}.` : `Se sumarían ${parsed.cantidad} unidades → nuevo stock: ${sugerido.cantidad + parsed.cantidad}.`} ¿Es este el correcto?`
            : esSalida
              ? `Encontré "${sugerido.nombre}" (stock: ${sugerido.cantidad}). Se restarían ${parsed.cantidad} unidades → nuevo stock: ${Math.max(0, sugerido.cantidad - parsed.cantidad)}.`
              : `Encontré "${sugerido.nombre}" (stock: ${sugerido.cantidad}). Se sumarían ${parsed.cantidad} unidades → nuevo stock: ${sugerido.cantidad + parsed.cantidad}.`
          : `No existe "${parsed.producto}". Se crearía como producto nuevo con ${parsed.cantidad} unidades.`
      };
      
      // Si hay precio indicado y difiere del actual
      if (sugerido && parsed.precio && Number(sugerido.precio) !== parsed.precio) {
        preview.advertencia_precio = `El producto "${sugerido.nombre}" actualmente tiene precio L.${Number(sugerido.precio).toFixed(2)} y estás indicando L.${parsed.precio.toFixed(2)}. ¿Quieres actualizar también el precio?`;
        preview.requiere_confirmacion_precio = true;
      }
      
      // Si no hay categoría y hay sugerido, usar su categoría
      if (sugerido && sugerido.categoria_id) {
        preview.interpretacion.categoria_inferida = sugerido.categoria_id;
      }
      
      setLastPreview(preview);
      setPreview(preview);
      
      if (sugerido) {
        addMessage(
          `Encontré <strong>${sugerido.nombre}</strong> (stock actual: ${sugerido.cantidad}). ${preview.mensaje}`,
          false
        );
      } else if (resultados.length > 0) {
        addMessage(
          `Encontré ${resultados.length} producto(s) relacionado(s). Selecciona el correcto o confirma para crear uno nuevo.`,
          false
        );
      } else {
        addMessage(preview.mensaje, false);
      }
    } catch (err) {
      addMessage(`Error al interpretar: ${err.message}`, false, true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async (options = {}) => {
    if (!lastPreview || isConfirming) return;
    
    setIsConfirming(true);
    setPreview(null);

    try {
      const interpretacion = lastPreview.interpretacion;
      const esSalida = interpretacion.tipo === "salida";
      
      let response;
      
      if (esSalida) {
        // Para salidas, usar el endpoint de movements
        const payload = {
          producto_id: lastPreview.sugerido?.id,
          tipo: "salida",
          cantidad: interpretacion.cantidad,
          motivo: `Venta registrada por asistente: ${interpretacion.texto_original}`
        };
        response = await createMovement(payload);
      } else {
        // Para entradas y creación, usar el endpoint creao
        const payload = {
          nombre: lastPreview.sugerido?.nombre || interpretacion.producto_buscar,
          cantidad: interpretacion.cantidad,
          precio: interpretacion.precio || lastPreview.sugerido?.precio,
          categoria_id: lastPreview.sugerido?.categoria_id || interpretacion.categoria_inferida,
          confirmado: true,
          actualizar_precio: options.actualizar_precio === true,
        };
        response = await creaoUpsertProduct(payload);
      }
      
      if (response.ok) {
        addMessage(
          `✅ ${response.mensaje || "Operación completada"}`,
          false
        );
        
        // Disparar evento para actualizar inventario en otras partes de la app
        window.dispatchEvent(new CustomEvent("inventory-updated", { detail: response }));
      } else {
        addMessage(`❌ ${response.message || "No se pudo completar la operación"}`, false, true);
      }
    } catch (err) {
      addMessage(`❌ Error: ${err.message}`, false, true);
    } finally {
      setIsConfirming(false);
      setPreview(null);
      setLastPreview(null);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setLastPreview(null);
    addMessage("Operación cancelada.", false);
  };

  const toggleAssistant = () => {
    if (isOpen) {
      closeAssistant();
    } else {
      openAssistant();
    }
  };

  // Botón flotante
  const floatingButton = (
    <button
      className="fab-floating rounded-full border-border pulse"
      onClick={toggleAssistant}
      aria-label={isOpen ? "Cerrar asistente" : "Abrir asistente de inventario"}
      title={isOpen ? "Cerrar asistente" : "Asistente de inventario"}
    >
      <FaRobot className="fab-icon" />
      <span className="fab-label">Asistente</span>
      {isOpen && <FaTimes className="fab-close" />}
    </button>
  );

  // Panel del chat
  const chatPanel = isOpen && (
    <div className="assistant-panel bg-card border-border rounded-lg overflow-hidden" ref={chatRef}>
      <div className="assistant-header bg-header border-b border-border">
        <div className="header-content px-4 py-3">
          <FaRobot className="header-icon" />
          <div>
            <h3 className="header-title">Asistente de inventario</h3>
            <p className="header-subtitle">Escribe en lenguaje natural</p>
          </div>
        </div>
        <div className="header-actions px-4">
          <button className="header-btn sm:hidden" onClick={clearChat} title="Limpiar chat" aria-label="Limpiar conversación">
            <FaTrash />
          </button>
          <button className="header-btn hidden sm:inline-close close-btn" onClick={closeAssistant} aria-label="Cerrar">
            <FaTimes />
          </button>
        </div>
      </div>

      <div className="assistant-messages p-4 flex-1 overflow-y-auto">
        {messages.map((msg) => (
          <AssistantMessage
            key={msg.id}
            message={msg.text}
            isUser={msg.isUser}
            isError={msg.isError}
          />
        ))}
        {isProcessing && <AssistantMessage isLoading />}
        <div ref={messagesEndRef} />
      </div>

      {preview && (
        <ConfirmationCard
          preview={preview}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isConfirming={isConfirming}
        />
      )}

      <AssistantInput
        onSend={handleSend}
        disabled={isProcessing || isConfirming || !!preview}
        placeholder={preview ? "Escribe 'sí' para confirmar o escribe algo más..." : "Ej: Tengo 30 cuadernos a 45 lempiras"}
      />
    </div>
  );

  return (
    <>
      {floatingButton}
      {chatPanel}
    </>
  );
}

export default InventoryAssistant;