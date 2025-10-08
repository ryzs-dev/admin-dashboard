import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useMessage } from '@/hooks/useMessage';
import { getCourierUrl } from '@/lib/utils/courierUrl';
import { OrderInput } from '@/types/order';
import { UUID } from 'crypto';

interface SendTrackingButtonProps {
  phone?: string;
  orderId: UUID;
  courier: string;
  tracking_number: string;
  updateOrder: (id: UUID, updates: Partial<OrderInput>) => Promise<void>;
  refresh: () => Promise<void>;
}

export default function SendTrackingButton({
  phone,
  orderId,
  courier,
  tracking_number,
  updateOrder,
}: SendTrackingButtonProps) {
  const { sendMessage } = useMessage();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle'
  );

  const handleSend = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent row click
    if (!phone) return alert('Customer phone number is missing!');

    setStatus('sending');
    try {
      await sendMessage({
        direction: 'outbound',
        to_number: phone,
        type: 'template',
        body: {
          tracking_number: tracking_number,
          courier: courier,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          url: getCourierUrl(courier as any) + tracking_number,
        },
      });
      await updateOrder(orderId, { status: 'Delivered' });
      setStatus('sent');
      setTimeout(() => setStatus('idle'), 3000); // reset after 3s
    } catch (err) {
      console.error(err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000); // reset
    }
  };

  return (
    <Button
      size="icon"
      variant={status === 'sent' ? 'ghost' : 'outline'}
      onClick={handleSend}
      disabled={!phone || status === 'sending'}
      className="flex items-center gap-1"
    >
      {status === 'sending' && <Send className="w-3 h-3 animate-spin" />}
      {status === 'sent' && <CheckCircle className="w-3 h-3 text-green-600" />}
      {status === 'error' && <AlertCircle className="w-3 h-3 text-red-600" />}
      {status === 'idle' && <Send className="w-3 h-3" />}
      {/* {status === 'sent' ? 'Sent' : 'Send Tracking'} */}
    </Button>
  );
}
