// lib/analyze.ts
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

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "");
}

export function localAnalyze(raw: string): AnalyzeOutput {
  const text = norm(raw);

  // ---------- Detectores ----------
  // Gluten (ES/EN)
  const glutenMap = [
    { key: "trigo/wheat", rx: /\btrigo\b|\bwheat\b|\bharina de trigo\b|\bwheat flour\b/ },
    { key: "cebada/barley", rx: /\bcebada\b|\bbarley\b|\bmalta\b|\bmalt(ed)?\b/ },
    { key: "centeno/rye", rx: /\bcenteno\b|\brye\b/ },
    { key: "avena/oats", rx: /\bavena\b|\boats\b/ },
    { key: "salsa de soya/soy sauce", rx: /salsa de soya|soy sauce|soja.*trigo|soy.*wheat|wheat.*soy/ },
    { key: "levadura de cerveza/brewer's yeast", rx: /levadura de cerveza|brewer'?s yeast/ },
  ];

  // Lactosa / lácteos (ES/EN)
  const lactose = [
    /\bleche\b|\bmilk\b/,
    /\blactosa\b|\blactose\b/,
    /\bqueso\b|\bcheese\b/,
    /\bmantequilla\b|\bbutter\b/,
    /\bcrema\b|\bcream\b/,
    /casein(a|ato)?|caseinate|casein\b/,
    /\bsuero\b|\bwhey\b/
  ];

  // Contaminación cruzada (ES/EN)
  const cross = /puede contener|trazas|procesad[oa] en instalaciones|may contain|may contain traces|processed in a facility/i;

  // Azúcares añadidos (ES/EN + typos comunes)
  const sugar = /\b(azucar|sugar|sucrose|glucose|dextrose|fructose|jarabe|syrup|sirup|corns?\s*syrup|high[- ]fructose\s*corn\s*syrup|hfcs)\b/;

  // Sodio/sal (heurística leve)
  const sodium = /\b(sodio|salt|sodium)\b/;

  // Aditivos artificiales (ES/EN)
  const artificial = /\b(colorantes?|color(ing)?|artificial(es)?|preservatives?|conservador(?:es)?)\b/;

  // Aceites refinados (ES/EN)
  const seedOils = /\b(aceite de (soya|girasol|maiz|canola)|soy oil|sunflower oil|corn oil|canola oil)\b/;

  // Fibra / integral / proteína (pros)
  const protein = /\b(proteina|proteina|protein)\b/;
  const fiber = /\b(fibra|integral|whole\s*grain|fiber)\b/;
  const gfClaim = /sin gluten|gluten\s*free|libre de gluten/;
  const lfClaim = /sin lactosa|lactose\s*free/;

  // ---------- Matching ----------
  const glutenHits: string[] = [];
  for (const g of glutenMap) if (g.rx.test(text)) glutenHits.push(g.key);

  const hasLactose = lactose.some((r) => r.test(text));
  const crossContam = cross.test(text);

  let hasGluten = false;
  let glutenOrigin: string | null = null;
  if (glutenHits.length > 0) {
    hasGluten = true;
    const order = ["trigo/wheat","cebada/barley","centeno/rye","avena/oats","salsa de soya/soy sauce","levadura de cerveza/brewer's yeast"];
    glutenOrigin = order.find(k => glutenHits.includes(k)) || glutenHits[0];
  }

  const pros: string[] = [];
  const cons: string[] = [];

  if (gfClaim.test(text)) pros.push("Declarado sin gluten");
  if (lfClaim.test(text)) pros.push("Declarado sin lactosa");
  if (fiber.test(text)) pros.push("Fuente de fibra/integral");
  if (protein.test(text)) pros.push("Aporte de proteína");

  if (sugar.test(text)) cons.push("Azúcares añadidos");
  if (sodium.test(text)) cons.push("Puede ser alto en sodio");
  if (artificial.test(text)) cons.push("Aditivos / artificiales");
  if (seedOils.test(text)) cons.push("Aceites vegetales refinados");
  if (hasGluten) cons.push("Contiene gluten");
  if (hasLactose) cons.push("Contiene lactosa/derivados");
  if (crossContam && !hasGluten) cons.push("Riesgo de contaminación cruzada");

  // ---------- Score ----------
  let score = 10;
  if (sugar.test(text)) score -= 2;
  if (seedOils.test(text)) score -= 1;
  if (sodium.test(text)) score -= 1;
  if (artificial.test(text)) score -= 1;
  if (hasGluten) score -= 3;
  if (crossContam && !hasGluten) score -= 1;
  if (hasLactose) score -= 1;
  score = Math.max(1, Math.min(10, score));

  // ---------- Summary ----------
  let summary = "Analizando ingredientes...";
  if (text.trim().length === 0) {
    summary = "Escaneá un producto o pegá el texto de la etiqueta";
  } else {
    if (hasGluten) summary = `Este producto CONTIENE gluten (origen: ${glutenOrigin || "no especificado"}).`;
    else if (crossContam) summary = "No se detectó gluten en ingredientes, pero hay riesgo de contaminación cruzada.";
    else summary = "No se detectó gluten en la lista de ingredientes.";
    if (hasLactose) summary += " También presenta lactosa o derivados lácteos.";
  }

  return { hasGluten, glutenOrigin, hasLactose, crossContam, pros, cons, score, summary };
}
