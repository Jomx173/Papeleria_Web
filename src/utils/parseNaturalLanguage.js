// src/utils/parseNaturalLanguage.js
// Lógica de parsing de lenguaje natural movida al frontend para evitar llamadas a endpoint inexistente

export const parseNaturalLanguage = (text) => {
  let lower = text.toLowerCase().trim();
  
  const result = {
    producto: null,
    cantidad: null,
    precio: null,
    categoria: null,
    tipo: "entrada",
    originalText: text
  };
  
  // === 1. Detectar tipo: salida tiene prioridad sobre entrada ===
  const salidaVerbs = /(?:vendí|vendi|vendió|vendio|salida|salieron|se vendi|saca|retirar|retira|quita|quita|restar|resta)/;
  const entradaVerbs = /(?:tengo|agrega|agregar|agregue|agreguen|entran|llegaron|llego|compre|compro|compré|trae|traigan|ingresan|ingrese|ingresen|registrar|registra|registralo)/;
  
  // Normalizar verbos variantes: sacar/saca, retirar/retira, etc.
  // Usar replace con ^ y \b para eliminar verbos completos al inicio
  const verboAcción = lower.match(/^(sacar|saca|retirar|retira|quita|quita|registrar|registra|agrega|agregar|agregue|agreguen|tengo|compre|compro|compré|trae|traigan|ingresan|ingrese|ingresen|vendí|vendi|vendió|vendio)\s/i);
  
  if (verboAcción) {
    // Eliminar el verbo y el espacio posterior
    lower = lower.replace(/^(sacar|saca|retirar|retira|quita|quita|registrar|registra|agrega|agregar|agregue|agreguen|tengo|compre|compro|compré|trae|traigan|ingresan|ingrese|ingresen|vendí|vendi|vendió|vendio)\s/i, '');
    result.tipo = /^(sacar|saca|retirar|retira|quita|quita)/i.test(verboAcción[1]) ? "salida" : "entrada";
  } else if (salidaVerbs.test(lower)) {
    result.tipo = "salida";
  } else if (entradaVerbs.test(lower)) {
    result.tipo = "entrada";
  }
  
  // === 2. Extraer cantidad (puede aparecer en cualquier posición) ===
  // Usar match SIN 'g' para obtener capture groups (match[1], match[2], etc.)
  // El 'g' con match() solo devuelve el full match, no los groups
  
  let cantidad = null;
  
  // Patrón A: número seguido de unidades/piezas (puede incluir "cajas" como empaque)
  // Busca número seguido de: unidades, piezas, cajas, cuadernos, lapices, boligrafos, etc.
  const pA = lower.match(/\b(\d+)\s+(?:unidades?|piezas?|pzas?|items?|cuadernos?|lapices?|lápices?|lapiz|lápiz|boligrafos?|boligrafo|bolis?|cajas?|borradores?|resmas?|hojas?|plumas?)\b/);
  if (pA) {
    cantidad = parseInt(pA[1], 10);
  }
  
  // Patrón B: número al inicio seguido de espacio
  if (!cantidad) {
    const pB = lower.match(/^\s*(\d+)\s+/);
    if (pB) {
      cantidad = parseInt(pB[1], 10);
    }
  }
  
  // Patrón C: número después de verbo de acción
  if (!cantidad) {
    const pC = lower.match(/(?:tengo|agrega|agregar|agregue|agreguen|entran|llegaron|llego|compre|compro|compré|trae|traigan|ingresan|ingrese|ingresen|vendí|vendi|vendió|vendio|salida|salieron|se vendi|saca|retirar|retira|quita|quita|restar|renta)\s+(\d+)/);
    if (pC) {
      cantidad = parseInt(pC[1], 10);
    }
  }
  
  result.cantidad = cantidad;
  
  // === 3. Extraer precio (puede aparecer en cualquier posición) ===
  let precio = null;
  let precioEncontrado = false;
  
  // Patrón 1: "a [numero]" o "precio a [numero]" - sin g para capturar
  // Soporta: "a 15", "a L12", "precio a 15", "15 lempiras", etc.
  // El número puede ir seguido opcionalmente de "lempiras"
  // Patrón: "a [numero]" o "precio a [numero]" donde el número es opcional seguido de lempiras
  const pp1 = lower.match(/\s+(?:a|por|precio)\s+L?(\d+(?:\.\d{1,2})?)(?:\s+lempiras?)?/i);
  if (pp1 && !precioEncontrado) {
    const numVal = parseFloat(pp1[1]);
    if (result.cantidad && numVal === result.cantidad) {
      // skip
    } else {
      precio = numVal;
      precioEncontrado = true;
    }
  }
  
  // Patrón 2: "[numero] lempiras" o "[numero] lps"
  const pp2 = lower.match(/\b(\d+(?:\.\d{1,2})?)\s+lempiras?/i);
  if (pp2 && !precioEncontrado) {
    const numVal = parseFloat(pp2[1]);
    if (result.cantidad && numVal === result.cantidad) {
      // skip
    } else {
      precio = numVal;
      precioEncontrado = true;
    }
  }
  
  // Patrón 3: "L[número]" o "L [número]"
  const pp3 = lower.match(/\bL\s*(\d+(?:\.\d{1,2})?)/i);
  if (pp3 && !precioEncontrado) {
    const numVal = parseFloat(pp3[1]);
    if (result.cantidad && numVal === result.cantidad) {
      // skip
    } else {
      precio = numVal;
      precioEncontrado = true;
    }
  }
  
  // Patrón 4: "a L12" o "a L12 lempiras"
  if (!precioEncontrado) {
    const aLPattern = lower.match(/\s+(?:a|por|precio)\s+L?(\d+(?:\.\d{1,2})?)/i);
    if (aLPattern && !precioEncontrado) {
      const numVal = parseFloat(aLPattern[1]);
      if (result.cantidad && numVal === result.cantidad) {
        // skip
      } else {
        precio = numVal;
        precioEncontrado = true;
      }
    }
  }
  
  result.precio = precio;
  
  // === 4. Extraer nombre del producto ===
  // Quitar cantidad, precio, verbos de acción y indicadores de precio del texto
  // El producto puede aparecer ANTES o DESPUÉS de la cantidad
  
  let remainingText = lower;
  
  // Quitar cantidad: solo remover el número específico que encontramos, no patrones de unidades
  if (result.cantidad) {
    const cantidadStr = result.cantidad.toString();
    // SÓLO remover el número de cantidad específico usando replace con RegExp global
    // No removamos "unidades" u otras palabras - déjalas para el producto
    remainingText = remainingText.replace(new RegExp(`\\b${cantidadStr}\\b`, 'g'), '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  // Quitar precio y indicadores de precio
  if (result.precio) {
    const precioStr = result.precio.toString();
    // Patrones a remover: "a 15", "precio a 15", "15 lempiras", "L15", etc.
    // El patrón: "a [numero]" o "precio a [numero]" donde el número es opcional seguido de lempiras
    // También quita "lempiras" suelta
    remainingText = remainingText
      .replace(/\s*(?:a|por|precio)\s+L?\d+(?:\.\d{1,2})?(?:\s+lempiras?)?/gi, '')
      // También remover "lempiras" suelta que pueda quedar después de quitar el número
      .replace(/\s+lempiras?/gi, '')
      .replace(new RegExp(`\\b${precioStr}\\b`, 'g'), '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  // Quitar la palabra "precio" suelta que pueda quedar
  remainingText = remainingText.replace(/\bprecio\b/gi, '').trim();
  
  // Quitar verbos de acción que puedan quedar al inicio
  // Usar patrón con \b para palabra completa, no parcial
  remainingText = remainingText
    .replace(/^(?:tengo|agrega|agregar|agregue|agreguen|entran|llegaron|llego|compre|compro|compré|trae|traigan|ingresan|ingrese|ingresen|vendí|vendi|vendió|vendio|salida|salieron|se vendi|saca|retirar|retira|quita|quita|restar|renta)\s*/i, '')
    // Patrón de empaque: "cajas de", "pack de", "docenas de", etc.
    // Quitar "cajas de" cuando sea un indicador de empaque, no nombre de producto
    .replace(/\bcajas?\s+de\b/gi, '')
    // Solo remover "cada uno" / "unidad(es)" si está al final de la cadena completa
    // Evitar remover parcial que concatene con texto anterior
    .replace(/(?:cada\s+uno|unidad|unidades)\s*$/gi, '')
    .trim();
  
  // Quitar palabra "registralo" y otras basuras finales
  remainingText = remainingText.replace(/registralo/i, '').trim();
  remainingText = remainingText.replace(/\s+(?:a|por|precio)\s*$/i, '').trim();
  
  // === 5. Limpiar y validar nombre del producto ===
  let producto = null;
  
  // Si después de todo aún queda texto significativo, usarlo como producto
  if (remainingText && remainingText.length > 2) {
    // Quitar artículos iniciales sueltos (el, la, los, las, un, una)
    producto = remainingText.replace(/^(el|la|los|las|un|una|unos|unas)\s+/i, '').trim();
    
    // Si el producto tiene aún contenido, limpiarlo
    // Solo quitar "cada uno"/"unidad(es)" si están al FINAL de la cadena del producto
    if (producto && producto.length > 2) {
      // Verificar si el producto termina con estas palabras antes de quitarlas
      if (/\s+cada\s+uno\s*$/.test(producto) || /\s+unidad(es)?\s*$/.test(producto)) {
        producto = producto
          .replace(/\s+(?:cada\s+uno|unidad|unidades|lempiras?|pesos?|dólares?|usd|us\$|piezas?|unidades?)$/i, "")
          .replace(/\s+(?:el|la|los|las|un|una|unos|unas)$/i, "")
          .replace(/\s+/g, " ")
          .trim();
      }
    }
  }
  
  result.producto = producto || null;
  
  return result;
};

// Función auxiliar para limpiar el nombre del producto
function cleanProductName(name) {
  // Solo quitar palabras finales si realmente están al final
  // No hacer transformaciones heurísticas que modifiquen el nombre
  if (/\s+cada\s+uno\s*$/.test(name) || /\s+unidad(es)?\s*$/.test(name) || /\s+unidades?\s*$/.test(name)) {
    return name
      .replace(/\s+(?:cada\s+uno|unidad|unidades|lempiras?|pesos?|dólares?|usd|us\$|piezas?|unidades?)$/i, "")
      .replace(/\s+(?:el|la|los|las|un|una|unos|unas)$/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  // Si no termina con esas palabras, retornar tal como está (ya limpio de espacios)
  return name.replace(/\s+/g, " ").trim();
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