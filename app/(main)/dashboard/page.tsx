'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  useProductMonthlyTrends,
  useProductPerformance,
  useStats,
} from '@/hooks/useStats';
import { StatsCards } from '@/components/dashboard/StatsCard';
import {
  ProductPerformanceInsights,
  TopProductsTable,
} from '@/components/dashboard/ProductPerformance';
import { ProductDeepDive } from '@/components/dashboard/ProductDeepDive';
import { getCurrentMonthKey, parseMonthKey } from '@/lib/utils/date';
import { addMonths, format } from 'date-fns';

function findDefaultProductId(
  products: { product_id: string; product_name: string }[]
) {
  return (
    products.find((product) => /femrose|femlift/i.test(product.product_name))
      ?.product_id ??
    products[0]?.product_id ??
    null
  );
}

const CRMDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonthKey());
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const { stats, revenueChart, customerChart } = useStats(selectedMonth);
  const {
    products,
    isLoading: productsLoading,
  } = useProductPerformance(selectedMonth);
  const {
    trends,
    isLoading: trendsLoading,
  } = useProductMonthlyTrends(selectedProductId, selectedMonth);

  const currentDate = parseMonthKey(selectedMonth);

  const defaultProductId = useMemo(
    () => findDefaultProductId(products),
    [products]
  );

  useEffect(() => {
    if (!selectedProductId && defaultProductId) {
      setSelectedProductId(defaultProductId);
    }
  }, [defaultProductId, selectedProductId]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSelectedMonth(format(addMonths(currentDate, -1), 'yyyy-MM'))
              }
            >
              ←
            </Button>

            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              {format(currentDate, 'MMMM yyyy')}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSelectedMonth(format(addMonths(currentDate, 1), 'yyyy-MM'))
              }
            >
              →
            </Button>
          </div>
        </div>

        <StatsCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2563eb"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Acquisition</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={customerChart}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="new_customers" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <TopProductsTable products={products} isLoading={productsLoading} />
        <ProductPerformanceInsights
          products={products}
          isLoading={productsLoading}
        />
        <ProductDeepDive
          products={products}
          trends={trends}
          selectedProductId={selectedProductId}
          onProductChange={setSelectedProductId}
          isLoading={productsLoading || trendsLoading}
        />
      </div>
    </div>
  );
};

export default CRMDashboard;
