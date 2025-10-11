'use client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { useParcelDaily } from '@/hooks/useParcelDaily';
import { Calendar, Clock, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ParcelDailyPage() {
  const { data: creditData } = useParcelDaily();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
            <Badge variant="outline" className="capitalize">
              {creditData.topupPackage}
            </Badge>
          </div>
          <CardTitle className="text-5xl font-bold text-gray-900">
            RM{creditData.credit}
          </CardTitle>
          <CardDescription className="text-base">
            Available Credit Balance
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 pb-4 border-b">
            <Package className="w-5 h-5 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Package Type</p>
              <p className="text-base font-semibold text-gray-900 capitalize">
                {creditData.topupPackage}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 pb-4 border-b">
            <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Expires In</p>
              <p className="text-base font-semibold text-gray-900">
                {creditData.expiresIn} days
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Valid for {creditData.packageValidDays} days total
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Purchased On</p>
              <p className="text-base font-semibold text-gray-900">
                {creditData.packageBoughtAt}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
