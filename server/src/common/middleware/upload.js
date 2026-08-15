const multer = require("multer");

const { BadRequestError } = require("../errors");

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_DOCUMENT_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf"];

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
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
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "application/pdf";
  }

  return null;
}

function verifyFileContents(allowedTypes) {
  return (req, res, next) => {
    const files = req.files
      ? Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat()
      : req.file
        ? [req.file]
        : [];

    for (const file of files) {
      const realType = detectRealMimeType(file.buffer);
      if (!realType || !allowedTypes.includes(realType)) {
        return next(
          new BadRequestError(
            "Le contenu du fichier ne correspond à aucun format autorisé (contenu réel non reconnu ou non permis).",
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

function verifyFieldContents(fieldRules) {
  return (req, res, next) => {
    const fileGroups = req.files
      ? Array.isArray(req.files)
        ? { file: req.files }
        : req.files
      : req.file
        ? { file: [req.file] }
        : {};

    for (const [fieldName, files] of Object.entries(fileGroups)) {
      const allowedTypes = fieldRules[fieldName];
      if (!allowedTypes) continue;

      for (const file of files) {
        const realType = detectRealMimeType(file.buffer);
        if (!realType || !allowedTypes.includes(realType)) {
          return next(
            new BadRequestError(
              `Le fichier pour "${fieldName}" ne correspond à aucun format autorisé (contenu réel non reconnu ou non permis).`,
            ),
          );
        }
        file.mimetype = realType;
      }
    }

    next();
  };
}

module.exports = {
  imageUpload,
  pdfUpload,
  documentUpload,
  verifyImageContents,
  verifyDocumentContents,
  verifyPdfContents,
  verifyFieldContents,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
};
