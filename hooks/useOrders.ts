// hooks/useOrders.ts
import { useEffect, useState } from "react";
import { Order } from "@/types";

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setIsLoading(true);
        const res = await fetch(
          "https://messenger-order-automation-production.up.railway.app/api/orders"
        );
        const json = await res.json();

        console.log(json);
        if (json.success) {
          setOrders(json.data);
        } else {
          setIsError(true);
        }
      } catch (err) {
        console.error("❌ Failed to fetch orders:", err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, []);

  return { orders, isLoading, isError };
}
