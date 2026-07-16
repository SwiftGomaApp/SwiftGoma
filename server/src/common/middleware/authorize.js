const { ForbiddenError } = require("../errors");

function authorize(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user || !req.user.role) {
      throw new ForbiddenError("Access denied.");
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        "You do not have permission to access this resource.",
      );
    }
    next();
  };
}

module.exports = { authorize };
