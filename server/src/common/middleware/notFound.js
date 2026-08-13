const { NotFoundError } = require("../errors");

function notFound(req, _res, next) {
  next(
    new NotFoundError(`Route introuvable : ${req.method} ${req.originalUrl}`),
  );
}

module.exports = { notFound };
