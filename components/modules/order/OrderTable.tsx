import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Order } from "./types";
import { useRouter } from "next/navigation";

export default function OrderTable({ orders }: { orders: Order[] }) {
  const router = useRouter();
  return (
    <Table className="w-full">
      <TableHeader>
        <TableRow className="border-b text-left font-medium gap-4 bg-slate-200">
          <TableCell>Order</TableCell>
          <TableCell>Date</TableCell>
          <TableCell>Customer</TableCell>
          <TableCell>Tracking Number</TableCell>
          <TableCell>Payment Status</TableCell>
          <TableCell>Order Total</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order: Order) => (
          <TableRow
            key={order.id}
            className="border-b font-medium text-left hover:cursor-pointer hover:bg-gray-100 gap-4"
            onClick={() => router.push(`/orders/${order.id}`)}
          >
            <TableCell>#{order.id}</TableCell>
            <TableCell>
              {new Date(order.order_date).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <div className="flex flex-col justify-center text-sm text-muted-foreground">
                <span className="text-black">{order.customers?.name}</span>
                {order.customers?.email}
              </div>
            </TableCell>
            <TableCell>
              {order.order_tracking && order.order_tracking.length > 0 ? (
                <div className="flex flex-col">
                  <div className="font-medium">
                    {order.order_tracking[0].tracking_number}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.order_tracking[0].courier}
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>{order.status}</TableCell>
            <TableCell>MYR {order.total_amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
