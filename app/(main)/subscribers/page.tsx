import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscriberTable } from "@/components/subscribers/SubscriberTable";
import { FunnelGraph } from "@/components/subscribers/FunnelGraph";
import { Subscriber } from "@/types";

async function getSubscribers(): Promise<Subscriber[]> {
  try {
    const res = await fetch(
      `
      ${process.env.NEXT_PUBLIC_API_URL}/api/subscribers`,
      {
        cache: "no-store",
      }
    );

    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error("Failed to fetch subscribers:", err);
    return [];
  }
}

export default async function SubscriberPage() {
  const subscribers = await getSubscribers();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Subscribers</h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage your messenger subscribers
          </p>
        </div>

        <Tabs defaultValue="table" className="w-full">
          <TabsList className="bg-gray-100 rounded-md p-1 mb-4">
            <TabsTrigger
              value="table"
              className="px-4 py-2 text-gray-700 font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:rounded-md"
            >
              Table
            </TabsTrigger>
            <TabsTrigger
              value="funnel"
              className="px-4 py-2 text-gray-700 font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:rounded-md"
            >
              Funnel
            </TabsTrigger>
          </TabsList>
          <TabsContent value="table">
            <div className="bg-white rounded-md border border-gray-200">
              <SubscriberTable subscribers={subscribers} />
            </div>
          </TabsContent>
          <TabsContent value="funnel">
            <div className="bg-white rounded-md border border-gray-200 p-4">
              <FunnelGraph />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
