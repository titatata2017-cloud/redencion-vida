import { useEffect, useState } from "react";
import api from "../services/api";
import Section from "../components/Section";

function isWebVideoUrl(value) {
  const v = String(value || "").trim();
  return /^https?:\/\//i.test(v) || v.startsWith("/uploads/");
}

export default function ContentList({ type, title, subtitle }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const response = await api.get(`/content/${type}`);
        if (alive) setItems(Array.isArray(response.data) ? response.data : []);
      } catch {
        if (alive) setItems([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [type]);

  return (
    <Section title={title} subtitle={subtitle}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {items.map((item) => (
          <article key={item.id} className="glass rounded-3xl p-4 sm:p-6 shadow-soft overflow-hidden">
            {type === "videos" && isWebVideoUrl(item.video_url) ? (
              <video
                src={item.video_url}
                controls
                playsInline
                preload="metadata"
                poster={item.thumbnail_url || undefined}
                className="w-full aspect-video object-contain rounded-2xl bg-black mb-4"
              />
            ) : (item.image_url || item.thumbnail_url) ? (
              <img
                src={item.image_url || item.thumbnail_url}
                className="w-full aspect-video object-cover rounded-2xl mb-4"
                alt=""
                loading="lazy"
              />
            ) : null}

            {type === "videos" && item.video_url && !isWebVideoUrl(item.video_url) && (
              <div className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-50 p-3 text-sm text-amber-800">
                Este video tiene una referencia local que no puede reproducirse desde la web. Debe volver a cargarse desde Administración.
              </div>
            )}

            {item.author_name && (
              <b className="text-brand-red text-xs uppercase">{item.author_name}</b>
            )}
            <h3 className="text-xl font-black text-brand-navy mt-1 break-words">{item.title}</h3>
            <p className="mt-2 text-slate-600 whitespace-pre-wrap break-words">
              {item.description || item.summary || item.content}
            </p>

            {type === "videos" && /^https?:\/\//i.test(String(item.video_url || "")) && (
              <a
                className="inline-block mt-4 font-bold text-brand-blue"
                href={item.video_url}
                target="_blank"
                rel="noreferrer"
              >
                Abrir video externo →
              </a>
            )}
          </article>
        ))}
      </div>
    </Section>
  );
}
