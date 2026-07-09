const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const sessionService = require("../services/session.service");

const removeSession = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id) throw errors.badRequest("L'identifiant de la session est requis.");

  await sessionService.removeSession({
    userId: req.user.id,
    sessionId: id,
    currentSessionId: req.user.sessionId,
  });

  res.status(200).json({
    success: true,
    message: "Session déconnectée avec succès.",
  });
});

const removeAllOtherSessions = catchAsync(async (req, res) => {
  const { count } = await sessionService.removeAllOtherSessions({
    userId: req.user.id,
    currentSessionId: req.user.sessionId,
  });

  res.status(200).json({
    success: true,
    message:
      count > 0
        ? `${count} session(s) déconnectée(s) avec succès.`
        : "Aucune autre session active.",
    data: { count },
  });
});

module.exports = { removeSession, removeAllOtherSessions };
