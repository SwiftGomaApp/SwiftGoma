const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinaryV2 } = require("../../../config/coudinary.config");
const { errors } = require("../../../shared/errors/app.error");

const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "pdf"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryV2,
  params: (req, file) => ({
    folder: `swiftgoma/kyc/${req.user.id}`,
    resource_type: file.mimetype === "application/pdf" ? "raw" : "image",
    allowed_formats: ALLOWED_FORMATS,
    public_id: `${file.fieldname}-${Date.now()}`,
  }),
});

const fileFilter = (req, file, cb) => {
  const ext = file.originalname.split(".").pop().toLowerCase();
  if (!ALLOWED_FORMATS.includes(ext)) {
    return cb(
      errors.badRequest(
        `Format de fichier non pris en charge pour "${file.fieldname}". Formats acceptés : ${ALLOWED_FORMATS.join(", ")}.`,
      ),
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

const kycUpload = upload.fields([
  { name: "idFront", maxCount: 1 },
  { name: "idBack", maxCount: 1 },
  { name: "selfie", maxCount: 1 },
  { name: "businessDoc", maxCount: 1 },
]);

const handleKycUpload = (req, res, next) => {
  kycUpload(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return next(
        errors.badRequest("Fichier trop volumineux. Taille maximale : 5MB."),
      );
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return next(
        errors.badRequest(`Champ de fichier inattendu : "${err.field}".`),
      );
    }
    if (err.isOperational) return next(err);

    next(errors.badRequest("Échec du téléversement des documents."));
  });
};

module.exports = { handleKycUpload };
