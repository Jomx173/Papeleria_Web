// src/utils/parseNaturalLanguage.js
// Lógica de parsing de lenguaje natural movida al frontend para evitar llamadas a endpoint inexistente

export const parseNaturalLanguage = (text) => {
  const lower = text.toLowerCase().trim();
  
  const result = {
    producto: null,
    cantidad: null,
    precio: null,
    categoria: null,
    originalText: text
  };
  
  // Extraer cantidad: números enteros seguidos de unidades o solo números al inicio
  const cantidadMatch = lower.match(/\b(\d+)\s*(?:unidades?|piezas?|pzas?|items?|cuadernos?|lapices?|lapiz|boligrafos?|boligrafo|bolis?|borradores?|marcadores?|cuadernos?|libretas?|resmas?|hojas?|plumas?|bolis?)\b/);
  if (!cantidadMatch) {
    // Buscar solo número seguido de espacio o al inicio
    const simpleCantidad = lower.match(/^\s*(\d+)\s+/);
    if (simpleCantidad) {
      result.cantidad = parseInt(simpleCantidad[1], 10);
    }
  } else {
    result.cantidad = parseInt(cantidadMatch[1], 10);
  }
  
  // Extraer precio: "a 45", "a 45 lempiras", "a L45", "a L.45", "a 45.00", "precio 45"
  const precioMatch = lower.match(/(?:a|por|precio)\s*(?:l\.?|lps?\.?|lempiras?)?\s*(\d+(?:\.\d{1,2})?)/);
  if (precioMatch) {
    result.precio = parseFloat(precioMatch[1]);
  }
  
  // Extraer nombre del producto: buscar después de verbos de acción
  const accionMatch = lower.match(/(?:tengo|agrega|agregar|agregue|agreguen|entran|llegaron|llego|compre|compro|compré|trae|traigan|ingresan|ingrese|ingresen|vendí|vendi|vendió|vendio|salida|salieron|se vendi)\s+(?:\d+\s+)?([a-záéíóúñ\s]+?)(?:\s+(?:a|por|precio)\s*(?:l\.?|lps?\.?|lempiras?)?\s*\d+)?$/);
  if (accionMatch && accionMatch[1]) {
    result.producto = accionMatch[1].trim();
  } else {
    // Fallback: tomar texto después de la cantidad
    if (result.cantidad) {
      const afterCantidad = lower.split(result.cantidad.toString())[1] || "";
      const clean = afterCantidad.replace(/^(?:\s+(?:a|por|precio)\s*(?:l\.?|lps?\.?|lempiras?)?\s*\d+(?:\.\d{1,2})?)?$/, "").trim();
      if (clean && clean.length > 2) {
        result.producto = clean;
      }
    }
  }
  
  // Si no se encontró producto, intentar extraer sustantivos comunes de papelería
  if (!result.producto) {
    const sustantivos = [
      "cuaderno", "cuadernos", "libreta", "libretas", 
      "lapiz", "lapices", "lapicero", "lapiceros", 
      "boligrafo", "boligrafos", "boli", "bolis", 
      "pluma", "plumas", "borrador", "borradores", 
      "marcador", "marcadores", "resma", "resmas", 
      "hoja", "hojas", "papel", "caja", "cajas", 
      "paquete", "paquetes", "bloc", "blocs", 
      "archivador", "archivadores", "carpeta", "carpetas", 
      "separador", "separadores", "etiqueta", "etiquetas", 
      "cinta", "cintas", "pegamento", "pegamentos", 
      "corrector", "correctores", "regla", "reglas", 
      "tijera", "tijeras", "sacapuntas", "calculadora", "calculadoras", 
      "grapadora", "grapadoras", "perforadora", "perforadoras", 
      "clip", "clips", "chincheta", "chinchetas", "tachuela", "tachuelas", 
      "alfiler", "alfileres", "corta", "cortauñas", "cutter", "cutters", 
      "estuche", "estuches", "mochila", "mochilas", "bolso", "bolsos", 
      "cartuchera", "cartucheras"
    ];
    
    for (const s of sustantivos) {
      if (lower.includes(s)) {
        result.producto = s;
        break;
      }
    }
  }
  
  // Si aún no hay producto, usar texto limpio
  if (!result.producto) {
    const cleaned = lower
      .replace(/^(?:tengo|agrega|agregar|agregue|agreguen|entran|llegaron|llego|compre|compro|compré|trae|traigan|ingresan|ingrese|ingresen|vendí|vendi|vendió|vendio|salida|salieron|se vendi)\s+/, "")
      .replace(/\s+(?:a|por|precio)\s*(?:l\.?|lps?\.?|lempiras?)?\s*\d+(?:\.\d{1,2})?$/, "")
      .replace(/^\d+\s+/, "")
      .trim();
    if (cleaned.length > 2) {
      result.producto = cleaned;
    }
  }
  
  return result;
};