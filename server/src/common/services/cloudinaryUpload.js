const { cloudinary } = require("../../config/cloudinary");
const { InternalServerError } = require("../errors");

function uploadImage(buffer, folder, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image", ...options },
      (err, result) => {
        if (err)
          return reject(
            new InternalServerError(`Image upload failed: ${err.message}`),
          );
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      },
    );
    stream.end(buffer);
  });
}

function uploadPdf(buffer, folder, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "raw", ...options },
      (err, result) => {
        if (err)
          return reject(
            new InternalServerError(`PDF upload failed: ${err.message}`),
          );
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
        });
      },
    );
    stream.end(buffer);
  });
}

async function deleteAsset(publicId, resourceType = "image") {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (err) {
    console.error(
      `[cloudinary] Failed to delete asset ${publicId}:`,
      err.message,
    );
  }
}

module.exports = { uploadImage, uploadPdf, deleteAsset };
