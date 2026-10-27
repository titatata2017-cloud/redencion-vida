import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const FIELDS = {
  activities: ["title", "description", "event_date", "location"],
  studies: ["title", "summary", "content"],
  testimonies: ["author_name", "title", "content"],
  videos: ["title", "description", "video_url", "thumbnail_url"],
  songs: ["title", "artist", "cover_url"],
};

const LABELS = {
  title: "Título",
  description: "Descripción",
  event_date: "Fecha y hora",
  location: "Lugar",
  summary: "Resumen",
  content: "Contenido",
  author_name: "Autor",
  video_url: "URL externa del video (opcional)",
  thumbnail_url: "URL de miniatura",
  artist: "Artista",
  cover_url: "URL de portada",
};

const MULTILINE = new Set(["description", "summary", "content"]);

function isLocalFileReference(value) {
  const v = String(value || "").trim().toLowerCase();
  return v.startsWith("file:") || /^[a-z]:[\\/]/i.test(String(value || "")) || v.startsWith("c:\\fakepath\\");
}

function isPlayableVideoUrl(value) {
  const v = String(value || "").trim();
  return /^https?:\/\//i.test(v) || v.startsWith("/uploads/") || v.startsWith("blob:");
}

const TITLES = {
  activities: "Actividades",
  studies: "Estudios bíblicos",
  testimonies: "Testimonios",
  videos: "Videos",
  songs: "Alabanzas",
};

function emptyForm(fields) {
  return Object.fromEntries(fields.map((field) => [field, ""]).concat([["published", true]]));
}

