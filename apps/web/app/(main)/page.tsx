"use client";

import ProductCard from "@/components/global/product-card";

const images = [
  {
    src: "https://res.cloudinary.com/dhi42oo2s/image/upload/v1773374268/samples/shoe.jpg",
    alt: "Purple colorway",
  },
  {
    src: "https://res.cloudinary.com/dhi42oo2s/image/upload/v1773374279/cld-sample-5.jpg",
    alt: "White colorway",
  },
  {
    src: "https://res.cloudinary.com/dhi42oo2s/image/upload/v1773374275/samples/woman-on-a-football-field.jpg",
    alt: "Pink colorway",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-2">
      <ProductCard
        category="Women Shoes"
        name="Nike Air Max 270"
        price={139.99}
        images={[
          {
            src: "https://res.cloudinary.com/dhi42oo2s/image/upload/v1773374279/cld-sample-5.jpg",
            alt: "White colorway",
          },
          {
            src: "https://res.cloudinary.com/dhi42oo2s/image/upload/v1773374275/samples/woman-on-a-football-field.jpg",
            alt: "Pink colorway",
          },
          {
            src: "https://res.cloudinary.com/dhi42oo2s/image/upload/v1773374268/samples/shoe.jpg",
            alt: "Purple colorway",
          },
        ]}
        onAddToCart={() => console.log("Added to cart")}
        onFavoriteToggle={(fav) => console.log("Favorited:", fav)}
      />

      <ProductCard
        orientation="horizontal"
        category="Women Shoes"
        name="Nike Air Max 270"
        price={139.99}
        originalPrice={169.99}
        images={images}
        onAddToCart={() => console.log("Added to cart")}
        onFavoriteToggle={(fav) => console.log("Favorited:", fav)}
      />
    </div>
  );
}
