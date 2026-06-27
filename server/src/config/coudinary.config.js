const cloudinary = require("cloudinary");
const {
  cloudinary_cloud_name,
  cloudinary_api_key,
  cloudinary_api_secret,
} = require("./env.config");

cloudinary.v2.config({
  cloud_name: cloudinary_cloud_name,
  api_key: cloudinary_api_key,
  api_secret: cloudinary_api_secret,
});

module.exports = {
  cloudinary: cloudinary,
  cloudinaryV2: cloudinary.v2,
};
