const express = require("express");
const {
  getAddresses,
  postAddress,
  patchAddress,
  deleteAddressById,
  postSetDefaultAddress,
} = require("../controllers/address.controller");
const { authenticate } = require("../../../common/middleware/authenticate");

const AddressRouter = express.Router();

AddressRouter.use(authenticate);

AddressRouter.get("/", getAddresses);
AddressRouter.post("/", postAddress);
AddressRouter.patch("/:id", patchAddress);
AddressRouter.delete("/:id", deleteAddressById);
AddressRouter.post("/:id/default", postSetDefaultAddress);

module.exports = AddressRouter;
