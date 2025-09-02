export type AnalyzeOutput = {
  hasGluten: boolean;
  glutenOrigin: string | null;
  hasLactose: boolean;
  crossContam: boolean;
  pros: string[];
  cons: string[];
  score: number;
  summary: string;
};

export function localAnalyze(raw: string): AnalyzeOutput {
  const text = (raw || "").toLowerCase();

  const glutenSources = [
    { key: "trigo", rx: /\btrigo\b|\bharina de trigo\b/ },
    { key: "cebada", rx: /\bcebada\b|\bmalta\b|\bmaltead/ },
    { key: "centeno", rx: /\bcenteno\b/ },
    { key: "avena", rx: /\bavena\b/ },
    { key: "soya+trigo", rx: /salsa de soya|soya.*trigo|trigo.*soya/ },
    { key: "levadura de cerveza", rx: /levadura de cerveza|brewer's yeast/ },
  ];

  const lactoseMarkers = [/\bleche\b/, /\bláctic|lactose|lactosa\b/, /\bqueso\b/, /\bmantequilla\b/, /\bcasein|caseinato\b/, /\bsuero\b|\bwhey\b/];
  const crossContamRx = /puede contener|trazas|procesad[oa] en instalaciones|may contain|processed in a facility/i;

  const addedSugarRx = /az[uú]car|jarabe|corn syrup|fructosa/;
  const highSodiumRx = /sodio|\bsal\b/;
  const artificialRx = /colorantes|artificial|conservador|saborizante artificial/;
  const seedOilsRx = /aceite de (soya|girasol|ma[ií]z|canola)/;
  const proteinRx = /\bprote[ií]na?\b|protein/;
  const fiberRx = /fibra|integral/;

  const glutenHits: string[] = [];
  glutenSources.forEach((g) => { if (g.rx.test(text)) glutenHits.push(g.key); });

  const hasLactose = lactoseMarkers.some((r) => r.test(text));
  const crossContam = crossContamRx.test(text);

  let hasGluten = false;
  let glutenOrigin: string | null = null;
  if (glutenHits.length > 0) {
    hasGluten = true;
    if (glutenHits.includes("trigo")) glutenOrigin = "trigo";
    else if (glutenHits.includes("cebada")) glutenOrigin = "cebada/malta";
    else if (glutenHits.includes("centeno")) glutenOrigin = "centeno";
    else if (glutenHits.includes("soya+trigo")) glutenOrigin = "trigo (salsa de soya)";
    else if (glutenHits.includes("avena")) glutenOrigin = "avena (verificar si es certificada GF)";
    else if (glutenHits.includes("levadura de cerveza")) glutenOrigin = "levadura de cerveza";
  }

  const pros: string[] = [];
  const cons: string[] = [];

  if (/sin gluten|gluten free|libre de gluten/.test(text)) pros.push("Declarado sin gluten");
  if (/sin lactosa|lactose free/.test(text)) pros.push("Declarado sin lactosa");
  if (fiberRx.test(text)) pros.push("Fuente de fibra/integral");
  if (proteinRx.test(text)) pros.push("Aporte de proteína");

  if (addedSugarRx.test(text)) cons.push("Azúcares añadidos");
  if (highSodiumRx.test(text)) cons.push("Puede ser alto en sodio");
  if (artificialRx.test(text)) cons.push("Aditivos/artificiales");
  if (seedOilsRx.test(text)) cons.push("Aceites vegetales refinados");
  if (hasGluten) cons.push("Contiene gluten");
  if (hasLactose) cons.push("Contiene lactosa/derivados");
  if (crossContam && !hasGluten) cons.push("Riesgo de contaminación cruzada");

  let score = 10;
  if (addedSugarRx.test(text)) score -= 2;
  if (seedOilsRx.test(text)) score -= 1;
  if (highSodiumRx.test(text)) score -= 1;
  if (artificialRx.test(text)) score -= 1;
  if (hasGluten) score -= 3;
  if (crossContam && !hasGluten) score -= 1;
  if (hasLactose) score -= 1;
  score = Math.max(1, Math.min(10, score));

  let summary = "Analizando ingredientes...";
  if (text.trim().length === 0) summary = "Escaneá un producto o pegá el texto de la etiqueta";
  else {
    if (hasGluten) summary = `Este producto CONTIENE gluten (origen: ${glutenOrigin || "no especificado"}).`;
    else if (crossContam) summary = "No se detectó gluten en ingredientes, pero hay riesgo de contaminación cruzada.";
    else summary = "No se detectó gluten en la lista de ingredientes.";
    if (hasLactose) summary += " También presenta lactosa o derivados lácteos.";
  }

  return { hasGluten, glutenOrigin, hasLactose, crossContam, pros, cons, score, summary };
}
