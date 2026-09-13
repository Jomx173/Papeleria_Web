// src/utils/parseNaturalLanguage.js
// Lógica de parsing de lenguaje natural movida al frontend para evitar llamadas a endpoint inexistente

export const parseNaturalLanguage = (text) => {
  const lower = text.toLowerCase().trim();
  
  const result = {
    producto: null,
    cantidad: null,
    precio: null,
    categoria: null,
    tipo: "entrada",
    originalText: text
  };
  
  // Detectar si es salida (venta) o entrada
  const salidaVerbs = /(?:vendí|vendi|vendió|vendio|salida|salieron|se vendi|vendí|vendí)/;
  const entradaVerbs = /(?:tengo|agrega|agregar|agregue|agreguen|entran|llegaron|llego|compre|compro|compré|trae|traigan|ingresan|ingrese|ingresen)/;
  
  if (salidaVerbs.test(lower)) {
    result.tipo = "salida";
  } else if (entradaVerbs.test(lower)) {
    result.tipo = "entrada";
  }
  
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
  // Mejorado: detener en indicadores de precio (a, por, precio) o al final
  const accionMatch = lower.match(/(?:tengo|agrega|agregar|agregue|agreguen|entran|llegaron|llego|compre|compro|compré|trae|traigan|ingresan|ingrese|ingresen|vendí|vendi|vendió|vendio|salida|salieron|se vendi)\s+(?:\d+\s+)?([a-záéíóúñ\s]+?)(?:\s+(?:a|por|precio)\s*(?:l\.?|lps?\.?|lempiras?)?\s*\d+(?:\.\d{1,2})?)?(?:\s+(?:cada|unidad|lempiras?|unidades?|pesos?|dólares?|usd|us\$))?$/);
  if (accionMatch && accionMatch[1]) {
    result.producto = cleanProductName(accionMatch[1].trim());
  } else {
    // Fallback: tomar texto después de la cantidad
    if (result.cantidad) {
      const afterCantidad = lower.split(result.cantidad.toString())[1] || "";
      // Limpiar: quitar precio al final, "cada uno", "lempiras", etc.
      let clean = afterCantidad
        .replace(/^\s+/, "")
        .replace(/\s+(?:a|por|precio)\s*(?:l\.?|lps?\.?|lempiras?)?\s*\d+(?:\.\d{1,2})?(?:\s+(?:cada|unidad|lempiras?|unidades?|pesos?|dólares?|usd|us\$))?$/, "")
        .replace(/^\s+|\s+$/g, "");
      if (clean && clean.length > 2) {
        result.producto = cleanProductName(clean);
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
      .replace(/\s+(?:a|por|precio)\s*(?:l\.?|lps?\.?|lempiras?)?\s*\d+(?:\.\d{1,2})?(?:\s+(?:cada|unidad|lempiras?|unidades?|pesos?|dólares?|usd|us\$))?$/, "")
      .replace(/^\d+\s+/, "")
      .trim();
    if (cleaned.length > 2) {
      result.producto = cleanProductName(cleaned);
    }
  }
  
  return result;
};

// Función auxiliar para limpiar el nombre del producto
function cleanProductName(name) {
  return name
    // Quitar palabras finales comunes que no son parte del nombre
    .replace(/\s+(?:cada\s+uno|unidad|unidades|lempiras?|pesos?|dólares?|usd|us\$|piezas?|unidades?)$/i, "")
    // Quitar artículos finales
    .replace(/\s+(?:el|la|los|las|un|una|unos|unas)$/i, "")
    // Normalizar espacios
    .replace(/\s+/g, " ")
    .trim();
}

// Exportar también la función de limpieza para uso en búsqueda
export const cleanProductNameForSearch = (name) => {
  const cleaned = cleanProductName(name);
  // Generar variantes singular/plural para búsqueda más flexible
  const variants = new Set([cleaned.toLowerCase()]);
  
  // Singular -> plural
  if (cleaned.endsWith('o')) variants.add(cleaned.toLowerCase() + 's');
  if (cleaned.endsWith('a')) variants.add(cleaned.toLowerCase() + 's');
  if (cleaned.endsWith('e')) variants.add(cleaned.toLowerCase() + 's');
  if (cleaned.endsWith('i')) variants.add(cleaned.toLowerCase() + 's');
  if (cleaned.endsWith('u')) variants.add(cleaned.toLowerCase() + 's');
  if (cleaned.endsWith('z')) variants.add(cleaned.toLowerCase().slice(0, -1) + 'ces');
  
  // Plural -> singular
  if (cleaned.endsWith('es')) variants.add(cleaned.toLowerCase().slice(0, -2));
  if (cleaned.endsWith('s')) variants.add(cleaned.toLowerCase().slice(0, -1));
  
  return Array.from(variants);
};

// Normalizar texto para comparación: minúsculas, sin acentos, sin puntuación, espacios normalizados
export const normalizeText = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^\w\s]/g, '') // quitar puntuación
    .replace(/\s+/g, ' ') // normalizar espacios
    .trim();
};

// Calcular similitud Jaro-Winkler entre dos strings
export const jaroWinklerSimilarity = (s1, s2) => {
  const s1Norm = normalizeText(s1);
  const s2Norm = normalizeText(s2);
  
  if (s1Norm === s2Norm) return 1;
  if (!s1Norm || !s2Norm) return 0;
  
  // Jaro distance
  const len1 = s1Norm.length;
  const len2 = s2Norm.length;
  
  if (len1 === 0 || len2 === 0) return 0;
  
  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);
  
  let matches = 0;
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1Norm[i] !== s2Norm[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }
  
  if (matches === 0) return 0;
  
  let k = 0;
  let transpositions = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1Norm[i] !== s2Norm[k]) transpositions++;
    k++;
  }
  
  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  
  // Winkler modification
  let prefix = 0;
  const minLen = Math.min(len1, len2, 4);
  for (let i = 0; i < minLen; i++) {
    if (s1Norm[i] === s2Norm[i]) prefix++;
    else break;
  }
  
  return jaro + 0.1 * prefix * (1 - jaro);
};

// Calcular similitud de palabras (comparar conjunto de palabras)
export const wordSetSimilarity = (s1, s2) => {
  const words1 = new Set(normalizeText(s1).split(' ').filter(w => w.length > 1));
  const words2 = new Set(normalizeText(s2).split(' ').filter(w => w.length > 1));
  
  if (words1.size === 0 && words2.size === 0) return 1;
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }
  
  const union = words1.size + words2.size - intersection;
  return intersection / union; // Jaccard similarity
};

// Combinar similitudes para mejor resultado
export const combinedSimilarity = (s1, s2) => {
  const jaro = jaroWinklerSimilarity(s1, s2);
  const jaccard = wordSetSimilarity(s1, s2);
  // Peso: 70% Jaro-Winkler, 30% Jaccard de palabras
  return jaro * 0.7 + jaccard * 0.3;
};