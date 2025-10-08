'use client';

import { useState } from 'react';
import { UUID } from 'crypto';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontalIcon,
  Package,
  PencilIcon,
  Plus,
  Send,
  Trash2,
  Truck,
} from 'lucide-react';
import { TrackingList } from './TrackingList';
import { OrderTracking, OrderTrackingInput } from './types';
import TrackingDialog from './TrackingDialog';
import { useOrderTracking } from '@/hooks/useOrders';

interface TrackingCardTemplateProps {
  orderId: UUID;
}

export default function TrackingCardTemplate({
  orderId,
}: TrackingCardTemplateProps) {
  const {
    createTracking,
    updateTracking,
    refreshOrderTracking,
    deleteTracking,
    tracking,
  } = useOrderTracking(orderId);

  const [dialogState, setDialogState] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    tracking?: OrderTracking;
  }>({ open: false, mode: 'add' });

  const openAddDialog = () => setDialogState({ open: true, mode: 'add' });

  const openEditDialog = (tracking: OrderTracking) =>
    setDialogState({ open: true, mode: 'edit', tracking });

  const handleCloseDialog = () =>
    setDialogState({ open: false, mode: 'add', tracking: undefined });

  const handleSubmit = async (trackingData: OrderTrackingInput) => {
    try {
      if (dialogState.mode === 'add') {
        await createTracking(trackingData);
      } else if (dialogState.mode === 'edit' && dialogState.tracking) {
        await updateTracking(dialogState.tracking.id, trackingData);
      }
      await refreshOrderTracking();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving tracking:', error);
    }
  };

  const handleDeleteTracking = async (trackingId: UUID) => {
    console.log('Deleting tracking with ID:', trackingId);
    if (!trackingId) return;
    try {
      await deleteTracking(trackingId);
      await refreshOrderTracking();
    } catch (error) {
      console.error('Error deleting tracking:', error);
    }
  };

  const handleSend = async (trackingId: UUID) => {
    console.log('Sending tracking with ID:', trackingId);
    // Implement send logic here
  };

  return (
    <Card id="tracking-card">
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping
          </CardTitle>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                <MoreHorizontalIcon className="h-4 w-4 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                onClick={openAddDialog}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </DropdownMenuItem>

              {tracking.map((t: OrderTracking) => (
                <DropdownMenuItem
                  key={t.id}
                  onClick={() => openEditDialog(t)}
                  className="flex items-center gap-2"
                >
                  <PencilIcon className="h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
              ))}

              {tracking.length > 0 && (
                <DropdownMenuItem
                  onClick={() => handleSend(tracking[0]?.id)}
                  className="flex items-center gap-2 text-red-600"
                >
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => handleDeleteTracking(tracking[0]?.id)}
                className="flex items-center gap-2 text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        {tracking && tracking.length > 0 ? (
          <TrackingList trackings={tracking} />
        ) : (
          <div className="text-center py-6">
            <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-3">
              No tracking information
            </p>
            <Button variant="outline" size="sm" onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tracking
            </Button>
          </div>
        )}
      </CardContent>

      {dialogState.open && (
        <TrackingDialog
          isOpen={dialogState.open}
          onClose={handleCloseDialog}
          orderId={orderId}
          onSubmit={handleSubmit}
          mode={dialogState.mode}
          initialData={dialogState.tracking}
        />
      )}
    </Card>
  );
}
