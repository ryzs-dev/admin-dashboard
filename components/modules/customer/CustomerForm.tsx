"use client";

import { useEffect, useState } from "react";
import { CustomerInput } from "@/types/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type CustomerFormProps = {
  onSubmit: (customer: CustomerInput) => void;
  onCancel: () => void;
  mode?: "edit" | "add" | "delete";
  initialData?: CustomerInput;
};

export default function CustomerForm({ onSubmit, onCancel, mode = 'add', initialData }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerInput>(initialData || {
    name: "",
    phone_number: "",
    fb_name: "",
    repeat_customer: "new",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData(initialData);
    }
  }, [initialData, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      repeat_customer: value as "new" | "returning",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      if(mode === "edit") {
        onSubmit({...formData, id: initialData?.id});
      }else {
        onSubmit(formData);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === "delete") {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Delete Customer</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{initialData?.name}</span>? This action
            cannot be undone.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="cursor-pointer hover:bg-red-800"
            onClick={() => onSubmit({ id: initialData?.id } as CustomerInput)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">{mode === "edit" ? "Edit Customer" : "Add New Customer"}</h2>
        <p className="text-sm text-muted-foreground mt-1">{mode === "edit"
            ? "Update customer details and save changes"
            : "Enter customer details to add them to your database"}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name Field */}
        <div className="gap-2 flex">
          <div className="flex flex-col space-y-2 w-full">
            <Label htmlFor="name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
              />
          </div>

          <div className="flex flex-col space-y-2 w-full">
            <Label htmlFor="fb_name">
                Facebook Name
            </Label>
            <Input
              id="fb_name"
              type="text"
              name="fb_name"
              placeholder="john.doe"
              value={formData.fb_name || ''}
              onChange={handleChange}
              />
          </div>
        </div>

        {/* Phone Field */}
        <div className="space-y-2">
          <Label htmlFor="phone_number">
            Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone_number"
            type="tel"
            name="phone_number"
            placeholder="60123456789"
            value={formData.phone_number}
            onChange={handleChange}
            required
          />
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            name="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        {/* Customer Type Field */}
        <div className="space-y-2 w-full">
          <Label htmlFor="repeat_customer">Customer Type</Label>
          <Select value={formData.repeat_customer} onValueChange={handleSelectChange} >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select customer type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New Customer</SelectItem>
              <SelectItem value="returning">Returning Customer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.name.trim() || !formData.phone_number.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "edit" ? "Saving..." : "Adding..."}
              </>
            ) : mode === "add" ? (
              "Add Customer"
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}