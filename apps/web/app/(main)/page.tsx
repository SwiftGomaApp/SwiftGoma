import { HeroCarousel } from "@/components/home/hero-carousel";
import { PopularProductsSection } from "@/components/home/popular-products-section";
import {
  getCachedHeroSlides,
  getCachedPopularProducts,
} from "@/lib/api/cached-public";
import type { HeroSlide, ProductListItem } from "@/lib/api/routes/public";

export default async function Home() {
  let slides: HeroSlide[] = [];
  let popularProducts: ProductListItem[] = [];

  try {
    slides = await getCachedHeroSlides();
  } catch (err) {
    console.error("[Home] Failed to load hero slides:", err);
  }

  try {
    popularProducts = await getCachedPopularProducts(12);
  } catch (err) {
    console.error("[Home] Failed to load popular products:", err);
  }

  return (
    <div className="flex flex-col">
      <HeroCarousel slides={slides} />
      <PopularProductsSection products={popularProducts} />
    </div>
  );
}
