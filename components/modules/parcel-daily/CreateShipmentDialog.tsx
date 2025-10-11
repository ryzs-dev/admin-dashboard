'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Order } from '../order/types';
import { ShipmentInput } from './types';
import { Label } from '@/components/ui/label';
import { DollarSign, MapPin, Package, Truck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { COURIER_SERVICES } from './constants';
import { Switch } from '@/components/ui/switch';
import { UUID } from 'crypto';

interface CreateShipmentDialogProps {
  order: Order;
  contentValue: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (trackingNumber: string) => void;
  createParcelDailyShipment?: (
    shipmentData: ShipmentInput,
    orderId: UUID
  ) => Promise<unknown>;
}

export default function CreateShipmentDialog({
  order,
  contentValue,
  isOpen,
  onClose,
  createParcelDailyShipment,
}: CreateShipmentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [codEnabled, setCodEnabled] = useState(false);
  const [cod, setCod] = useState<number | undefined>(contentValue);

  const country = order.addresses?.country;

  const availableCouriers = useMemo(() => {
    return country === 'Singapore'
      ? COURIER_SERVICES.Singapore
      : COURIER_SERVICES.Malaysia;
  }, [country]);

  const [selectedCourier, setSelectedCourier] = useState(
    availableCouriers[0]?.value
  );

  const handleCreateShipment = async () => {
    setIsLoading(true);

    const payload: ShipmentInput = {
      serviceProvider: selectedCourier,
      clientAddress: {
        fullName: order.customers?.name || '',
        countryCode: order.customers?.phone_number.startsWith('+65')
          ? '+65'
          : '+60',
        phone: order.customers?.phone_number || '',
        email: order.customers?.email || '',
        line1: order.addresses?.full_address || '',
        line2: '',
        city: order.addresses?.city || '',
        postcode: order.addresses?.postcode || '',
        state: order.addresses?.state || '',
        country:
          order.addresses?.country === 'Singapore' ? 'Singapore' : 'Malaysia',
      },
      kg: 0.5, // fixed
      price: 0, // backend can calculate or you can pass if available
      cod: codEnabled ? cod : undefined,
      content: 'Feminine Products',
      content_value: contentValue,
      isDropoff: false,
    };

    try {
      await createParcelDailyShipment?.(payload, order.id);
      toast.success(`Shipment created`);
      //   onSuccess?.(data.tracking_number);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create shipment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Create Shipment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Courier Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Courier Service</Label>
            </div>
            <RadioGroup
              value={selectedCourier}
              onValueChange={setSelectedCourier}
            >
              <div className="grid gap-3">
                {availableCouriers.map((courier) => (
                  <div
                    key={courier.value}
                    className="flex items-center space-x-3"
                  >
                    <RadioGroupItem value={courier.value} id={courier.value} />
                    <Label
                      htmlFor={courier.value}
                      className="flex items-center gap-2 cursor-pointer text-base font-normal"
                    >
                      <span className="text-xl">{courier.icon}</span>
                      {courier.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Recipient Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Delivery Details</Label>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Recipient</p>
                <p className="font-medium">{order.customers?.name}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="text-sm leading-relaxed">
                  {order.addresses?.full_address}
                </p>
                <p className="text-sm leading-relaxed">
                  {order.addresses?.postcode} {order.addresses?.country}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Package Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Package Information</Label>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Content</p>
                <p className="font-medium">Feminine Products</p>
              </div>
              <div>
                <p className="text-muted-foreground">Weight</p>
                <p className="font-medium">0.5 kg</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* COD Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <Label
                  htmlFor="cod-toggle"
                  className="text-sm font-medium cursor-pointer"
                >
                  Cash on Delivery (COD)
                </Label>
              </div>
              <Switch
                id="cod-toggle"
                checked={codEnabled}
                onCheckedChange={setCodEnabled}
              />
            </div>

            {codEnabled && (
              <div className="space-y-2">
                <Label htmlFor="cod-amount" className="text-sm">
                  COD Amount
                </Label>
                <Input
                  id="cod-amount"
                  type="number"
                  value={cod}
                  onChange={(e) => setCod(Number(e.target.value))}
                  placeholder="Enter amount"
                  className="text-base"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateShipment}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Creating...' : 'Create Shipment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
