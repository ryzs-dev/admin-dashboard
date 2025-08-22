import { NextResponse } from "next/server";

export async function GET() {
  const mockOrders = [
    {
      id: "1",
      name: "Alice Tan",
      phoneNumber: "60123456789",
      courier: "",
      trackingNumber: "",
    },
    {
      id: "2",
      name: "Benjamin Lee",
      phoneNumber: "60112233445",
      courier: "",
      trackingNumber: "",
    },
    {
      id: "3",
      name: "Carmen Chong",
      phoneNumber: "60195553311",
      courier: "",
      trackingNumber: "",
    },
  ];

  return NextResponse.json({ orders: mockOrders });
}
