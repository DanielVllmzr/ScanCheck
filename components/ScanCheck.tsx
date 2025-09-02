'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Sparkles, Info, ShieldAlert, CheckCircle2, XCircle, WheatOff, MilkOff } from 'lucide-react';
import { localAnalyze, AnalyzeOutput } from '@/lib/analyze';

const panel = "bg-stone-100 border border-stone-300 rounded-2xl shadow-sm";
const heading = "text-stone-800 font-semibold";
const chip = "px-2 py-0.5 rounded-full text-xs border";

const DEMO_PRODUCTS: Record<string, { label: string; text: string }> = {
  none: { label: "—", text: "" },
  granola: {
    label: "Granola con avena y miel",
    text: "INGREDIENTES: Avena integral, miel, almendras, aceite de girasol, pasas, sal marina, canela. Puede contener trazas de trigo, maní y leche. Sin colorantes artificiales."
  },
  galletas: {
    label: "Galletas de trigo y chocolate",
    text: "INGREDIENTES: Harina de trigo enriquecida (trigo), azúcar, aceite vegetal, cacao, leche en polvo, emulsionantes, sal, saborizante. Contiene GLUTEN y LECHE."
  },
  yogurt: {
    label: "Yogur natural bajo en grasa",
    text: "INGREDIENTES: Leche pasteurizada, cultivos lácticos activos, pectina. Sin gluten. Puede contener trazas de soya. 10g proteína por porción."
  },
  salsa: {
    label: "Salsa de soya (tradicional)",
    text: "INGREDIENTES: Agua, soya, trigo, sal. Contiene trigo (gluten)."
  },
  cerveza: {
    label: "Cerveza lager",
    text: "INGREDIENTES: Agua, cebada malteada, lúpulo, levadura. Contiene cebada (gluten)."
  },
};

function Pill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`${chip} ${ok ? "bg-green-50 border-green-300 text-green-700" : "bg-rose-50 border-rose-300 text-rose-700"}`}>
      {ok ? (
        <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {label}</span>
      ) : (
        <span className="inline-flex items-center gap-1"><XCircle className="w-3 h-3" /> {label}</span>
      )}
    </span>
  );
}

function Badge({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <span className={`${chip} border-stone-300 text-stone-600 bg-stone-100 inline-flex items-center gap-1`}>
      <Icon className="w-3 h-3" /> {text}
    </span>
  );
}

function useCamera(streamOn: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      if (!streamOn) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e) {
        console.warn("Camera error", e);
      }
    })();
    return () => { if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, [streamOn]);
  return { videoRef };
}

async function callAnalyzeAPI(payload: { imageBase64?: string; text?: string }): Promise<AnalyzeOutput | null> {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (e) {
    console.warn("API analyze failed, falling back to local heuristics.", e);
    if (payload.text) return localAnalyze(payload.text);
    return null;
  }
}

