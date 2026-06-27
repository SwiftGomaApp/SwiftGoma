const { errors } = require("../../../shared/errors/app.error");
const {
  getAccessToken,
  verifyAccessToken,
} = require("../../../shared/utils/cookie.utils");
const { prisma } = require("../../../config/db.config");
const { USER_SELECT } = require("../constants/prisma-selects");

const authenticate = async (req, res, next) => {
  try {
    const token = getAccessToken(req);

    if (!token) throw errors.unauthorized();

    const payload = verifyAccessToken(token);

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: {
        user: { select: USER_SELECT },
      },
    });

    if (!session) throw errors.sessionInvalid();

    if (session.user.isDeleted) throw errors.accountDeleted();

    req.user = {
      ...session.user,
      sessionId: session.id,
    };

    next();
  } catch (err) {
    next(err);
  }
};

const requireVerified = (req, res, next) => {
  if (!req.user?.isVerified) {
    return next(errors.badRequest("Votre compte n'est pas encore vérifié."));
  }
  next();
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(errors.forbidden());
    }
    next();
  };
};

module.exports = { authenticate, requireVerified, requireRole };
