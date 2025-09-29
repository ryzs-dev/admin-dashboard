import React, { useState } from "react";
import { Truck, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderTrackingInput } from "./types";
import { Order } from "../order/types";

const carriers = [
  { value: "dhl", label: "DHL Express" },
  { value: "fedex", label: "FedEx" },
  { value: "ups", label: "UPS" },
  { value: "posmalaysia", label: "Pos Malaysia" },
  { value: "jnt", label: "J&T Express" },
  { value: "citylink", label: "City-Link Express" },
  { value: "gdex", label: "GDex" },
  { value: "aramex", label: "Aramex" },
  { value: "ninja", label: "Ninja Van" },
  { value: "flash", label: "Flash Express" },
  { value: "other", label: "Other" },
];

const trackingStatuses = [
  {
    value: "label_created",
    label: "Label Created",
    color: "bg-gray-100 text-gray-800",
  },
  { value: "pending", label: "Pending", color: "bg-red-100 text-red-800" },
  {
    value: "picked_up",
    label: "Picked Up",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "in_transit",
    label: "In Transit",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "out_for_delivery",
    label: "Out for Delivery",
    color: "bg-orange-100 text-orange-800",
  },
  {
    value: "delivered",
    label: "Delivered",
    color: "bg-green-100 text-green-800",
  },
];

interface AddTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OrderTrackingInput) => Promise<void>;
  order: Order;
}

export default function AddTrackingModal({
  isOpen,
  onClose,
  onSubmit,
  order,
}: AddTrackingModalProps) {
  const [formData, setFormData] = useState({
    tracking_number: "",
    courier: "",
    status: "pending",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.tracking_number) {
      newErrors.tracking_number = "Tracking number is required";
    }

    if (!formData.courier) {
      newErrors.courier = "Please select a carrier";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const trackingData = {
        tracking_number: formData.tracking_number.trim().toUpperCase(),
        courier:
          formData.courier === "other"
            ? formData.courier.trim()
            : carriers.find((c) => c.value === formData.courier)?.label ||
              formData.courier,
        status: (formData.status || "pending") as
          | "delivered"
          | "pending"
          | "shipped"
          | "returned",
      };

      await onSubmit(trackingData);
      handleClose();
    } catch (error) {
      console.error("Error adding tracking:", error);
      setErrors({ submit: "Failed to add tracking. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      tracking_number: "",
      courier: "",
      status: "pending",
    });
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Add Shipping Tracking
          </DialogTitle>
          <DialogDescription>
            Add tracking information for order {order.id} (
            {order.customers?.name})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Tracking Number */}
          <div className="space-y-2">
            <Label htmlFor="trackingNumber">
              Tracking Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="trackingNumber"
              placeholder="Enter tracking number (e.g., 1234567890)"
              value={formData.tracking_number}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  tracking_number: e.target.value,
                }));
                if (errors.tracking_number) {
                  setErrors((prev) => ({ ...prev, tracking_number: "" }));
                }
              }}
              className={errors.tracking_number ? "border-red-500" : ""}
            />
            {errors.tracking_number && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.tracking_number}
              </p>
            )}
          </div>

          {/* Carrier Selection */}
          <div className="space-y-2">
            <Label htmlFor="carrier">
              Shipping Carrier <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.courier}
              onValueChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  courier: value,
                  customCourier: "",
                }));
                if (errors.courier) {
                  setErrors((prev) => ({ ...prev, courier: "" }));
                }
              }}
            >
              <SelectTrigger className={errors.courier ? "border-red-500" : ""}>
                <SelectValue placeholder="Select shipping courier" />
              </SelectTrigger>
              <SelectContent>
                {carriers.map((courier) => (
                  <SelectItem key={courier.value} value={courier.value}>
                    <div className="flex items-center gap-2">
                      <span>{courier.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.courier && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.courier}
              </p>
            )}
          </div>

          {/* Custom Carrier Name (if Other is selected) */}
          {formData.courier === "other" && (
            <div className="space-y-2">
              <Label htmlFor="customCarrier">
                Carrier Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customCarrier"
                placeholder="Enter carrier name"
                value={formData.courier}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, courier: e.target.value }));
                  if (errors.courier) {
                    setErrors((prev) => ({ ...prev, courier: "" }));
                  }
                }}
                className={errors.courier ? "border-red-500" : ""}
              />
              {errors.courier && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.courier}
                </p>
              )}
            </div>
          )}

          {/* Initial Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Initial Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {trackingStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          status.color.split(" ")[0]
                        }`}
                      />
                      <span>{status.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes (Optional) */}
          {/* <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="Add any additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div> */}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Adding...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Add Tracking
              </>
            )}
          </Button>
        </DialogFooter>

        {/* Submit Error */}
        {errors.submit && (
          <div className="rounded-lg bg-red-50 p-3 mt-4">
            <p className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {errors.submit}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
