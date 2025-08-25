// app/customers/page.tsx - Customers Management Page
"use client";

import { useState } from "react";
import { 
  useCustomers, 
  useCustomerStats,
  updateCustomer,
  addCustomerAddress,
  Customer
} from "@/hooks/useCustomers";
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
  Users, 
  Search, 
  RefreshCw,
  Eye,
  Edit,
  Phone,    
  MapPin,
  ShoppingBag
} from "lucide-react";
import { format } from "date-fns";

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'all' | 'new' | 'repeat'>('all');
  const [sortBy, setSortBy] = useState<'customer_name' | 'created_at' | 'last_order_date' | 'total_spent'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);

  const pageSize = 25;

  // Fetch data
  const { 
    customers, 
    pagination,
    isLoading, 
    isError,
    refresh 
  } = useCustomers({
    search: searchQuery.length >= 2 ? searchQuery : undefined,
    customer_type: customerTypeFilter,
    sort_by: sortBy,
    sort_order: sortOrder,
    limit: pageSize,
    offset: currentPage * pageSize
  });

  const { stats } = useCustomerStats();

  // Form states
  const [editFormData, setEditFormData] = useState<Partial<Customer>>({});
  const [addressFormData, setAddressFormData] = useState({
    address_line_1: '',
    address_line_2: '',
    city: '',
    postcode: '',
    state: '',
    address_type: 'shipping' as 'shipping' | 'billing' | 'both',
    is_default: false
  });

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'MYR 0.00';
    return `MYR ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  const getCustomerTypeBadge = (type?: string) => {
    switch (type) {
      case 'repeat':
        return <Badge className="bg-blue-100 text-blue-800">Repeat</Badge>;
      case 'new':
        return <Badge className="bg-green-100 text-green-800">New</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const openViewDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditFormData({
      customer_name: customer.customer_name,
      phone_number: customer.phone_number,
      fb_name: customer.fb_name || '',
      email: customer.email || '',
      customer_type: customer.customer_type,
      notes: customer.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const openAddAddressDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setAddressFormData({
      address_line_1: '',
      address_line_2: '',
      city: '',
      postcode: '',
      state: '',
      address_type: 'shipping',
      is_default: false
    });
    setIsAddAddressOpen(true);
  };

  const handleEditCustomer = async () => {
    if (!selectedCustomer?.id) return;
    
    try {
      await updateCustomer(selectedCustomer.id, editFormData);
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      refresh();
    } catch (error) {
      console.error('Failed to update customer:', error);
      alert(error instanceof Error ? error.message : 'Failed to update customer');
    }
  };

  const handleAddAddress = async () => {
    if (!selectedCustomer?.id) return;
    
    try {
      await addCustomerAddress(selectedCustomer.id, addressFormData);
      setIsAddAddressOpen(false);
      setSelectedCustomer(null);
      refresh();
    } catch (error) {
      console.error('Failed to add address:', error);
      alert(error instanceof Error ? error.message : 'Failed to add address');
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">⚠️ Failed to load customers</div>
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
              <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage your customer database and relationships
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                onClick={refresh} 
                variant="outline" 
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averages.spendingPerCustomer)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Customer Type Filter */}
            <div>
              <Select value={customerTypeFilter} onValueChange={setCustomerTypeFilter as any}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="new">New Customers</SelectItem>
                  <SelectItem value="repeat">Repeat Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div>
              <Select value={sortBy} onValueChange={setSortBy as any}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer_name">Name</SelectItem>
                  <SelectItem value="created_at">Date Added</SelectItem>
                  <SelectItem value="last_order_date">Last Order</SelectItem>
                  <SelectItem value="total_spent">Total Spent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div>
              <Select value={sortOrder} onValueChange={setSortOrder as any}>
                <SelectTrigger>
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Total Orders</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead>Last Order</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p>Loading customers...</p>
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No customers found</p>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer: Customer) => (
                  <TableRow key={customer.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.customer_name}</div>
                        {customer.fb_name && (
                          <div className="text-sm text-gray-500">FB: {customer.fb_name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {customer.phone_number && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1" />
                            {customer.phone_number}
                          </div>
                        )}
                        {customer.email && (
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getCustomerTypeBadge(customer.customer_type)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <ShoppingBag className="h-4 w-4 mr-1 text-gray-400" />
                        {customer.total_orders || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(customer.total_spent)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(customer.last_order_date)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(customer.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewDialog(customer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAddAddressDialog(customer)}
                        >
                          <MapPin className="h-4 w-4" />
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
                  Showing {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} customers
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
                    Page {currentPage + 1} of {Math.ceil(pagination.total / pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={pagination.offset + pagination.limit >= pagination.total}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* View Customer Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
            </DialogHeader>
            
            {selectedCustomer && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-sm">{selectedCustomer.customer_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-sm">{selectedCustomer.phone_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Facebook Name</label>
                    <p className="text-sm">{selectedCustomer.fb_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm">{selectedCustomer.email || 'N/A'}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedCustomer.total_orders || 0}</p>
                    <p className="text-sm text-gray-500">Total Orders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedCustomer.total_spent)}</p>
                    <p className="text-sm text-gray-500">Total Spent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(selectedCustomer.average_order_value)}</p>
                    <p className="text-sm text-gray-500">Avg Order Value</p>
                  </div>
                </div>

                {/* Addresses */}
                {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Addresses</h4>
                    <div className="space-y-2">
                      {selectedCustomer.addresses.map((address, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded border text-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{address.address_line_1}</p>
                              {address.address_line_2 && <p>{address.address_line_2}</p>}
                              <p className="text-gray-600">
                                {[address.city, address.postcode, address.state].filter(Boolean).join(', ')}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {address.is_default && <Badge variant="outline">Default</Badge>}
                              <Badge variant="outline">{address.address_type}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Orders */}
                {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recent Orders</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedCustomer.orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                          <div>
                            <p className="font-medium">{order.order_number || `#${order.id}`}</p>
                            <p className="text-gray-600">{formatDate(order.order_date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                            <Badge variant="outline" className="text-xs">{order.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Customer Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Customer Name *</label>
                <Input
                  value={editFormData.customer_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  value={editFormData.phone_number}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Facebook Name</label>
                <Input
                  value={editFormData.fb_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, fb_name: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Customer Type</label>
                <Select 
                  value={editFormData.customer_type} 
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, customer_type: value as 'new' | 'repeat' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New Customer</SelectItem>
                    <SelectItem value="repeat">Repeat Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={editFormData.notes}
                  onChange={(e: { target: { value: any; }; }) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleEditCustomer}
                disabled={!editFormData.customer_name}
              >
                Update Customer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Address Dialog */}
        <Dialog open={isAddAddressOpen} onOpenChange={setIsAddAddressOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Address</DialogTitle>
              <DialogDescription>
                Add a new address for {selectedCustomer?.customer_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Address Line 1 *</label>
                <Input
                  value={addressFormData.address_line_1}
                  onChange={(e) => setAddressFormData(prev => ({ ...prev, address_line_1: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Address Line 2</label>
                <Input
                  value={addressFormData.address_line_2}
                  onChange={(e) => setAddressFormData(prev => ({ ...prev, address_line_2: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">City</label>
                  <Input
                    value={addressFormData.city}
                    onChange={(e) => setAddressFormData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Postcode</label>
                  <Input
                    value={addressFormData.postcode}
                    onChange={(e) => setAddressFormData(prev => ({ ...prev, postcode: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">State</label>
                <Input
                  value={addressFormData.state}
                  onChange={(e) => setAddressFormData(prev => ({ ...prev, state: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Address Type</label>
                <Select 
                  value={addressFormData.address_type} 
                  onValueChange={(value) => setAddressFormData(prev => ({ ...prev, address_type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shipping">Shipping</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={addressFormData.is_default}
                  onChange={(e) => setAddressFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                />
                <label htmlFor="is_default" className="text-sm font-medium">
                  Set as default address
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddAddressOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddAddress}
                disabled={!addressFormData.address_line_1}
              >
                Add Address
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
