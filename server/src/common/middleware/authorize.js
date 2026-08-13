const { ForbiddenError } = require("../errors");

function authorize(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user || !req.user.role) {
      throw new ForbiddenError("Accès refusé.");
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        "Vous n'avez pas la permission d'accéder à cette ressource.",
      );
    }
    next();
  };
}

module.exports = { authorize };
