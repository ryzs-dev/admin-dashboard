import { UUID } from "crypto";

export interface OrderTrackingInput {
  tracking_number: string;
  courier: string;
  status: "pending" | "shipped" | "delivered" | "returned";
}

export interface OrderTracking extends OrderTrackingInput {
  id: UUID;
  created_at: string;
  updated_at: string;
}
