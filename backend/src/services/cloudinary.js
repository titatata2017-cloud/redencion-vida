const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

function uploadFile(filePath, originalName) {
  const path = require("path");
  const fs = require("fs");

  if (!process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Faltan las credenciales de Cloudinary");
  }

  const ext = path.extname(originalName || "").toLowerCase();
  const resourceType = [
    ".mp3", ".wav", ".ogg", ".m4a",
    ".mp4", ".webm", ".mov", ".m4v",
    ".mkv", ".avi", ".3gp"
  ].includes(ext) ? "video" : "image";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ministerio-redencion-vida",
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    const input = fs.createReadStream(filePath);
    input.on("error", reject);
    input.pipe(stream);
  });
}

module.exports = { cloudinary, uploadFile };
