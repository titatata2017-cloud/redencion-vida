import { MapPin } from "lucide-react";

/**
 * Accepts either a Google Maps embed URL or the complete <iframe ...> code
 * copied from Google Maps. Only http/https URLs are rendered.
 */
export function normalizeMapEmbedUrl(value) {
  let raw = String(value ?? "").trim();
  if (!raw) return "";

  const iframeMatch = raw.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/i);
  if (iframeMatch) raw = iframeMatch[1];

  raw = raw
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .trim();

  try {
    const url = new URL(raw, window.location.origin);
    if (!/^https?:$/i.test(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

export default function MapEmbed({ value, title = "Mapa de ubicación", className = "" }) {
  const src = normalizeMapEmbedUrl(value);

  if (!src) {
    return (
      <div className={`min-h-[360px] grid place-items-center p-8 text-center text-slate-500 ${className}`}>
        <div>
          <MapPin size={44} className="mx-auto mb-3 text-brand-red" />
          <p className="font-semibold">El mapa se mostrará cuando Administración configure una URL válida.</p>
          <p className="mt-2 text-sm">Puedes pegar la URL de inserción o el código iframe completo de Google Maps.</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      title={title}
      src={src}
      className={`block w-full h-full min-h-[360px] border-0 ${className}`}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
}
