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
    wash: number;
    femlift30ml: number;
    femlift10ml: number;
    bag: number;
  };
}

export function ProductChart({ productCounts }: ProductChartProps) {
  const chartData = [
    { name: "Wash", count: productCounts?.wash || 0 },
    { name: "Femlift 30ml", count: productCounts?.femlift30ml || 0 },
    { name: "Femlift 10ml", count: productCounts?.femlift10ml || 0 },
    { name: "Bag", count: productCounts?.bag || 0 },
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
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
