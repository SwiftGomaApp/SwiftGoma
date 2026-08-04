const { submitContactMessage } = require("../services/support.service");

async function postContactMessage(req, res, next) {
  try {
    const result = await submitContactMessage({
      name: req.body.name,
      email: req.body.email,
      subject: req.body.subject,
      message: req.body.message,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { postContactMessage };
