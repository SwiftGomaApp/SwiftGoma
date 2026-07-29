const multer = require("multer");

const { BadRequestError } = require("../errors");

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_DOCUMENT_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf"];

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(
        new BadRequestError("Only JPEG, PNG, or WEBP images are allowed."),
      );
    }
    cb(null, true);
  },
});

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new BadRequestError("Only PDF files are allowed."));
    }
    cb(null, true);
  },
});

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
      return cb(
        new BadRequestError("Only JPEG, PNG, WEBP, or PDF files are allowed."),
      );
    }
    cb(null, true);
  },
});

function detectRealMimeType(buffer) {
  if (!buffer || buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  if (buffer.toString("ascii", 0, 5) === "%PDF-") {
    return "application/pdf";
  }

  return null;
}

function verifyFileContents(allowedTypes) {
  return (req, res, next) => {
    const files = req.file
      ? [req.file]
      : req.files
        ? Array.isArray(req.files)
          ? req.files
          : Object.values(req.files).flat()
        : [];

    for (const file of files) {
      const realType = detectRealMimeType(file.buffer);
      if (!realType || !allowedTypes.includes(realType)) {
        return next(
          new BadRequestError(
            `Le fichier "${file.originalname}" ne correspond à aucun format autorisé (contenu réel non reconnu ou non permis).`,
          ),
        );
      }
      file.mimetype = realType;
    }

    next();
  };
}

const verifyImageContents = verifyFileContents(ALLOWED_IMAGE_TYPES);
const verifyDocumentContents = verifyFileContents(ALLOWED_DOCUMENT_TYPES);
const verifyPdfContents = verifyFileContents(["application/pdf"]);

module.exports = {
  imageUpload,
  pdfUpload,
  documentUpload,
  verifyImageContents,
  verifyDocumentContents,
  verifyPdfContents,
};
