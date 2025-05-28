import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Phone } from "lucide-react";
import { Order } from "@/types";
import { format } from "date-fns";

interface OrdersTableProps {
  orders: Order[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const getPaymentBadge = (method: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      COD: "default",
      Online: "secondary",
      Card: "outline",
    };
    return variants[method] || "default";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Orders</CardTitle>
        <CardDescription>
          Manage and view all orders from your automation system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No orders found. Orders will appear here once your
                    automation processes them.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.orderNumber}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-medium">#{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.fbName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="h-3 w-3 mr-1" />
                          {order.phoneNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.wash > 0 && <div>Wash: {order.wash}x</div>}
                        {order.femlift30ml > 0 && (
                          <div>Femlift 30ml: {order.femlift30ml}x</div>
                        )}
                        {order.femlift10ml > 0 && (
                          <div>Femlift 10ml: {order.femlift10ml}x</div>
                        )}
                        {order.bag > 0 && <div>Bag: {order.bag}x</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPaymentBadge(order.paymentMethod)}>
                        {order.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      RM {order.total}
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.orderDate), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
