const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const dir = process.env.UPLOAD_DIR || "/app/uploads";
fs.mkdirSync(dir, { recursive: true });

const mimeByExtension = {
  ".jpg": ["image/jpeg"], ".jpeg": ["image/jpeg"], ".png": ["image/png"],
  ".webp": ["image/webp"], ".gif": ["image/gif"],
  ".mp3": ["audio/mpeg", "audio/mp3", "application/octet-stream"],
  ".wav": ["audio/wav", "audio/x-wav", "application/octet-stream"],
  ".ogg": ["audio/ogg", "application/ogg", "application/octet-stream"],
  ".mp4": ["video/mp4", "application/octet-stream"],
  ".webm": ["video/webm", "application/octet-stream"],
  ".mov": ["video/quicktime", "application/octet-stream"],
  ".m4v": ["video/x-m4v", "video/mp4", "application/octet-stream"],
  ".mkv": ["video/x-matroska", "application/octet-stream"],
  ".avi": ["video/x-msvideo", "video/avi", "application/octet-stream"],
  ".3gp": ["video/3gpp", "video/3gpp2", "application/octet-stream"],
  ".pdf": ["application/pdf"],
};

const maxMb = Number(process.env.MAX_UPLOAD_MB || 250);

function isAllowed(file) {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const accepted = mimeByExtension[ext];
  return Boolean(accepted && accepted.includes(file.mimetype));
}

module.exports = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, dir),
    filename: (_, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomBytes(7).toString("hex")}${ext}`);
    },
  }),
  limits: { fileSize: maxMb * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (isAllowed(file)) return cb(null, true);
    return cb(new Error(`Tipo de archivo no permitido: ${file.mimetype || "desconocido"}`));
  },
});
