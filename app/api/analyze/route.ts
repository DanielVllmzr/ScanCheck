import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { localAnalyze } from '../../../lib/analyze';

// 🔧 Fuerza Node.js (el SDK de OpenAI no corre en Edge)
export const runtime = 'nodejs';
// 🔧 Evita caché en esta ruta
export const dynamic = 'force-dynamic';

const system = `Sos un analista alimentario. Dado el texto de ingredientes o una foto de etiqueta,
extraé ingredientes, alérgenos (gluten, lácteos), y devolvé un JSON con:
{ hasGluten, glutenOrigin, hasLactose, crossContam, pros[], cons[], score (1–10), summary }.
Identificá contaminación cruzada si hay frases tipo "puede contener". El score es orientativo.`;

export async function POST(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch {}
  const { imageBase64, text } = body || {};
  const apiKey = process.env.OPENAI_API_KEY;

  // Sin API key: heurística local (demo)
  if (!apiKey && text) return NextResponse.json(localAnalyze(text as string));
  if (!apiKey && imageBase64) return NextResponse.json(localAnalyze(""));

  try {
    const openai = new OpenAI({ apiKey: apiKey! });

    const messages: any[] = [{ role: 'system', content: system }];

    if (imageBase64) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: 'Extrae el texto y analiza alérgenos como gluten y lactosa. Devolvé SOLO el JSON pedido.' },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
          }
        ]
      } as any);
    } else if (text) {
      messages.push({
        role: 'user',
        content: [{ type: 'text', text: `Texto de etiqueta:\n${text}\n\nDevolvé SOLO el JSON pedido.` }]
      } as any);
    } else {
      return NextResponse.json(localAnalyze(''));
    }

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.2
    });

    const content = resp.choices[0]?.message?.content || '{}';
    let parsed: any;
    try { parsed = JSON.parse(content); }
    catch { parsed = localAnalyze(text || ''); }

    // Normalización mínima
    if (typeof parsed.score !== 'number') parsed.score = 5;
    if (!Array.isArray(parsed.pros)) parsed.pros = [];
    if (!Array.isArray(parsed.cons)) parsed.cons = [];
    if (!parsed.summary || typeof parsed.summary !== 'string') parsed.summary = 'Análisis generado.';
    if (typeof parsed.hasGluten !== 'boolean') parsed.hasGluten = false;
    if (typeof parsed.hasLactose !== 'boolean') parsed.hasLactose = false;
    if (typeof parsed.crossContam !== 'boolean') parsed.crossContam = false;
    if (!('glutenOrigin' in parsed)) parsed.glutenOrigin = null;

    return NextResponse.json(parsed);
  } catch (e: any) {
    // Devuelvo info de error para que el front pueda mostrar algo útil
    return NextResponse.json({ error: String(e), ...localAnalyze(text || '') });
  }
}
