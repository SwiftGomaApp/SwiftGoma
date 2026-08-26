const sitemapService = require("../services/sitemap.service");

async function getProductsSitemap(req, res) {
  const products = await sitemapService.listProductsForSitemap();
  res.status(200).json(products);
}

async function getShopsSitemap(req, res) {
  const shops = await sitemapService.listShopsForSitemap();
  res.status(200).json(shops);
}

module.exports = { getProductsSitemap, getShopsSitemap };
