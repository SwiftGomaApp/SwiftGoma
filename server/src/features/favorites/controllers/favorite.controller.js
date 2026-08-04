const {
  addFavorite,
  removeFavorite,
  listFavoriteIds,
  listFavorites,
} = require("../services/favorite.service");

async function postAddFavorite(req, res, next) {
  try {
    const favorite = await addFavorite(req.user.id, req.params.productId);
    res.status(201).json({ success: true, data: favorite });
  } catch (err) {
    next(err);
  }
}

async function deleteFavorite(req, res, next) {
  try {
    const result = await removeFavorite(req.user.id, req.params.productId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getFavoriteIds(req, res, next) {
  try {
    const ids = await listFavoriteIds(req.user.id);
    res.status(200).json({ success: true, data: ids });
  } catch (err) {
    next(err);
  }
}

async function getFavorites(req, res, next) {
  try {
    const result = await listFavorites(req.user.id, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postAddFavorite,
  deleteFavorite,
  getFavoriteIds,
  getFavorites,
};
