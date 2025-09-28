import { UUID } from "crypto";

export interface Product {
    id: UUID;
    name: string;
    price: number;
}