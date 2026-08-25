import ProductCard from "@/components/global/product-card";
import type { PublicProduct } from "@/lib/api/routes/products";
import {
  getCurrencyPrefix,
  getProductCategoryLabel,
  getProductImages,
  getProductStartingPrice,
} from "@/lib/products";

export function ProductGrid({ products }: { products: PublicProduct[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          images={getProductImages(product)}
          category={getProductCategoryLabel(product)}
          name={product.name}
          price={getProductStartingPrice(product)}
          currency={getCurrencyPrefix(product.currency)}
          className="max-w-none"
        />
      ))}
    </div>
  );
}

export default ProductGrid;
