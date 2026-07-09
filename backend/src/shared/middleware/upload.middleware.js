const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinaryV2: cloudinary } = require("../../config/coudinary.config");
const { errors } = require("../errors/app.error");

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ─── Generic storage factory ──────────────────────────────────────────────────

const makeStorage = (folder) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `swiftgoma/${folder}`,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [
        { width: 500, height: 500, crop: "limit", quality: "auto" },
      ],
    },
  });

const makeUpload = (folder, fieldName = "file") => {
  const upload = multer({
    storage: makeStorage(folder),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(
          errors.badRequest("Format non supporté. Utilisez JPG, PNG ou WebP."),
        );
      }
      cb(null, true);
    },
  });

  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(errors.badRequest("L'image ne doit pas dépasser 5 Mo."));
        }
        return next(errors.badRequest(err.message));
      }
      if (err) return next(err);
      next();
    });
  };
};

const avatarUpload = makeUpload("avatars", "avatar");
const logoUpload = makeUpload("logos", "logo");

// ─── Shop logo + banner ───────────────────────────────────────────────────────

const shopLogoUploadHandler = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "swiftgoma/shops",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ quality: "auto" }],
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        errors.badRequest("Format non supporté. Utilisez JPG, PNG ou WebP."),
      );
    }
    cb(null, true);
  },
}).fields([
  { name: "logo", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

const shopLogoUpload = (req, res, next) => {
  shopLogoUploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(errors.badRequest("L'image ne doit pas dépasser 5 Mo."));
      }
      return next(errors.badRequest(err.message));
    }
    if (err) return next(err);
    next();
  });
};

// ─── Shop KYC (national ID — up to 2 images or PDFs) ─────────────────────────

const shopKycHandler = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: (req, file) => ({
      folder: "swiftgoma/shop-kyc",
      resource_type: file.mimetype === "application/pdf" ? "raw" : "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
      transformation:
        file.mimetype === "application/pdf" ? undefined : [{ quality: "auto" }],
    }),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [...ALLOWED_MIME_TYPES, "application/pdf"];
    if (!allowed.includes(file.mimetype)) {
      return cb(
        errors.badRequest(
          "Format non supporté. Utilisez JPG, PNG, WebP ou PDF.",
        ),
      );
    }
    cb(null, true);
  },
}).array("documents", 2);

const shopKycUpload = (req, res, next) => {
  shopKycHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          errors.badRequest("Chaque document ne doit pas dépasser 10 Mo."),
        );
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return next(
          errors.badRequest("Maximum 2 documents autorisés (recto + verso)."),
        );
      }
      return next(errors.badRequest(err.message));
    }
    if (err) return next(err);
    next();
  });
};

// ─── Seller profile KYC (up to 5 docs) ───────────────────────────────────────

const kycUploadHandler = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: (req, file) => ({
      folder: "swiftgoma/kyc",
      resource_type: file.mimetype === "application/pdf" ? "raw" : "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
      transformation:
        file.mimetype === "application/pdf" ? undefined : [{ quality: "auto" }],
    }),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [...ALLOWED_MIME_TYPES, "application/pdf"];
    if (!allowed.includes(file.mimetype)) {
      return cb(
        errors.badRequest(
          "Format non supporté. Utilisez JPG, PNG, WebP ou PDF.",
        ),
      );
    }
    cb(null, true);
  },
}).array("documents", 5);

const kycUploadMiddleware = (req, res, next) => {
  let finished = false;

  const timeout = setTimeout(() => {
    if (!finished) {
      finished = true;
      next(errors.badRequest("Le téléversement a expiré. Réessayez."));
    }
  }, 15000); // 15s

  kycUploadHandler(req, res, (err) => {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          errors.badRequest("Chaque document ne doit pas dépasser 10 Mo."),
        );
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return next(errors.badRequest("Maximum 5 documents autorisés."));
      }
      return next(errors.badRequest(err.message));
    }
    if (err) return next(err);
    next();
  });
};

// ─── Product images (up to 10) ────────────────────────────────────────────────

const productImagesHandler = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "swiftgoma/products",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ quality: "auto", width: 1200, crop: "limit" }],
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        errors.badRequest("Format non supporté. Utilisez JPG, PNG ou WebP."),
      );
    }
    cb(null, true);
  },
}).array("images", 10);

const productImagesUpload = (req, res, next) => {
  productImagesHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          errors.badRequest("Chaque image ne doit pas dépasser 5 Mo."),
        );
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return next(
          errors.badRequest("Maximum 10 images autorisées par envoi."),
        );
      }
      return next(errors.badRequest(err.message));
    }
    if (err) return next(err);
    next();
  });
};

module.exports = {
  avatarUpload,
  logoUpload,
  kycUploadMiddleware,
  shopLogoUpload,
  shopKycUpload,
  productImagesUpload,
};
