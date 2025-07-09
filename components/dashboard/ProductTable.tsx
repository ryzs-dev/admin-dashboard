import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ProductChartProps {
  productCounts?: {
    wash120ml: number;
    femlift30ml: number;
    femlift10ml: number;
    spray: number;
    wash30ml: number;
  };
}

export function ProductChart({ productCounts }: ProductChartProps) {
  const chartData = [
    { name: "Wash 120ml", count: productCounts?.wash120ml || 0 },
    { name: "Femlift 30ml", count: productCounts?.femlift30ml || 0 },
    { name: "Femlift 10ml", count: productCounts?.femlift10ml || 0 },
    { name: "Spray", count: productCounts?.spray || 0 },
    { name: "Wash 30ml", count: productCounts?.wash30ml || 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Sales</CardTitle>
        <CardDescription>Total units sold by product</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
