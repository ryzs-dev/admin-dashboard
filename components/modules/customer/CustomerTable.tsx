import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Customer } from "./types";
import { ArrowDown, ArrowUp, PencilLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UUID } from "crypto";

type CustomerTableProps = {
    sortedCustomers: Customer[];
    search: string;
    sortBy: keyof Customer;
    sortOrder: "asc" | "desc";
    onSortChange: (field: keyof Customer) => void;
    onEdit: (customerId: UUID) => void;
    onDelete: (customerId: UUID) => void;  
}

export default function CustomerTable({ sortedCustomers, search, sortBy, sortOrder, onSortChange, onEdit, onDelete }: CustomerTableProps)
{
    return(
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Table >
            <TableHeader className="bg-gray-50 ">
              <TableRow className="border-b border-gray-200">
                <TableHead 
                  className="cursor-pointer text-gray-700 font-medium hover:text-gray-900 transition-colors py-4" 
                  onClick={() => onSortChange("name")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Name</span>
                    {sortBy === "name" && (
                      <span className="text-xs">{sortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4"/>}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-gray-700 font-medium py-4">Phone</TableHead>
                <TableHead className="text-gray-700 font-medium py-4">Email</TableHead>
                <TableHead className="text-gray-700 font-medium py-4">Type</TableHead>
                <TableHead 
                  className="cursor-pointer text-gray-700 font-medium hover:text-gray-900 transition-colors py-4" 
                  onClick={() => onSortChange("created_at")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Created</span>
                    {sortBy === "created_at" && (
                      <span className="text-xs">{sortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4"/>}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-gray-700 font-medium py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="text-gray-400">
                      {search.trim() ? (
                        <>
                          <div className="w-12 h-12 mx-auto mb-3">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <p className="text-gray-600 font-medium">No customers match your search</p>
                          <p className="text-sm mt-1">Try adjusting your search terms</p>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 mx-auto mb-3">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <p className="text-gray-600 font-medium">No customers found</p>
                          <p className="text-sm mt-1">Add your first customer to get started</p>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedCustomers.map((c: Customer) => (
                <TableRow key={c.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                  <TableCell className="py-4">
                    <div className="font-medium text-gray-900">{c.name}</div>
                  </TableCell>
                  <TableCell className="py-4 text-gray-600">{c.phone_number}</TableCell>
                  <TableCell className="py-4 text-gray-600">{c.email || "—"}</TableCell>
                  <TableCell className="py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full`}>
                      {c.repeat_customer}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 text-gray-600">
                    {new Date(c.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="py-4 gap-2 flex">
                    <Button variant="outline" className="text-blue-600 hover:underline" onClick={() => onEdit(c.id)}>
                      <PencilLine className="w-4 h-4 inline" />
                    </Button>
                    <Button variant="outline" className="text-red-600 hover:underline" onClick={() => onDelete(c.id)}>
                      <Trash2 className="w-4 h-4 inline" />
                    </Button>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
    )
}