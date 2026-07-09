const { catchAsync } = require("../../../shared/utils/catchAsync");
const addressService = require("../services/address.service");

const listAddresses = catchAsync(async (req, res) => {
  const addresses = await addressService.listAddresses({ userId: req.user.id });
  res.status(200).json({ success: true, data: addresses });
});

const addAddress = catchAsync(async (req, res) => {
  const { label, commune, quartier, avenue, reference, isDefault } = req.body;
  const address = await addressService.addAddress({
    userId: req.user.id,
    label,
    commune,
    quartier,
    avenue,
    reference,
    isDefault,
  });
  res.status(201).json({
    success: true,
    message: "Adresse ajoutée.",
    data: address,
  });
});

const updateAddress = catchAsync(async (req, res) => {
  const { label, commune, quartier, avenue, reference } = req.body;
  const address = await addressService.updateAddress({
    userId: req.user.id,
    addressId: req.params.id,
    label,
    commune,
    quartier,
    avenue,
    reference,
  });
  res.status(200).json({
    success: true,
    message: "Adresse mise à jour.",
    data: address,
  });
});

const deleteAddress = catchAsync(async (req, res) => {
  await addressService.deleteAddress({
    userId: req.user.id,
    addressId: req.params.id,
  });
  res.status(200).json({ success: true, message: "Adresse supprimée." });
});

const setDefaultAddress = catchAsync(async (req, res) => {
  await addressService.setDefaultAddress({
    userId: req.user.id,
    addressId: req.params.id,
  });
  res
    .status(200)
    .json({ success: true, message: "Adresse par défaut mise à jour." });
});

module.exports = {
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
