'use client';
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Sparkles, Info, ShieldAlert, CheckCircle2, XCircle, WheatOff, MilkOff, Upload, RefreshCw } from 'lucide-react';
import { localAnalyze, type AnalyzeOutput } from '@/lib/analyze';

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
  const [useVision, setUseVision] = useState(true); // ON = manda la foto a /api/analyze
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AnalyzeOutput>(localAnalyze(""));
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  // Demo manual
  const [demoKey, setDemoKey] = useState<keyof typeof DEMO_PRODUCTS>("granola");
  const [manualText, setManualText] = useState(DEMO_PRODUCTS["granola"].text);

  const handleSelectDemo = (k: keyof typeof DEMO_PRODUCTS) => {
    setDemoKey(k);
    setManualText(DEMO_PRODUCTS[k].text);
    const analyzed = localAnalyze(DEMO_PRODUCTS[k].text);
    setResult(analyzed);
    setPreviewDataUrl(null);
  };

  // Tomar foto (iPhone abre cámara nativa)
  const handleTakePhoto = () => {
    fileInputRef.current?.click();
  };

  // Subir foto desde galería/archivos
  const handleUploadPhoto = () => {
    uploadInputRef.current?.click();
  };

  const onImagePicked = async (file: File) => {
    // Previsualizar
    const dataUrl = await fileToDataURL(file);
    setPreviewDataUrl(dataUrl);

    // Recortar tamaño máximo a ~1200px de ancho para menor payload
    const resized = await resizeImageDataUrl(dataUrl, 1200);
    const base64 = resized.split(",")[1];

    if (useVision) {
      setBusy(true);
      const analyzed = await callAnalyzeAPI({ imageBase64: base64 });
      setBusy(false);
      if (analyzed) setResult(analyzed);
    } else {
      // Sin Vision: no hay OCR -> resultado neutro (o pedimos pegar texto)
      setResult(localAnalyze(""));
    }
  };

  const resetPhoto = () => {
    setPreviewDataUrl(null);
    setResult(localAnalyze(""));
  };

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
              <p className="text-sm text-stone-500">Gluten & Lactosa — Foto única (estable)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-stone-500 flex items-center gap-1">
              <input type="checkbox" checked={useVision} onChange={e => setUseVision(e.target.checked)} />
              Usar Vision API
            </label>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Izquierda: Foto + Demo */}
          <section className={`${panel} p-4 md:p-6`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`${heading}`}>Entrada</h2>
              <div className="flex items-center gap-2 text-xs">
                <Badge icon={Info} text="Subí o tomá una foto del bloque de ingredientes" />
              </div>
            </div>

            {/* Controles de foto */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={handleTakePhoto}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-stone-100 text-stone-800 border-stone-300"
              >
                <Camera className="w-4 h-4" /> Tomar foto
              </button>
              <button
                onClick={handleUploadPhoto}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-stone-100 text-stone-800 border-stone-300"
              >
                <Upload className="w-4 h-4" /> Subir foto
              </button>
              {previewDataUrl && (
                <button
                  onClick={resetPhoto}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white text-stone-700 border-stone-300"
                >
                  <RefreshCw className="w-4 h-4" /> Tomar otra
                </button>
              )}
            </div>

            {/* Inputs ocultos para iPhone */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"  // iPhone abre cámara trasera
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) await onImagePicked(f);
              }}
            />
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) await onImagePicked(f);
              }}
            />

            {/* Preview de foto */}
            <div className={`overflow-hidden rounded-2xl border ${previewDataUrl ? "border-green-600" : "border-stone-300"}`}>
              <div className="relative aspect-video bg-stone-200 flex items-center justify-center">
                {previewDataUrl ? (
                  // Mostramos la foto elegida
                  <img src={previewDataUrl} alt="foto etiqueta" className="w-full h-full object-contain" />
                ) : (
                  <div className="p-6 text-center space-y-3">
                    <p className="text-stone-600">
                      Tomá o subí una foto del <span className="font-medium">bloque de ingredientes / alergénos</span>.
                    </p>
                    <div className="flex gap-2 items-center justify-center text-xs">
                      <Badge icon={WheatOff} text="Detecta gluten" />
                      <Badge icon={MilkOff} text="Detecta lactosa" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modo demo por texto */}
            <div className="mt-4 grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-sm">Producto de ejemplo</label>
                <select
                  className="w-full border border-stone-300 bg-stone-100 rounded-xl px-3 py-2"
                  value={demoKey}
                  onChange={(e) => handleSelectDemo(e.target.value as keyof typeof DEMO_PRODUCTS)}
                >
                  {Object.entries(DEMO_PRODUCTS).map(([key, v]) => (
                    <option key={key} value={key}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm">Texto de etiqueta / ingredientes (demo)</label>
                <textarea
                  className="w-full h-40 border border-stone-300 bg-white rounded-xl p-3 text-sm"
                  placeholder="Pegá acá la lista de ingredientes…"
                  value={manualText}
                  onChange={(e) => {
                    setManualText(e.target.value);
                    setPreviewDataUrl(null);
                    setResult(localAnalyze(e.target.value));
                  }}
                />
              </div>
            </div>

            {busy && <div className="mt-3 text-xs text-stone-500">Analizando foto…</div>}
          </section>

          {/* Derecha: Resultados */}
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
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(result.score / 10) * 100}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                  className="h-full bg-green-600"
                />
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              <motion.div
                key={result.summary}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="rounded-xl bg-amber-100 border border-amber-300 p-3 text-sm text-amber-900 mb-4"
              >
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
          </section>
        </div>

        <footer className="mt-8 text-xs text-stone-500">
          <p>Tip: en iPhone el botón “Tomar foto” usa la cámara nativa (atributo <code>capture=\"environment\"</code>). Apuntá SOLO al bloque de ingredientes para mejor OCR.</p>
        </footer>
      </div>
    </div>
  );
}

/* -------- helpers -------- */

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resizeImageDataUrl(dataUrl: string, maxW: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = dataUrl;
  });
}
