"use client";

import CustomerForm from "@/components/modules/customer/CustomerForm";
import CustomerTable from "@/components/modules/customer/CustomerTable";
import { Customer } from "@/components/modules/customer/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomer } from "@/hooks/useCustomer";
import { CustomerInput } from "@/types/customer";
import { UUID } from "crypto";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function CustomersPage() {
  const limit = 25; // items per page
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "created_at">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const {
    customers,
    pagination,
    isLoading: loading,
    isError,
    createCustomer,
    refresh,
    deleteCustomer,
    updateCustomer,
  } = useCustomer({
    limit,
    offset: (page - 1) * limit,
  });
  const [modalState, setModalState] = useState<null | {
    mode: "add" | "edit" | "delete";
    customer?: Customer;
  }>(null);

  const handleAddCustomer = async (customerData: CustomerInput) => {
    try {
      await createCustomer(customerData);
      await refresh();
    } catch {
      // Handle error (e.g., show notification)
      // TODO: Implement toast notifications}
    } finally {
      setModalState(null);
    }
  };

  const handleEditCustomer = async (customerData: CustomerInput) => {
    try {
      await updateCustomer(modalState?.customer?.id as UUID, customerData);
      await refresh();
    } catch (error) {
      console.error("Error updating customer:", error);
      // TODO: Implement toast notifications
    } finally {
      setModalState(null);
    }
  };

  const handleDeleteCustomer = async (customerId: UUID) => {
    if (!customerId) return;
    try {
      await deleteCustomer(customerId);
      await refresh();
    } catch (error) {
      console.error("Error deleting customer:", error);
      // TODO: Implement toast notifications
    } finally {
      setModalState(null);
    }
  };

  // Filter customers based on search
  const filteredCustomers =
    customers?.filter((customer: Customer) => {
      if (!search.trim()) return true;
      const searchLower = search.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.phone_number?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower)
      );
    }) || [];

  // Sort filtered customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === "name") {
      const aName = a.name || "";
      const bName = b.name || "";
      return sortOrder === "asc"
        ? aName.localeCompare(bName)
        : bName.localeCompare(aName);
    } else {
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-600">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span>Loading customers...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 text-red-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-gray-900 font-medium mb-1">
            Error loading customers
          </h3>
          <p className="text-gray-500 text-sm">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No customers found
              </h3>
              <p className="text-gray-500">
                Start by adding your first customer to see them here
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = pagination ? Math.ceil(pagination.total / limit) : 1;
  const currentPage = page;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-gray-500 mt-1">
            {search.trim() ? (
              <>
                {sortedCustomers.length} of {customers.length} customers
                {search.trim() && (
                  <span className="ml-1">matching &quot;{search}&quot;</span>
                )}
              </>
            ) : (
              `${customers.length} total customers`
            )}
          </p>
        </div>

        {/* Search */}
        <div className="mb-6 flex justify-between items-center">
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md h-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
          />
          <Button
            className="ml-4 h-10 hover:bg-gray-700"
            onClick={() => setModalState({ mode: "add" })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Table */}
        <CustomerTable
          sortedCustomers={sortedCustomers}
          search={search}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(field: keyof Customer) => {
            if (sortBy === field) {
              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            } else {
              setSortBy(field as "name" | "created_at");
              setSortOrder("asc");
            }
          }}
          onEdit={(customerId) => {
            setModalState({
              mode: "edit",
              customer: customers.find(
                (c: { id: UUID }) => c.id === customerId
              ),
            });
          }}
          onDelete={(customerId) =>
            setModalState({
              mode: "delete",
              customer: customers.find(
                (c: { id: UUID }) => c.id === customerId
              ),
            })
          }
        />

        {/* Modal */}
        {modalState && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setModalState(null)}
              aria-hidden="true"
            />

            {/* Modal Container */}
            <div className="flex min-h-full items-center justify-center p-4">
              <div
                className="relative transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setModalState(null)}
                  className="absolute right-4 top-4 z-10 rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Close modal"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                {/* Modal Content */}
                <div className="px-6 py-6">
                  {modalState.mode === "add" && (
                    <CustomerForm
                      mode="add"
                      onSubmit={handleAddCustomer}
                      onCancel={() => setModalState(null)}
                    />
                  )}
                  {modalState.mode === "edit" && (
                    <CustomerForm
                      mode="edit"
                      initialData={modalState.customer ?? undefined}
                      onSubmit={handleEditCustomer}
                      onCancel={() => setModalState(null)}
                    />
                  )}
                  {modalState.mode === "delete" && (
                    <CustomerForm
                      mode="delete"
                      onSubmit={() =>
                        handleDeleteCustomer(modalState.customer?.id as UUID)
                      }
                      onCancel={() => setModalState(null)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
