// lib/ocr.ts
// OCR local (en el navegador) con Tesseract.js
export async function ocrImageDataUrl(
  dataUrl: string,
  onProgress?: (p: number) => void,
  lang = 'eng+spa'
): Promise<string> {
  // Import dinámico para que no cargue Tesseract hasta que haga falta
  const Tesseract = (await import('tesseract.js')).default;
  const { data } = await Tesseract.recognize(dataUrl, lang, {
    logger: (m: any) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.(m.progress);
      }
    }
  });
  return (data?.text || '').trim();
}
