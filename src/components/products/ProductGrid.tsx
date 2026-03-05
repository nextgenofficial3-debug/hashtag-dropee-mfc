import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const ProductGrid: React.FC = () => {
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredProducts = products?.filter(product => {
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="py-20 relative">
      {/* Background ambient effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ opacity: [0.02, 0.04, 0.02] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-1/4 top-1/3 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
      </div>

      <div className="container relative z-10">
        {/* Section Header with gold accent */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold">
            Our <span className="text-gradient-gold">Best Sellers</span>
          </h2>
          <div className="mt-3 h-0.5 w-16 mx-auto rounded-full" style={{ background: 'linear-gradient(to right, transparent, hsl(var(--brand-gold)), transparent)' }} />
          <p className="text-muted-foreground mt-4 max-w-md mx-auto">
            Discover our selection of crispy, delicious fried chicken and sides
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.19, 1, 0.22, 1] }}
          className="mb-10 space-y-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
            <motion.div 
              className="relative flex-1 max-w-lg mx-auto w-full"
              animate={{
                boxShadow: isSearchFocused 
                  ? '0 0 0 2px hsl(var(--brand-gold) / 0.2), 0 10px 40px -10px hsl(var(--brand-gold) / 0.15)'
                  : '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              style={{ borderRadius: '0.75rem' }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                animate={{ x: isSearchFocused ? -4 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </motion.div>
              <Input
                placeholder="Search our menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="pl-11 h-12 text-base border-2 transition-all duration-300 bg-card/80 backdrop-blur-sm"
              />
            </motion.div>
          </div>

          {/* Category Filters */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap gap-2 justify-center"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="transition-all duration-300 shadow-sm"
              >
                All Items
              </Button>
            </motion.div>
            {categories?.map((category, index) => (
              <motion.div 
                key={category.id} 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (index + 1) * 0.1 }}
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="transition-all duration-300 shadow-sm relative overflow-hidden"
                >
                  {category.name}
                  {selectedCategory === category.id && (
                    <motion.div
                      layoutId="categoryUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-foreground"
                      transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
                    />
                  )}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Products Grid */}
        {productsLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div 
                key={i} 
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </motion.div>
            ))}
          </div>
        ) : filteredProducts?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="text-7xl mb-6"
            >
              🔍
            </motion.div>
            <h3 className="text-2xl font-semibold">No products found</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              Try adjusting your search or filters to find what you're looking for
            </p>
            <Button 
              variant="outline" 
              className="mt-6"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
            >
              Clear Filters
            </Button>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts?.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;
