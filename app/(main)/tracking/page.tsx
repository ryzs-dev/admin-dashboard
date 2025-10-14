"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useOrders } from "@/hooks/useApi";
import { Order } from "@/types";

export default function WhatsAppDashboard() {
  const { orders: initialOrders } = useOrders();
  const [orders, setOrders] = useState<Order[]>(initialOrders || []);
  const [loading, setLoading] = useState(false);

  const handleSend = async (order: Order) => {
    if (!order.phone || !order.trackingNumber || !order.courierCompany) {
      toast.error("Phone, courier & tracking number are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Sent to ${order.phone}`);
      } else {
        toast.error(data.message || "Failed to send.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error sending message");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = (
    index: number,
    field: keyof Order,
    value: string
  ) => {
    const updated = [...orders];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setOrders(updated);
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-6">
      {orders.map((order, index) => (
        <Card key={order.order_id}>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">{order.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Phone Number</Label>
                <Input value={order.phone} disabled className="bg-gray-100" />
              </div>
              <div>
                <Label>Courier</Label>
                <Input
                  placeholder="J&T, Poslaju..."
                  value={order.courierCompany || ""}
                  onChange={(e) =>
                    handleUpdateField(index, "courierCompany", e.target.value)
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label>Tracking Number</Label>
                <Input
                  placeholder="TRK123456..."
                  value={order.trackingNumber || ""}
                  onChange={(e) =>
                    handleUpdateField(index, "trackingNumber", e.target.value)
                  }
                />
              </div>
            </div>

            <Button
              onClick={() => handleSend(order)}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Sending..." : "Send via WhatsApp"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
