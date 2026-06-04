'use client';

import TemplateForm from '@/components/modules/whatsapp/templates/TemplateForm';
import WhatsappTemplateList from '@/components/modules/whatsapp/templates/WhatsappTemplate';
import { Button } from '@/components/ui/button';
import { useWhatsappTemplates } from '@/hooks/useWhatsapp';
import { Plus, RefreshCcw } from 'lucide-react';
import { useState } from 'react';

export default function TemplatesPage() {
  const { templates, isLoading, isError, refresh } = useWhatsappTemplates();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-gray-500">Loading templates...</div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-sm text-red-500">Failed to load templates.</div>
    );
  }

  if (!templates.length) {
    return <div className="p-6 text-sm text-gray-500">No templates found.</div>;
  }

  return (
    <div className="p-6 ">
      <div className="flex items-center justify-between pb-2">
        <h1 className="text-lg font-semibold">WhatsApp Templates</h1>

        <div className="flex-row space-x-2">
          <Button
            onClick={() => refresh({ revalidate: true })}
            variant="outline"
            className={`min-w-[130px] text-black`}
          >
            Refresh
            <RefreshCcw className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => setOpen(true)}
            disabled={open}
            className={`min-w-[130px] ${open ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-[#25D366] hover:bg-[#22c55e]'} text-white`}
          >
            Create Template
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <TemplateForm
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => {
          refresh();
          setOpen(false);
        }}
      />

      <WhatsappTemplateList templates={templates} />
    </div>
  );
}


