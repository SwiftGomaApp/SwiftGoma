const express = require("express");

const sitemapController = require("../controllers/sitemap.controller");

const SitemapRouter = express.Router();

SitemapRouter.get("/products", sitemapController.getProductsSitemap);
SitemapRouter.get("/shops", sitemapController.getShopsSitemap);

module.exports = SitemapRouter;
