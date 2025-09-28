import { UUID } from "crypto";

export interface CustomerInput {
  id?: UUID;
  fb_name?:string;
  name: string;         // Name
  phone_number: string;
  repeat_customer: 'returning' | 'new';
  email?: string;
}