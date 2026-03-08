import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Product } from '@/types/database';

const AdminProducts: React.FC = () => {
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { uploadMultipleImages, isUploading } = useImageUpload();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    in_stock: true,
    is_bestseller: false,
    is_spicy: false,
    images: [] as string[],
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: '',
      in_stock: true,
      is_bestseller: false,
      is_spicy: false,
      images: [],
    });
    setImageFiles([]);
    setSelectedProduct(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category_id: product.category_id || '',
      in_stock: product.in_stock,
      is_bestseller: (product as any).is_bestseller || false,
      is_spicy: (product as any).is_spicy || false,
      images: product.images || [],
    });
    setIsDialogOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    } else {
      setImageFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let uploadedUrls: string[] = [];
    if (imageFiles.length > 0) {
      uploadedUrls = await uploadMultipleImages(imageFiles);
    }

    const productData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      category_id: formData.category_id || null,
      in_stock: formData.in_stock,
      is_bestseller: formData.is_bestseller,
      is_spicy: formData.is_spicy,
      images: [...formData.images, ...uploadedUrls],
    };

    if (selectedProduct) {
      await updateProduct.mutateAsync({ id: selectedProduct.id, ...productData });
    } else {
      await createProduct.mutateAsync(productData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (selectedProduct) {
      await deleteProduct.mutateAsync(selectedProduct.id);
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
    }
  };

  return (
    <AdminSidebar>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground">Manage your menu items</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Products Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filteredProducts?.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden">
                  <div className="aspect-square bg-muted relative">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl">
                        🍗
                      </div>
                    )}
                    <Badge
                      variant={product.in_stock ? "default" : "destructive"}
                      className="absolute top-2 right-2"
                    >
                      {product.in_stock ? 'In Stock' : 'Out'}
                    </Badge>
                    {product.images && product.images.length > 1 && (
                      <Badge variant="secondary" className="absolute bottom-2 left-2 text-[10px]">
                        {product.images.length} photos
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {product.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-primary">₹{product.price}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setSelectedProduct(product);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {(!filteredProducts || filteredProducts.length === 0) && !isLoading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-lg font-semibold">No products found</h3>
            <p className="text-muted-foreground">Add your first product to get started</p>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription>
                {selectedProduct ? 'Update product details' : 'Add a new item to your menu'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Crispy Fried Chicken"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your product..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="99.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2 flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="in_stock">In Stock</Label>
                    <p className="text-sm text-muted-foreground">Is this product available?</p>
                  </div>
                  <Switch
                    id="in_stock"
                    checked={formData.in_stock}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, in_stock: checked }))}
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="is_bestseller">Best Seller</Label>
                    <p className="text-sm text-muted-foreground">Show a "Best Seller" badge</p>
                  </div>
                  <Switch
                    id="is_bestseller"
                    checked={formData.is_bestseller}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_bestseller: checked }))}
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="is_spicy">Spicy</Label>
                    <p className="text-sm text-muted-foreground">Show a "🌶 Spicy" badge</p>
                  </div>
                  <Switch
                    id="is_spicy"
                    checked={formData.is_spicy}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_spicy: checked }))}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label>Product Images</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {/* Existing images */}
                    {formData.images.map((url, index) => (
                      <div key={url} className="relative h-20 w-20">
                        <img src={url} alt="" className="h-full w-full rounded-md object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index, true)}
                          className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {/* New image files */}
                    {imageFiles.map((file, index) => (
                      <div key={index} className="relative h-20 w-20">
                        <img
                          src={URL.createObjectURL(file)}
                          alt=""
                          className="h-full w-full rounded-md object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index, false)}
                          className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {/* Upload button */}
                    <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-md border-2 border-dashed hover:border-primary">
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending || isUploading}>
                  {isUploading ? 'Uploading...' : selectedProduct ? 'Update Product' : 'Create Product'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminSidebar>
  );
};

export default AdminProducts;
