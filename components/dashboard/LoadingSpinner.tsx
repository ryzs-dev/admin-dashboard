import { RefreshCw } from "lucide-react";

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-gray-600">Loading dashboard data...</p>
    </div>
  );
}
