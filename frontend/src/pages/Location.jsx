import { useEffect, useState } from "react";
import { ExternalLink, MapPin, Phone, Route } from "lucide-react";
import api from "../services/api";
import Section from "../components/Section";
import MapEmbed from "../components/MapEmbed";

function safeExternalUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return /^https?:$/i.test(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

export default function Location() {
  const [s, setS] = useState({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await api.get("/settings");
        if (alive) setS(r.data || {});
      } catch {
        // Public page remains usable with its fallback content.
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const directionsUrl = safeExternalUrl(s.church_directions_url);
  const mapUrl = safeExternalUrl(s.church_map_url);

  return (
    <Section
      title="Ubicación y cómo llegar"
      subtitle="Consulta la dirección, horarios y mapa oficial publicados por el ministerio."
    >
      <div className="grid lg:grid-cols-[minmax(280px,.8fr)_minmax(0,1.2fr)] gap-6 items-stretch">
        <div className="glass rounded-3xl p-6 sm:p-7 flex flex-col min-w-0">
          <MapPin className="text-brand-red shrink-0" />
          <h1 className="text-2xl font-black mt-4 break-words">
            {s.church_name || "Ministerio Redención y Vida"}
          </h1>
          <p className="mt-3 text-slate-600 break-words">
            {s.church_address || "Dirección pendiente de publicación"}
            {s.church_city ? `, ${s.church_city}` : ""}
          </p>

          {s.church_schedule && (
            <div className="mt-5">
              <b>Horarios</b>
              <p className="mt-1 whitespace-pre-wrap text-slate-600 leading-7">
                {s.church_schedule}
              </p>
            </div>
          )}

          {s.church_phone && (
            <p className="mt-5 flex gap-2 items-center break-all">
              <Phone size={17} className="shrink-0" />
              {s.church_phone}
            </p>
          )}

          <div className="flex flex-wrap gap-3 mt-6 pt-2">
            {directionsUrl && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex gap-2 items-center bg-brand-navy text-white px-4 py-3 rounded-xl font-black transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-gold"
              >
                <Route size={17} />
                Cómo llegar
              </a>
            )}
            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex gap-2 items-center border border-slate-200 bg-white px-4 py-3 rounded-xl font-black transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-gold"
              >
                Abrir mapa
                <ExternalLink size={17} />
              </a>
            )}
          </div>
        </div>

        <div className="glass rounded-3xl overflow-hidden min-h-[360px] lg:min-h-[430px] shadow-soft">
          <MapEmbed value={s.church_map_embed_url} title="Mapa de ubicación del Ministerio Redención y Vida" />
        </div>
      </div>
    </Section>
  );
}
