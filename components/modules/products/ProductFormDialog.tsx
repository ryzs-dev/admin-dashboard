"use client";

import {  useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductInput } from "@/types/product";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Product } from "./types";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";


type ProductFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductInput) => void;
  initialData?: Product;
  existingProducts?: Product[];
  trigger?: React.ReactNode;
};

// Must match the WhatsApp extractor, which reads "<qty><code>" (e.g. "2w1s")
// from the order's last line using /(\d+)([a-z]+(?:\d+ml)?)/.
const CODE_PATTERN = /^[a-z]+(\d+ml)?$/;

const EMPTY_FORM: ProductInput = { name: "", price: 0, code: "" };

export default function ProductForm({ onSubmit, onClose, isOpen, initialData, existingProducts = [], trigger }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
      if (initialData) {
        setFormData({
            name: initialData.name,
            price: initialData.price,
            code: initialData.code ?? "",
        });
      } else {
        resetForm();
      }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const code = formData.code.trim().toLowerCase();

    if (!formData.name) {
      newErrors.name = 'Product name is required';
    }
    if (formData.price < 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    if (!code) {
      newErrors.code = 'Code is required so WhatsApp orders can detect this product';
    } else if (!CODE_PATTERN.test(code)) {
      newErrors.code = 'Use letters only, optionally ending in a size like 30ml (e.g. w, rose, w30ml)';
    } else if (
      existingProducts.some(
        (product) => product.id !== initialData?.id && product.code?.toLowerCase() === code
      )
    ) {
      newErrors.code = 'Another product already uses this code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    try {
      if (!validateForm()) {
        return;
      }
      setIsSubmitting(true);
      onSubmit({ ...formData, code: formData.code.trim().toLowerCase() });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
      onClose();
    }

  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                {initialData ? "Edit Product" : "New Product"}
                </DialogTitle>
                <DialogDescription>
                {initialData
                    ? "Update product details and save changes"
                    : "Enter product details to add them to your database"}
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4 grid grid-cols-2 gap-4">
                    {/* Product Name */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="product_name">Name*</Label>
                        <Input
                            id="product_name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                    </div>

                    {/* Product Price */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="product_price">Price</Label>
                        <div className="flex w-full">
                        <Input
                            id="product_price"
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                        />
                        {errors.price && <p className="text-sm text-red-600">{errors.price}</p>}
                        </div>
                    </div>
                </div>

                {/* WhatsApp order code */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="product_code">WhatsApp code*</Label>
                    <Input
                        id="product_code"
                        type="text"
                        placeholder="e.g. w"
                        autoCapitalize="none"
                        autoComplete="off"
                        value={formData.code}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                        className="font-mono"
                    />
                    {errors.code ? (
                        <p className="text-sm text-red-600">{errors.code}</p>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            Staff type the quantity then this code on the last line of a WhatsApp order.
                            {formData.code.trim() && (
                                <> For example <span className="font-mono font-medium text-foreground">2{formData.code.trim().toLowerCase()}</span> means 2 × {formData.name || 'this product'}.</>
                            )}
                        </p>
                    )}
                </div>
            </form>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit}>
                    {initialData ? 'Update Product' : 'Create Product'}
                    {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}