export default function Content({ type }) {
  const fields = useMemo(() => FIELDS[type] || [], [type]);
  const title = TITLES[type] || "Contenido";

  const [items, setItems] = useState([]);
  const [form, setForm] = useState(() => emptyForm(fields));
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/content/admin/${type}`);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo cargar el contenido.");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setForm(emptyForm(fields));
    setFile(null);
    setEditingId(null);
  }, [fields]);

  const reset = useCallback(() => {
    setForm(emptyForm(fields));
    setFile(null);
    setEditingId(null);
  }, [fields]);

  const edit = useCallback(
    (item) => {
      setEditingId(item.id);
      setForm({
        ...Object.fromEntries(
          fields.map((field) => [
            field,
            type === "videos" && field === "video_url" && isLocalFileReference(item[field])
              ? ""
              : item[field] ?? "",
          ])
        ),
        published: Boolean(item.published),
      });
      setFile(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [fields]
  );

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        // A local Windows path/file:// URL is never a valid public video URL.
        // When a real file is selected, the backend receives it in multipart/form-data.
        if (type === "videos" && key === "video_url" && isLocalFileReference(value)) return;
        data.append(key, String(value ?? ""));
      });
      if (file) data.append("file", file);

      if (editingId) {
        await api.put(`/content/${type}/${editingId}`, data);
      } else {
        await api.post(`/content/${type}`, data);
      }

      reset();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo guardar el contenido.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("¿Eliminar este contenido? Esta acción no se puede deshacer.")) return;

    setError("");
    try {
      await api.delete(`/content/${type}/${id}`);
      if (editingId === id) reset();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo eliminar el contenido.");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">{title}</h1>
          <p className="text-slate-400 mt-1">
            Alta, edición, publicación y eliminación con control administrativo.
          </p>
        </div>
        {editingId && (
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 rounded-xl border border-white/20 font-bold"
          >
            Cancelar edición
          </button>
        )}
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-950/40 p-4 text-red-200">
          {error}
        </div>
      )}

      <div className="mt-7 grid xl:grid-cols-[400px_1fr] gap-7">
        <form
          onSubmit={save}
          className="bg-slate-900 border border-white/10 p-6 rounded-3xl shadow-xl"
        >
          <h2 className="font-black text-xl">
            {editingId ? "Editar contenido" : "Nuevo contenido"}
          </h2>

          {fields.map((field) => (
            <div key={field} className="mt-4 text-sm font-bold">
              <label htmlFor={`content-${field}`}>
                {LABELS[field] || field}
              </label>

              {MULTILINE.has(field) ? (
                <textarea
                  id={`content-${field}`}
                  rows={field === "content" || field === "description" ? 6 : 4}
                  className="mt-1 w-full bg-slate-950 border border-white/10 rounded-xl p-3"
                  value={form[field] || ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [field]: event.target.value }))
                  }
                />
              ) : (
                <input
                  id={`content-${field}`}
                  type={
                    field === "event_date"
                      ? "datetime-local"
                      : field.endsWith("_url")
                        ? "url"
                        : "text"
                  }
                  className="mt-1 w-full bg-slate-950 border border-white/10 rounded-xl p-3"
                  value={form[field] || ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [field]: event.target.value }))
                  }
                />
              )}
            </div>
          ))}

          <div className="mt-4 text-sm font-bold">
            <label htmlFor="content-file">
              {type === "songs" ? "Archivo de audio" : type === "videos" ? "Video desde computadora o celular" : "Imagen"}
            </label>
            <input
              id="content-file"
              type="file"
              accept={
                type === "songs"
                  ? "audio/*"
                  : type === "videos"
                    ? "video/mp4,video/webm,video/quicktime,video/ogg,video/*"
                    : "image/jpeg,image/png,image/webp,image/gif"
              }
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="mt-2 block w-full rounded-xl border border-white/10 bg-slate-950 p-2 text-xs sm:text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-bold file:text-slate-900"
            />
            <p className="mt-2 text-xs font-normal text-slate-500">
              {type === "videos"
                ? "MP4 recomendado. También se aceptan WebM, MOV y OGG. En celular puedes elegir un video existente desde Fotos/Galería o Archivos."
                : type === "songs"
                  ? "MP3, WAV u OGG. En celular puedes seleccionarlo desde Archivos."
                  : "JPG, PNG, WebP o GIF."}
            </p>
            {type === "videos" && file && (
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black">
                <video
                  src={URL.createObjectURL(file)}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full max-h-64 object-contain"
                />
                <div className="p-2 text-xs text-slate-400 break-words">Archivo seleccionado: {file.name}</div>
              </div>
            )}
          </div>

          <label className="flex gap-2 mt-4 items-center font-bold text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.published)}
              onChange={(event) =>
                setForm((current) => ({ ...current, published: event.target.checked }))
              }
            />
            Publicado
          </label>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 w-full bg-white text-slate-900 px-5 py-3 rounded-xl font-black disabled:opacity-50"
          >
            {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear contenido"}
          </button>
        </form>

        <div className="grid gap-3">
          {loading ? (
            <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl text-slate-400">
              Cargando…
            </div>
          ) : items.length === 0 ? (
            <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl text-slate-400">
              No hay registros todavía.
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="bg-slate-900 border border-white/10 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:justify-between gap-4 overflow-hidden"
              >
                <div className="min-w-0">
                  <div className="flex gap-2 items-center">
                    <b className="truncate">{item.title || item.author_name || "Sin título"}</b>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        item.published
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-white/10 text-slate-400"
                      }`}
                    >
                      {item.published ? "Publicado" : "Borrador"}
                    </span>
                  </div>
                  {type === "videos" && isPlayableVideoUrl(item.video_url) && (
                    <video
                      src={item.video_url}
                      controls
                      playsInline
                      preload="metadata"
                      className="mt-3 w-full max-w-xl max-h-56 rounded-xl bg-black object-contain"
                    />
                  )}
                  {type === "videos" && item.video_url && !isPlayableVideoUrl(item.video_url) && (
                    <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-950/20 p-3 text-xs text-amber-200">
                      La referencia de video almacenada no es reproducible en la web. Selecciona el MP4 nuevamente para reemplazarla.
                    </div>
                  )}
                  <p className="text-sm text-slate-400 mt-2 line-clamp-3 break-words">
                    {item.description ||
                      item.summary ||
                      item.content ||
                      item.video_url ||
                      item.audio_url ||
                      "Sin descripción"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => edit(item)}
                    className="text-white font-bold"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="text-red-300 font-bold"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
