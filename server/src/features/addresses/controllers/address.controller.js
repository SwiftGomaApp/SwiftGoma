const {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../services/address.service");

async function getAddresses(req, res, next) {
  try {
    const addresses = await listAddresses(req.user.id);
    res.status(200).json({ success: true, data: addresses });
  } catch (err) {
    next(err);
  }
}

async function postAddress(req, res, next) {
  try {
    const address = await createAddress(req.user.id, req.body);
    res.status(201).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

async function patchAddress(req, res, next) {
  try {
    const address = await updateAddress(req.user.id, req.params.id, req.body);
    res.status(200).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

async function deleteAddressById(req, res, next) {
  try {
    const result = await deleteAddress(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postSetDefaultAddress(req, res, next) {
  try {
    const address = await setDefaultAddress(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAddresses,
  postAddress,
  patchAddress,
  deleteAddressById,
  postSetDefaultAddress,
};
