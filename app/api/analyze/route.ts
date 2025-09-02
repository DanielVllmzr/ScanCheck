import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { localAnalyze } from '@/lib/analyze';

const system = `Sos un analista alimentario. Dado el texto de ingredientes o una foto de etiqueta,
extraé ingredientes, alérgenos (gluten, lácteos), y devolvé un JSON con:
{ hasGluten, glutenOrigin, hasLactose, crossContam, pros[], cons[], score (1-10), summary }.
Identificá contaminación cruzada si hay frases tipo "puede contener". El score es orientativo.`;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { imageBase64, text } = body || {};
  const apiKey = process.env.OPENAI_API_KEY;

  // If no API key or only text provided, run local heuristics
  if (!apiKey && text) {
    const out = localAnalyze(text as string);
    return NextResponse.json(out);
  }

  if (!apiKey && imageBase64) {
    // No API, cannot do vision. Return a neutral message.
    return NextResponse.json(localAnalyze(""));
  }

  try {
    const openai = new OpenAI({ apiKey });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: system }
    ];

    if (imageBase64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "Extrae el texto y analiza alérgenos como gluten y lactosa. Devolvé SOLO el JSON pedido." },
          { type: "input_image", image_url: `data:image/jpeg;base64,${imageBase64}` }
        ]
      } as any);
    } else if (text) {
      messages.push({
        role: "user",
        content: [{ type: "text", text: `Texto de etiqueta:
${text}

Devolvé SOLO el JSON pedido.` }]
      } as any);
    } else {
      return NextResponse.json(localAnalyze(""));
    }

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content = resp.choices[0]?.message?.content || "{}";
    // Validate/parse JSON
    let parsed: any;
    try { parsed = JSON.parse(content); } catch { parsed = localAnalyze(text || ""); }
    // Basic fill
    if (typeof parsed.score !== "number") parsed.score = 5;
    if (!Array.isArray(parsed.pros)) parsed.pros = [];
    if (!Array.isArray(parsed.cons)) parsed.cons = [];
    if (!parsed.summary || typeof parsed.summary !== "string") parsed.summary = "Análisis generado.";
    if (typeof parsed.hasGluten !== "boolean") parsed.hasGluten = false;
    if (typeof parsed.hasLactose !== "boolean") parsed.hasLactose = false;
    if (typeof parsed.crossContam !== "boolean") parsed.crossContam = false;
    if (!("glutenOrigin" in parsed)) parsed.glutenOrigin = null;

    return NextResponse.json(parsed);
  } catch (e: any) {
    // Fallback to heuristics on error
    const out = localAnalyze(text || "");
    return NextResponse.json(out);
  }
}
