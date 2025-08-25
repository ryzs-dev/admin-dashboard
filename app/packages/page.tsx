/* eslint-disable @typescript-eslint/no-explicit-any */
// app/packages/page.tsx - Packages Management Page
"use client";

import { useState } from "react";
import {
  usePackages,
  useProductsStats,
  createPackage,
  updatePackage,
  deletePackage,
  Package,
} from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package as PackageIcon,
  RefreshCw,
  Eye,
  EyeOff,
  Box,
} from "lucide-react";
import { format } from "date-fns";

export default function PackagesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "true" | "false">(
    "all"
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const pageSize = 20;

  // Fetch data
  const { packages, pagination, isLoading, isError, refresh } = usePackages({
    search: searchQuery.length >= 2 ? searchQuery : undefined,
    is_active: statusFilter === "all" ? undefined : statusFilter,
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  const { stats } = useProductsStats();

  // Form state
  const [formData, setFormData] = useState<Partial<Package>>({
    package_name: "",
    package_code: "",
    description: "",
    base_price: 0,
    is_active: true,
  });

  const handleCreatePackage = async () => {
    try {
      await createPackage(
        formData as Omit<Package, "id" | "created_at" | "updated_at">
      );
      setIsCreateDialogOpen(false);
      setFormData({
        package_name: "",
        package_code: "",
        description: "",
        base_price: 0,
        is_active: true,
      });
      refresh();
    } catch (error) {
      console.error("Failed to create package:", error);
      alert(
        error instanceof Error ? error.message : "Failed to create package"
      );
    }
  };

  const handleEditPackage = async () => {
    if (!selectedPackage?.id) return;

    try {
      await updatePackage(selectedPackage.id, formData);
      setIsEditDialogOpen(false);
      setSelectedPackage(null);
      refresh();
    } catch (error) {
      console.error("Failed to update package:", error);
      alert(
        error instanceof Error ? error.message : "Failed to update package"
      );
    }
  };

  const handleDeletePackage = async (packageId: string | number) => {
    if (!confirm("Are you sure you want to deactivate this package?")) return;

    setIsDeleting(packageId.toString());
    try {
      await deletePackage(packageId, false); // Soft delete
      refresh();
    } catch (error) {
      console.error("Failed to delete package:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete package"
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const openEditDialog = (pkg: Package) => {
    setSelectedPackage(pkg);
    setFormData({
      package_name: pkg.package_name,
      package_code: pkg.package_code || "",
      description: pkg.description || "",
      base_price: pkg.base_price || 0,
      is_active: pkg.is_active ?? true,
    });
    setIsEditDialogOpen(true);
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "MYR 0.00";
    return `MYR ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return "Invalid Date";
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">
            ⚠️ Failed to load packages
          </div>
          <Button onClick={refresh}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Packages</h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage your product packages and bundles
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={refresh}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Package
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <Box className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">
                    Total Packages
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.packages.total}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">
                    Active Packages
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.packages.active}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <EyeOff className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">
                    Inactive Packages
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.packages.inactive}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search packages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter as any}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Packages Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Package Code</TableHead>
                <TableHead>Package Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p>Loading packages...</p>
                  </TableCell>
                </TableRow>
              ) : packages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <PackageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No packages found</p>
                  </TableCell>
                </TableRow>
              ) : (
                packages.map((pkg: Package) => (
                  <TableRow key={pkg.id} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-sm">
                      {pkg.package_code || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{pkg.package_name}</div>
                    </TableCell>
                    <TableCell>
                      {pkg.description ? (
                        <div className="text-sm text-gray-600 truncate max-w-xs">
                          {pkg.description}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(pkg.base_price)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          pkg.is_active
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100"
                        }
                      >
                        {pkg.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(pkg.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(pkg)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => pkg.id && handleDeletePackage(pkg.id)}
                          disabled={isDeleting === pkg.id?.toString()}
                        >
                          {isDeleting === pkg.id?.toString() ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination && pagination.total > pageSize && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {pagination.offset + 1}-
                  {Math.min(
                    pagination.offset + pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} packages
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage + 1} of{" "}
                    {Math.ceil(pagination.total / pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={
                      pagination.offset + pagination.limit >= pagination.total
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create Package Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Package</DialogTitle>
              <DialogDescription>
                Add a new package to your catalog
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Package Name *</label>
                <Input
                  placeholder="e.g., Skincare Starter Kit"
                  value={formData.package_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      package_name: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Package Code</label>
                <Input
                  placeholder="e.g., STARTER-KIT"
                  value={formData.package_code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      package_code: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Base Price (MYR)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.base_price}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      base_price: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Package description..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePackage}
                disabled={!formData.package_name}
              >
                Create Package
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Package Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Package</DialogTitle>
              <DialogDescription>Update package information</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Package Name *</label>
                <Input
                  value={formData.package_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      package_name: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Package Code</label>
                <Input
                  value={formData.package_code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      package_code: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Base Price (MYR)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      base_price: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active_edit"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                />
                <label htmlFor="is_active_edit" className="text-sm font-medium">
                  Active
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditPackage}
                disabled={!formData.package_name}
              >
                Update Package
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
