const express = require("express");
const {
  postAddFavorite,
  deleteFavorite,
  getFavoriteIds,
  getFavorites,
} = require("../controllers/favorite.controller");
const { authenticate } = require("../../../common/middleware/authenticate");

const FavoriteRouter = express.Router();

FavoriteRouter.use(authenticate);

FavoriteRouter.get("/", getFavorites);
FavoriteRouter.get("/ids", getFavoriteIds);
FavoriteRouter.post("/:productId", postAddFavorite);
FavoriteRouter.delete("/:productId", deleteFavorite);

module.exports = FavoriteRouter;
