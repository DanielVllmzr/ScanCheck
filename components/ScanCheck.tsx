'use client';

import React, { useRef, useState } from 'react';
import NextImage from 'next/image'; // 👈 renombrado para no chocar con new Image()
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Upload,
  RefreshCw,
  RefreshCcw, // ↻ indicador pull-to-refresh
  Check,
  X,
  WheatOff,
  MilkOff,
  FileText,
} from 'lucide-react';
import { localAnalyze, type AnalyzeOutput } from '@/lib/analyze';
import { ocrImageDataUrl } from '@/lib/ocr';
import { usePullToRefresh } from '@/lib/usePullToRefresh';

function scoreColor(score: number) {
  if (score >= 8) return 'bg-success-500 text-white';
  if (score >= 5) return 'bg-brand-400 text-white';
  return 'bg-danger-500 text-white';
}

export default function ScanCheck() {
  // Pull-to-refresh (PWA iOS) con progreso
  const { progress, isPulling } = usePullToRefresh();

  const [busy, setBusy] = useState(false);
  const [progressOCR, setProgressOCR] = useState(0);
  const [result, setResult] = useState<AnalyzeOutput>(localAnalyze(''));
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [lastOcrText, setLastOcrText] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const handleTakePhoto = () => fileInputRef.current?.click();
  const handleUploadPhoto = () => uploadInputRef.current?.click();

  const onImagePicked = async (file: File) => {
    const dataUrl = await fileToDataURL(file);
    const resized = await resizeImageDataUrl(dataUrl, 1200);
    setPreviewDataUrl(resized);
    setLastOcrText('');
    setProgressOCR(0);

    setBusy(true);
    try {
      const text = await ocrImageDataUrl(resized, (p) => setProgressOCR(Math.round(p * 100)));
      setLastOcrText(text);
      setResult(localAnalyze(text));
    } catch (e) {
      alert('No se pudo leer el texto de la foto. Probá con mejor luz, acercate y enfocá SOLO el bloque de ingredientes.');
    } finally {
      setBusy(false);
    }
  };

  const resetPhoto = () => {
    setPreviewDataUrl(null);
    setLastOcrText('');
    setProgressOCR(0);
    setResult(localAnalyze(''));
  };

  const stickyLabel = previewDataUrl || lastOcrText ? 'Escanear otro' : 'Escanear nuevo producto';
  const stickyAction = () => (previewDataUrl ? resetPhoto() : handleTakePhoto());

  return (
    <div className="min-h-screen">
      {/* Indicador pull-to-refresh (flecha mostaza) */}
      <AnimatePresence>
        {(isPulling || progress > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.9 }}
            className="fixed top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="flex items-center gap-2 bg-brand-500 text-white rounded-full px-3 py-1.5 shadow-soft border border-brand-600/30">
              <motion.span
                style={{ display: 'inline-flex' }}
                animate={{ rotate: progress * 360 }}
                transition={{ type: 'tween', ease: 'linear', duration: 0 }}
              >
                <RefreshCcw className="w-4 h-4" />
              </motion.span>
              <span className="text-xs font-medium">
                {progress < 1 ? 'Deslizá para refrescar' : 'Soltá para recargar'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Logo sin fondo (NextImage) */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border border-border bg-transparent">
              <NextImage
                src="/logo-transparent.png"
                alt="Scan&Check"
                width={44}
                height={44}
                priority
              />
            </div>
            <div>
              <h1 className="h1">Scan&Check</h1>
              <p className="subtle">Gluten & Lactosa — Foto única (OCR local)</p>
            </div>
          </div>
        </header>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Entrada */}
          <section className="card p-4 md:p-6">
            <div className="mb-3">
              <h2 className="h2">Entrada</h2>
            </div>

            {/* Botones grandes centrados y parejos */}
            <div className="flex gap-3 mb-5">
  <button
    onClick={handleTakePhoto}
    className="btn btn-brand rounded-2xl w-1/2 justify-center py-4 text-base"
  >
    <Camera className="w-5 h-5" /> Tomar foto
  </button>
  <button
    onClick={handleUploadPhoto}
    className="btn btn-outline rounded-2xl w-1/2 justify-center py-4 text-base"
  >
    <Upload className="w-5 h-5" /> Subir foto
  </button>
</div>


            {/* Vista previa */}
            <div className={`overflow-hidden rounded-2xl border ${previewDataUrl ? 'border-success-300' : 'border-border'}`}>
              <div className="relative aspect-video bg-white flex items-center justify-center">
                {previewDataUrl ? (
                  <img src={previewDataUrl} alt="foto etiqueta" className="w-full h-full object-contain" />
                ) : (
                  <div className="p-8 text-center space-y-3">
                    <p className="text-muted">
                      Tomá o subí una foto del <span className="font-medium text-foreground">bloque de ingredientes / alérgenos</span>.
                    </p>
                    <div className="flex gap-2 items-center justify-center text-xs">
                      <span className="chip">
                        <WheatOff className="w-3 h-3" /> Detecta gluten
                      </span>
                      <span className="chip">
                        <MilkOff className="w-3 h-3" /> Detecta lactosa
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Progreso OCR */}
            {busy && <div className="mt-3 text-xs text-muted">Analizando foto (OCR)… {progressOCR}%</div>}

            {/* Ingredientes detectados (solo lectura con placeholder bonito) */}
            <div className="mt-5">
              <label className="text-sm font-semibold text-foreground mb-1 block">Ingredientes detectados (OCR)</label>
              <div className="relative">
                {lastOcrText ? (
                  <textarea
                    className="w-full h-40 bg-white border border-border rounded-2xl p-3 text-sm"
                    value={lastOcrText}
                    readOnly
                  />
                ) : (
                  <div className="w-full h-40 bg-white border border-border rounded-2xl p-3 text-sm text-muted flex items-center">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>El texto detectado aparecerá aquí luego de tomar la foto.</span>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted mt-1">Si el texto no coincide, tomá otra foto más cerca y con buena luz.</p>
            </div>
          </section>

          {/* Resultado del análisis */}
          <section className="card p-4 md:p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="h2">Resultado del análisis</h2>
              {/* Badge circular grande con color por score */}
              <div className={`shrink-0 rounded-full ${scoreColor(result.score)} w-14 h-14 grid place-items-center shadow-soft`}>
                <span className="text-base font-bold">{result.score}/10</span>
              </div>
            </div>

            {/* Chips gluten/lactosa */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="chip">
                {!result.hasGluten && !result.crossContam ? (
                  <Check className="w-3 h-3 text-success-500" />
                ) : (
                  <X className="w-3 h-3 text-danger-500" />
                )}
                {result.hasGluten ? 'Con gluten' : result.crossContam ? 'Riesgo de gluten' : 'Sin gluten'}
              </span>
              <span className="chip">
                {!result.hasLactose ? <Check className="w-3 h-3 text-success-500" /> : <X className="w-3 h-3 text-danger-500" />}
                {result.hasLactose ? 'Con lactosa' : 'Sin lactosa'}
              </span>
            </div>

            {/* Barra estilo degradado */}
            <div className="mb-5">
              <div className="flex items-center justify-between">
                <span className="subtle">Salud del producto</span>
              </div>
              <div className="w-full h-3 bg-white border border-border rounded-full mt-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(result.score / 10) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                  className="h-full bg-gradient-to-r from-success-500 via-brand-400 to-danger-500"
                />
              </div>
            </div>

            {/* Summary animado */}
            <AnimatePresence mode="popLayout">
              <motion.div
                key={result.summary}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="rounded-xl bg-brand-50 border border-border p-3 text-sm text-foreground mb-4"
              >
                {result.summary}
              </motion.div>
            </AnimatePresence>

            {/* Pros / Contras como chips dentro de cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-border rounded-2xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4 text-success-500" /> Pros
                </h3>
                {result.pros.length ? (
                  <div className="flex flex-wrap gap-2">
                    {result.pros.map((p, i) => (
                      <span key={i} className="chip">
                        {p}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted flex items-center gap-2">
                    <Check className="w-4 h-4 opacity-60" /> Sin pros destacados.
                  </div>
                )}
              </div>

              <div className="bg-white border border-border rounded-2xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <X className="w-4 h-4 text-danger-500" /> Contras
                </h3>
                {result.cons.length ? (
                  <div className="flex flex-wrap gap-2">
                    {result.cons.map((c, i) => (
                      <span key={i} className="chip">
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted flex items-center gap-2">
                    <X className="w-4 h-4 opacity-60" /> Sin contras destacadas.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Botón sticky inferior (dinámico) */}
      <div className="fixed inset-x-0 bottom-0 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pointer-events-none">
        <div className="max-w-6xl mx-auto">
          <div className="pointer-events-auto">
            <button onClick={stickyAction} className="btn btn-brand w-full rounded-2xl shadow-soft">
              <Camera className="w-5 h-5" />
              {stickyLabel}
            </button>
          </div>
        </div>
      </div>

      {/* inputs ocultos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
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
    </div>
  );
}

/* helpers */
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
    const img = new window.Image(); // 👈 usar el constructor del navegador
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = dataUrl;
  });
}
