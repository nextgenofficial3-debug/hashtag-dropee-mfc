import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/products/ProductCard';
import { Link } from 'react-router-dom';

const NewProductsSection: React.FC = () => {
  const { data: products } = useProducts();

  const newProducts = products
    ?.slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  if (!newProducts || newProducts.length === 0) return null;

  return (
    <section className="py-10 md:py-16 relative">
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-bold">
            New <span className="text-primary">Products</span>
          </h2>
          <div className="mt-2 h-0.5 w-12 mx-auto rounded-full bg-primary/50" />
          <p className="text-muted-foreground mt-3 max-w-md mx-auto text-sm">
            Check out our latest additions
          </p>
        </motion.div>

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {newProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center mt-8"
        >
          <Link to="/shop">
            <Button size="lg" className="font-bold gap-2">
              Go to Shop
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default NewProductsSection;
