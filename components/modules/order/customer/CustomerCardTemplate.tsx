import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { User, Mail, CopyCheck, Copy, Phone, MapPin } from 'lucide-react';
import { Order } from '../types';
import { useState } from 'react';

interface CustomerCardTemplateProps {
  order?: Order;
}

export default function CustomerCardTemplate({
  order,
}: CustomerCardTemplateProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (key: string, text?: string) => () => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000); // reset after 2s
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Customer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="font-medium">{order?.customers?.name}</p>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{order?.customers?.email}</span>
            </div>
            {copied === 'email' ? (
              <CopyCheck className="h-4 w-4 text-green-500" />
            ) : (
              <Copy
                className="h-4 w-4 text-gray-400 hover:cursor-pointer hover:text-gray-600 transition-colors"
                onClick={handleCopy('email', order?.customers?.email)}
              />
            )}
          </div>
          <div className="flex items-center justify-between gap-2 text-sm text-gray-600 w-full">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{order?.customers?.phone_number}</span>
            </div>
            {copied === 'phone' ? (
              <CopyCheck className="h-4 w-4 text-green-500" />
            ) : (
              <Copy
                className="h-4 w-4 text-gray-400 hover:cursor-pointer hover:text-gray-600 transition-colors"
                onClick={handleCopy('phone', order?.customers?.phone_number)}
              />
            )}
          </div>
          <div className="flex items-start justify-between gap-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4">
                <MapPin className="h-4 w-4" />
              </div>
              {!order?.addresses?.full_address ? (
                <div>{' - '}</div>
              ) : (
                <div className="flex flex-col gap-1">
                  <span>{order?.addresses?.full_address}</span>
                  <span>{order?.addresses?.postcode}</span>
                  <span>{order?.addresses?.country}</span>
                </div>
              )}
            </div>
            <div className="w-4 h-4">
              {copied === 'address' ? (
                <CopyCheck className="h-4 w-4 text-green-500" />
              ) : (
                <Copy
                  className="h-4 w-4 text-gray-400 hover:cursor-pointer hover:text-gray-600 transition-colors"
                  onClick={handleCopy(
                    'address',
                    order?.addresses?.full_address
                  )}
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
