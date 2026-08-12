const {
  submitContactMessage,
  listContactMessages,
  getContactMessageById,
  updateContactMessage,
  assignContactMessageToMe,
} = require("../services/support.service");

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

async function getContactMessages(req, res, next) {
  try {
    const result = await listContactMessages(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getContactMessage(req, res, next) {
  try {
    const result = await getContactMessageById(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function patchContactMessage(req, res, next) {
  try {
    const result = await updateContactMessage(
      req.params.id,
      req.user,
      req.body,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postAssignContactMessage(req, res, next) {
  try {
    const result = await assignContactMessageToMe(req.params.id, req.user);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postContactMessage,
  getContactMessages,
  getContactMessage,
  patchContactMessage,
  postAssignContactMessage,
};
