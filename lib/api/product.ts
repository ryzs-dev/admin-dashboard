
import { ProductInput } from "@/types/product";
import axios from "axios";
import { UUID } from "crypto";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/products`,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getAllProducts() {
    const {data} = await api.get("/");
    return data;
}

export async function getProductById(id: UUID) {
    const {data} = await api.get(`/${id}`);
    return data;
}

export async function createProduct(product: ProductInput) {
    const {data} = await api.post("/", product);
    return data;
}

export async function updateProduct(id: UUID, product: Partial<ProductInput>) {
    const {data} = await api.patch(`/${id}`, product);
    return data;
}

export async function deleteProduct(id: UUID) {
    const {data} = await api.delete(`/${id}`);
    return data;
}