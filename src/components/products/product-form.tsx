"use client";

import { useState, type FormEvent } from "react";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Category, CreateProductPayload } from "@/lib/types";

export interface ProductFormValues {
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
}

interface ProductFormProps {
  categories: Category[];
  initialValues?: Partial<ProductFormValues>;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (payload: CreateProductPayload) => Promise<void> | void;
}

export function ProductForm({ categories, initialValues, submitLabel, isSubmitting, onSubmit }: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>({
    name: initialValues?.name ?? "",
    description: initialValues?.description ?? "",
    price: initialValues?.price ?? "",
    stock: initialValues?.stock ?? "0",
    categoryId: initialValues?.categoryId ?? categories[0]?.id ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormValues, string>>>({});

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (values.name.trim().length < 2 || values.name.trim().length > 150) {
      next.name = "Name must be 2-150 characters";
    }
    if (!values.description.trim()) {
      next.description = "Description is required";
    }
    const price = parseFloat(values.price);
    if (Number.isNaN(price) || price <= 0) {
      next.price = "Price must be a positive number";
    }
    const stock = parseInt(values.stock, 10);
    if (Number.isNaN(stock) || stock < 0) {
      next.stock = "Stock must be 0 or greater";
    }
    if (!values.categoryId) {
      next.categoryId = "Choose a category";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      name: values.name.trim(),
      description: values.description.trim(),
      price: parseFloat(values.price),
      stock: parseInt(values.stock, 10),
      categoryId: values.categoryId,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        id="name"
        label="Product name"
        value={values.name}
        onChange={(e) => update("name", e.target.value)}
        error={errors.name}
        placeholder="Wireless headphones"
      />
      <Textarea
        id="description"
        label="Description"
        value={values.description}
        onChange={(e) => update("description", e.target.value)}
        error={errors.description}
        placeholder="Describe the product..."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="price"
          label="Price (USD)"
          type="number"
          step="0.01"
          min="0"
          value={values.price}
          onChange={(e) => update("price", e.target.value)}
          error={errors.price}
          placeholder="49.99"
        />
        <Input
          id="stock"
          label="Stock"
          type="number"
          min="0"
          step="1"
          value={values.stock}
          onChange={(e) => update("stock", e.target.value)}
          error={errors.stock}
          placeholder="10"
        />
      </div>
      <Select
        id="categoryId"
        label="Category"
        value={values.categoryId}
        onChange={(e) => update("categoryId", e.target.value)}
        error={errors.categoryId}
      >
        {categories.length === 0 && <option value="">No categories available</option>}
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <Button type="submit" isLoading={isSubmitting} className="w-full" size="lg">
        {submitLabel}
      </Button>
    </form>
  );
}
