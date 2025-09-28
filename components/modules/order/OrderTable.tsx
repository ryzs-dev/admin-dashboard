import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";
import { Order } from "./types";
import { UUID } from "crypto";
import { DeleteDialog } from "../utils/ui/DeleteDialog";
import { useRouter } from "next/navigation";

export default function OrderTable({ orders, onEdit, onDelete}: { orders: Order[], onEdit: (order: Order) => void, onDelete: (id: UUID) => void }) {
    const router = useRouter()
    return (
    <Table className="w-full">
        <TableHeader>
            <TableRow className="border-b text-left font-medium">
            <TableCell >Order</TableCell>
            <TableCell >Date</TableCell>
            <TableCell >Customer</TableCell>
            <TableCell >Tracking Number</TableCell>
            <TableCell >Payment Status</TableCell>
            <TableCell >Order Total</TableCell>
            <TableCell >Actions</TableCell>
            </TableRow>
        </TableHeader>
        <TableBody>
            {orders.map((order: Order) => (
            <TableRow key={order.id} className="border-b font-medium text-left hover:cursor-pointer hover:bg-gray-100" onClick={() => router.push(`/orders/${order.id}`)}>
                <TableCell>#{order.id}</TableCell>
                <TableCell >{new Date(order.order_date).toLocaleDateString()}</TableCell>
                <TableCell className="flex flex-col">
                {order.customers?.name}
                    <div className="text-sm text-muted-foreground">
                        {order.customers?.email}
                    </div>
                </TableCell>
                <TableCell >{order.order_tracking?.map((tracking) => (
                    <div key={tracking.id} className="flex flex-col">
                        <div className="font-medium">{tracking.tracking_number}</div>
                        <div className="text-sm text-muted-foreground">{tracking.courier}</div>
                    </div>
                ))}</TableCell>
                <TableCell >
                {order.status}
                </TableCell>
                <TableCell >MYR {order.total_amount}</TableCell>
                <TableCell >
                <div className="flex justify-start gap-2">
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(order)}
                    >
                    <Edit className="h-4 w-4" />
                    </Button>
                    <DeleteDialog
                      title="Delete Order"
                      description="Are you sure you want to delete this order?"
                      onConfirm={() => onDelete(order.id as UUID)}
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
