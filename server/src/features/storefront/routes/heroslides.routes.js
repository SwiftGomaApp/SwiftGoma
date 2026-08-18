const express = require("express");
const { getHeroSlides } = require("../controllers/heroslides.controller");

const HeroSlideRouter = express.Router();

HeroSlideRouter.get("/hero", getHeroSlides);

module.exports = HeroSlideRouter;
