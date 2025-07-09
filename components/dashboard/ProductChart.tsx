// components/dashboard/ProductTable.tsx
import { Bar } from "react-chartjs-2";

export const ProductChart = ({
  productCounts,
}: {
  productCounts: Record<string, number>;
}) => {
  const labels = Object.keys(productCounts);
  const data = Object.values(productCounts);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Product Distribution</h2>
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: "Units Sold",
              data,
              backgroundColor: "#6366F1",
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: { display: false },
          },
        }}
      />
    </div>
  );
};
