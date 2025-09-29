import { UUID } from "crypto";

export interface Customer {
  id: UUID;
  name: string;
  email: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
  repeat_customer: "returning" | "new";
}

export interface CustomerQuery {
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface Address {
  id: UUID;
  full_address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}
