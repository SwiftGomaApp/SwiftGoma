import { SearchProduct } from "@/components/global/product-search-command";

export const MOCK_PRODUCTS: SearchProduct[] = [
  {
    id: "1",
    slug: "classic-leather-sneakers",
    name: "Classic Leather Sneakers",
    category: "Footwear",
    price: 89.99,
    originalPrice: 120,
    images: [
      {
        src: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80&auto=format&fit=crop",
        alt: "White leather sneaker, side view",
      },
      {
        src: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=80&auto=format&fit=crop",
        alt: "White leather sneaker, top view",
      },
    ],
  },
  {
    id: "2",
    slug: "oversized-cotton-hoodie",
    name: "Oversized Cotton Hoodie",
    category: "Apparel",
    price: 54.5,
    images: [
      {
        src: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80&auto=format&fit=crop",
        alt: "Grey oversized hoodie",
      },
    ],
  },
  {
    id: "3",
    slug: "minimalist-analog-watch",
    name: "Minimalist Analog Watch",
    category: "Accessories",
    price: 149,
    originalPrice: 189,
    images: [
      {
        src: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80&auto=format&fit=crop",
        alt: "Black analog watch",
      },
      {
        src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80&auto=format&fit=crop",
        alt: "Black analog watch, close-up",
      },
    ],
  },
  {
    id: "4",
    slug: "canvas-tote-bag",
    name: "Canvas Tote Bag",
    category: "Bags",
    price: 32,
    images: [
      {
        src: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&q=80&auto=format&fit=crop",
        alt: "Natural canvas tote bag",
      },
    ],
  },
  {
    id: "5",
    slug: "wireless-noise-cancelling-headphones",
    name: "Wireless Noise-Cancelling Headphones",
    category: "Electronics",
    price: 199.99,
    originalPrice: 249.99,
    images: [
      {
        src: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80&auto=format&fit=crop",
        alt: "Black wireless headphones",
      },
    ],
  },
  {
    id: "6",
    slug: "ceramic-pour-over-set",
    name: "Ceramic Pour-Over Set",
    category: "Home",
    price: 42,
    images: [
      {
        src: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80&auto=format&fit=crop",
        alt: "White ceramic pour-over coffee set",
      },
    ],
  },
  {
    id: "7",
    slug: "slim-fit-chino-pants",
    name: "Slim Fit Chino Pants",
    category: "Apparel",
    price: 64,
    images: [
      {
        src: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80&auto=format&fit=crop",
        alt: "Khaki slim fit chinos",
      },
    ],
  },
  {
    id: "8",
    slug: "stainless-steel-water-bottle",
    name: "Stainless Steel Water Bottle",
    category: "Accessories",
    price: 24.99,
    images: [
      {
        src: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80&auto=format&fit=crop",
        alt: "Silver stainless steel water bottle",
      },
    ],
  },
];