export default function ScanCheck() {
  const [demoKey, setDemoKey] = useState<keyof typeof DEMO_PRODUCTS>("granola");
  const [manualText, setManualText] = useState(DEMO_PRODUCTS["granola"].text);
  const [liveMode, setLiveMode] = useState(false);
  const { videoRef } = useCamera(liveMode);
  const [result, setResult] = useState<AnalyzeOutput>(localAnalyze(DEMO_PRODUCTS["granola"].text));
  const [busy, setBusy] = useState(false);
  const [useVision, setUseVision] = useState(true); // toggle to send frames to /api/analyze

  // Take frame and send to API (Vision)
  useEffect(() => {
    if (!liveMode || !useVision) return;
    let id: any;
    const capture = async () => {
      try {
        const v = videoRef.current;
        if (!v) return;
        const cvs = document.createElement("canvas");
        const w = v.videoWidth;
        const h = v.videoHeight;
        if (!w || !h) return;
        cvs.width = Math.min(640, w);
        cvs.height = Math.floor((cvs.width / w) * h);
        const ctx = cvs.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(v, 0, 0, cvs.width, cvs.height);
        const dataUrl = cvs.toDataURL("image/jpeg", 0.8);
        const base64 = dataUrl.split(",")[1];
        setBusy(true);
        const analyzed = await callAnalyzeAPI({ imageBase64: base64 });
        if (analyzed) setResult(analyzed);
      } finally {
        setBusy(false);
      }
    };
    // poll every 2.5s to avoid hammering the API
    id = setInterval(capture, 2500);
    return () => clearInterval(id);
  }, [liveMode, useVision]);

  // Manual analysis (demo)
  useEffect(() => {
    if (liveMode) return;
    setResult(localAnalyze(manualText));
  }, [manualText, liveMode]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-200 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Scan&Check</h1>
              <p className="text-sm text-stone-500">Gluten & Lactosa — Demo listo para iPhone</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-500 flex items-center gap-1">
              <input type="checkbox" checked={useVision} onChange={e => setUseVision(e.target.checked)} />
              Usar Vision API
            </label>
            <button onClick={() => setLiveMode(v => !v)}
              className={`px-3 py-2 rounded-xl border ${liveMode ? "bg-green-600 text-white border-green-700" : "bg-stone-100 text-stone-700 border-stone-300"}`}>
              <span className="inline-flex items-center gap-2">
                <Camera className="w-4 h-4" /> {liveMode ? "Cámara activa" : "Activar cámara"}
              </span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className={`${panel} p-4 md:p-6`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`${heading}`}>Entrada</h2>
              <div className="flex items-center gap-2 text-xs">
                <Badge icon={Info} text={liveMode ? "OCR (Vision) desde cámara" : "Texto de etiqueta (demo)"} />
              </div>
            </div>

            <div className={`overflow-hidden rounded-2xl border ${liveMode ? "border-green-600" : "border-stone-300"}`}>
              <div className="relative aspect-video bg-stone-200 flex items-center justify-center">
                {liveMode ? (
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                ) : (
                  <div className="p-6 text-center space-y-3">
                    <p className="text-stone-600">Cámara desactivada — usá el modo demo para probar.</p>
                    <div className="flex gap-2 items-center justify-center text-xs">
                      <Badge icon={WheatOff} text="Detecta gluten" />
                      <Badge icon={MilkOff} text="Detecta lactosa" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!liveMode && (
              <div className="mt-4 grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm">Elegí un producto de ejemplo</label>
                  <select className="w-full border border-stone-300 bg-stone-100 rounded-xl px-3 py-2"
                    value={demoKey}
                    onChange={(e) => {
                      const k = e.target.value as keyof typeof DEMO_PRODUCTS;
                      const t = DEMO_PRODUCTS[k].text;
                      setDemoKey(k);
                      setManualText(t);
                    }}>
                    {Object.entries(DEMO_PRODUCTS).map(([key, v]) => (
                      <option key={key} value={key}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Texto de etiqueta / ingredientes</label>
                  <textarea className="w-full h-40 border border-stone-300 bg-white rounded-xl p-3 text-sm"
                    placeholder="Pegá acá la lista de ingredientes o info de la etiqueta..."
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)} />
                </div>
              </div>
            )}

            {liveMode && (
              <div className="mt-3 text-xs text-stone-500">
                {busy ? "Analizando..." : "En espera de nuevo cuadro..."}
              </div>
            )}
          </section>

          <section className={`${panel} p-4 md:p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`${heading}`}>Resultado del análisis</h2>
              <div className="flex gap-2">
                <Pill ok={!result.hasGluten && !result.crossContam} label={result.hasGluten ? "Con gluten" : result.crossContam ? "Riesgo de gluten" : "Sin gluten"} />
                <Pill ok={!result.hasLactose} label={result.hasLactose ? "Con lactosa" : "Sin lactosa"} />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-end justify-between">
                <span className="text-sm text-stone-500">Salud del producto</span>
                <span className="text-lg font-semibold text-stone-800">{result.score}/10</span>
              </div>
              <div className="w-full h-3 bg-stone-200 rounded-full mt-2 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(result.score / 10) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 18 }} className="h-full bg-green-600" />
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              <motion.div key={result.summary} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="rounded-xl bg-amber-100 border border-amber-300 p-3 text-sm text-amber-900 mb-4">
                {result.summary}
              </motion.div>
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white border border-stone-200 p-4">
                <h3 className="font-medium text-stone-800 mb-2 inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Pros</h3>
                {result.pros.length ? (
                  <ul className="list-disc pl-5 space-y-1 text-sm text-stone-700">
                    {result.pros.map((p, i) => (<li key={i}>{p}</li>))}
                  </ul>
                ) : (<p className="text-sm text-stone-500">Sin pros destacados.</p>)}
              </div>
              <div className="rounded-2xl bg-white border border-stone-200 p-4">
                <h3 className="font-medium text-stone-800 mb-2 inline-flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Contras</h3>
                {result.cons.length ? (
                  <ul className="list-disc pl-5 space-y-1 text-sm text-stone-700">
                    {result.cons.map((c, i) => (<li key={i}>{c}</li>))}
                  </ul>
                ) : (<p className="text-sm text-stone-500">Sin contras destacadas.</p>)}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-stone-100 border border-stone-300 p-4">
                <h4 className="font-medium text-stone-800 mb-1">Gluten</h4>
                {result.hasGluten ? (
                  <p className="text-sm text-stone-700">Detectado. Origen probable: <span className="font-medium">{result.glutenOrigin || "no especificado"}</span>.</p>
                ) : result.crossContam ? (
                  <p className="text-sm text-stone-700">Sin gluten en ingredientes, pero <span className="font-medium">riesgo de contaminación cruzada</span>.</p>
                ) : (
                  <p className="text-sm text-stone-700">No se detectó gluten.</p>
                )}
              </div>
              <div className="rounded-2xl bg-stone-100 border border-stone-300 p-4">
                <h4 className="font-medium text-stone-800 mb-1">Lactosa</h4>
                {result.hasLactose ? (
                  <p className="text-sm text-stone-700">Detectada lactosa o derivados lácteos.</p>
                ) : (<p className="text-sm text-stone-700">No se detectó lactosa.</p>)}
              </div>
            </div>

          </section>
        </div>

        <footer className="mt-8 text-xs text-stone-500">
          <p>Para producción: configurá <code>OPENAI_API_KEY</code> y serví por HTTPS para que iOS habilite la cámara.</p>
        </footer>
      </div>
    </div>
  );
}
