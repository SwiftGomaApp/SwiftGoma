"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Slide {
  image: string;
  title: string;
  description: string;
}

// NOTE: Placeholder images from Picsum (stable, no API key required).
// Replace with real SwiftGoma/Goma photos before production.
const slides: Slide[] = [
  {
    image:
      "https://res.cloudinary.com/dx3wclabo/image/upload/v1782828457/af94d13d39924d6e95ea777e064f1aa6_18.jpeg_k0twly.webp",
    title: "Vendez localement à Goma",
    description:
      "Créez votre boutique en quelques minutes et touchez des milliers d'acheteurs dans votre ville.",
  },
  {
    image:
      "https://res.cloudinary.com/dx3wclabo/image/upload/v1782828458/46720_hd8wxo.jpg",
    title: "Payez et soyez payé en Mobile Money",
    description:
      "Orange Money, Airtel Money, M-Pesa — recevez vos paiements directement, sans tracas.",
  },
  {
    image:
      "https://res.cloudinary.com/dx3wclabo/image/upload/v1782828455/77702_g8ppon.jpg",
    title: "Zéro commission sur vos ventes",
    description:
      "Gardez 100% de vos revenus. SwiftGoma fonctionne uniquement par abonnement mensuel.",
  },
  {
    image:
      "https://res.cloudinary.com/dx3wclabo/image/upload/v1782828460/2149095934_bsmbyb.jpg",
    title: "Livraison suivie en temps réel",
    description:
      "Vos livreurs partagent leur position GPS en direct — vos clients suivent leur commande pas à pas.",
  },
  {
    image:
      "https://res.cloudinary.com/dx3wclabo/image/upload/v1782828461/35124_acb3zy.jpg",
    title: "Une marketplace pensée pour Goma",
    description:
      "Construite pour les vendeurs locaux, avec un support en français et une équipe basée à Goma.",
  },
];

const AUTO_PLAY_MS = 5000;

export function AuthCarousel() {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, AUTO_PLAY_MS);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-muted">
      {slides.map((slide, i) => (
        <div
          key={slide.image}
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-in-out",
            i === index ? "opacity-100" : "opacity-0",
          )}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority={i === 0}
            unoptimized
            className="object-cover dark:brightness-[0.6]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
        </div>
      ))}

      {/* Text content */}
      <div className="absolute bottom-10 left-10 right-10 text-white">
        <p className="text-2xl font-semibold leading-snug transition-all duration-500">
          {slides[index].title}
        </p>
        <p className="mt-2 text-sm text-white/70 transition-all duration-500">
          {slides[index].description}
        </p>

        {/* Dots */}
        <div className="mt-6 flex gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.image}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Aller à la diapositive ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/40",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
