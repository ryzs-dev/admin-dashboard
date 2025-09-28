import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";
import { UUID } from "crypto";
import { Product } from "./types";
import { DeleteDialog } from "../utils/ui/DeleteDialog";

export default function ProductTable({ products, onEdit, onDelete}: { products: Product[], onEdit: (product: Product) => void, onDelete: (id: UUID) => void }) {
    return (
    <Table className="w-full">
        <TableHeader>
            <TableRow className="border-b text-center text-lg font-bold">
            <TableCell className="text-left">Product</TableCell>
            <TableCell >Price</TableCell>
            <TableCell >Actions</TableCell>
            </TableRow>
        </TableHeader>
        <TableBody>
            {products.map((product: Product) => (
            <TableRow key={product.id} className="border-b font-medium text-center">
                <TableCell className="text-left">{product.name}</TableCell>
                <TableCell >MYR {product.price}</TableCell>
                <TableCell >
                <div className="flex justify-center gap-2">
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(product)}
                    >
                    <Edit className="h-4 w-4" />
                    </Button>
                    <DeleteDialog
                      title="Delete Product"
                      description="Are you sure you want to delete this product?"
                      onConfirm={() => onDelete(product.id as UUID)}
                      trigger={<Button variant="ghost" size="sm"><Trash2 className="h-4 w-4" /></Button>}
                    />
                </div>
                </TableCell>
            </TableRow>
            ))}
        </TableBody>
    </Table>
    )
}
