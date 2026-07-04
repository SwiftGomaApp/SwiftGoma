const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const {
  cloudinaryV2: cloudinary,
} = require("../../../config/coudinary.config");
const { errors } = require("../../../shared/errors/app.error");

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUSINESS_DOC_MIME_TYPES = [...IMAGE_MIME_TYPES, "application/pdf"];

const MAX_FILE_SIZE = 10 * 1024 * 1024; 

const kycStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const isPdf = file.mimetype === "application/pdf";
    return {
      folder: "swiftgoma/kyc",
      resource_type: isPdf ? "raw" : "image",
      allowed_formats: isPdf ? ["pdf"] : ["jpg", "jpeg", "png", "webp"],
      transformation: isPdf ? undefined : [{ quality: "auto" }],
    };
  },
});

const kycUploadHandler = multer({
  storage: kycStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const allowed =
      file.fieldname === "businessDoc"
        ? BUSINESS_DOC_MIME_TYPES
        : IMAGE_MIME_TYPES;

    if (!allowed.includes(file.mimetype)) {
      const message =
        file.fieldname === "businessDoc"
          ? "Format non supporté. Utilisez JPG, PNG, WebP ou PDF."
          : "Format non supporté. Utilisez JPG, PNG ou WebP.";
      return cb(errors.badRequest(message));
    }
    cb(null, true);
  },
}).fields([
  { name: "idFront", maxCount: 1 },
  { name: "idBack", maxCount: 1 },
  { name: "selfie", maxCount: 1 },
  { name: "businessDoc", maxCount: 1 },
]);

const kycUpload = (req, res, next) => {
  kycUploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          errors.badRequest("Chaque document ne doit pas dépasser 10 Mo."),
        );
      }
      return next(errors.badRequest(err.message));
    }
    if (err) return next(err);
    next();
  });
};

module.exports = { kycUpload };
