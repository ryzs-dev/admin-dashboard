// components/RevenueChart.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Order } from "@/types";
import { format, subDays, eachDayOfInterval } from "date-fns";

interface RevenueChartProps {
  orders: Order[];
}

export function RevenueChart({ orders }: RevenueChartProps) {
  // Generate data for the last 7 days
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const chartData = last7Days.map((date) => {
    const dayOrders = orders.filter((order) => {
      const orderDate = new Date(order.order_date);
      return orderDate.toDateString() === date.toDateString();
    });

    const revenue = dayOrders.reduce(
      (sum, order) => sum + parseFloat(order.total.toString()),
      0
    );

    return {
      date: format(date, "MMM dd"),
      revenue: revenue,
      orders: dayOrders.length,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
        <CardDescription>Daily revenue for the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              formatter={(value: number, name: string) => [
                name === "revenue" ? `RM ${value.toFixed(2)}` : value,
                name === "revenue" ? "Revenue" : "Orders",
              ]}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: "#2563eb" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
