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
import { MapPin, Package2, Banknote, User, Truck } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { COURIER_SERVICES } from './constants';
import { Switch } from '@/components/ui/switch';
import { UUID } from 'crypto';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { createParcelDailyShipment } from '@/lib/api/parcel-daily';

interface CreateShipmentDialogProps {
  order: Order;
  contentValue: number;
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function CreateShipmentDialog({
  order,
  contentValue,
  isOpen,
  onOpenChange,
}: CreateShipmentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [codEnabled, setCodEnabled] = useState(false);
  const [cod, setCod] = useState<number | undefined>(contentValue);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'dropoff'>(
    'pickup'
  );
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
      kg: 0.5,
      price: 0,
      cod: codEnabled ? cod : undefined,
      content: order.shipment_description || '',
      content_value: contentValue,
      isDropoff: deliveryType === 'dropoff',
    };

    try {
      const data = await createParcelDailyShipment(payload, order.id as UUID);
      console.log(data);
      toast.success(`Shipment created`);
      setIsLoading(false);
      onOpenChange?.(false);
    } catch (err: any) {
      console.error(err);

      const message =
        err?.response?.data?.details?.details.message ||
        'Failed to create shipment';

      toast.error(message);

      setIsLoading(false);
      onOpenChange?.(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        aria-description="create-new-shipment"
        className="sm:max-w-3xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          if (isLoading) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isLoading) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Create New Shipment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="flex flex-col gap-5">
            {/* Recipient Information Card */}
            <div className="rounded-lg border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-primary" />

                <h3 className="font-semibold">Recipient Information</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Name</p>
                  <p className="font-medium">{order.customers?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Phone Number
                  </p>
                  <p className="font-medium">{order.customers?.phone_number}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Email</p>
                  <p className="font-medium text-sm">
                    {order.customers?.email || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="rounded-lg border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-primary" />

                <h3 className="font-semibold">Delivery Address</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm leading-relaxed">
                  {order.addresses?.full_address}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.addresses?.postcode} {order.addresses?.city},{' '}
                  {order.addresses?.state}
                </p>
                <p className="text-sm font-medium">
                  {order.addresses?.country}
                </p>
              </div>
            </div>
          </div>
          {/* Shipment Configuration */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left: Courier & Delivery */}
            <div className="space-y-5 flex">
              <div className="rounded-lg border bg-card p-5 space-y-4 w-full">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">Courier Selection</h3>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Choose Courier
                  </Label>
                  <Select
                    value={selectedCourier}
                    onValueChange={setSelectedCourier}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full p-2 ">
                      <SelectValue placeholder="Select courier" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCouriers.map((courier) => (
                        <SelectItem key={courier.value} value={courier.value}>
                          <div className="flex items-center gap-4">
                            <Image
                              src={courier.logo}
                              alt={courier.label}
                              width={64}
                              height={64}
                              className="rounded-sm"
                            />

                            {/* <span className="text-lg">{courier.logo}</span> */}
                            <span>{courier.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">
                    Delivery Method
                  </Label>
                  <RadioGroup
                    value={deliveryType}
                    onValueChange={(value: 'pickup' | 'dropoff') =>
                      setDeliveryType(value)
                    }
                    disabled={isLoading}
                  >
                    <div className="space-y-2">
                      <label
                        htmlFor="pickup"
                        className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                          deliveryType === 'pickup'
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        }`}
                      >
                        <RadioGroupItem value="pickup" id="pickup" />
                        <div>
                          <div className="font-medium text-sm">Pick Up</div>
                        </div>
                      </label>
                      <label
                        htmlFor="dropoff"
                        className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                          deliveryType === 'dropoff'
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        }`}
                      >
                        <RadioGroupItem value="dropoff" id="dropoff" />
                        <div>
                          <div className="font-medium text-sm">Drop-off</div>
                        </div>
                      </label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            {/* Right: Package & Payment */}
            <div className="space-y-5 flex flex-col">
              <div className="rounded-lg border bg-card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Package2 className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">Package Details</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                      Shipment Description
                    </span>
                    <span className="text-sm font-medium">
                      {order.shipment_description || '-'}
                    </span>
                  </div>

                  <div className="flex justify-between py-2">
                    <span className="text-sm text-muted-foreground">Value</span>
                    <span className="text-sm font-medium">
                      RM {contentValue}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">Cash on Delivery</h3>
                  </div>
                  <Switch
                    id="cod-toggle"
                    checked={codEnabled}
                    onCheckedChange={setCodEnabled}
                    disabled={isLoading}
                  />
                </div>

                {codEnabled && (
                  <div className="space-y-2 pt-2">
                    <Label
                      htmlFor="cod-amount"
                      className="text-xs text-muted-foreground"
                    >
                      Collection Amount
                    </Label>
                    <Input
                      id="cod-amount"
                      type="number"
                      value={cod}
                      onChange={(e) => setCod(Number(e.target.value))}
                      placeholder="0.00"
                      className="h-11"
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4">
          <Button
            variant="outline"
            disabled={isLoading}
            className="min-w-24"
            onClick={() => onOpenChange?.(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateShipment}
            disabled={isLoading}
            className="min-w-32"
          >
            {isLoading ? 'Creating...' : 'Create Shipment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
