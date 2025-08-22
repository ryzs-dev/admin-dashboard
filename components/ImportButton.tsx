"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileImportModal from "./FileImportModal";

interface ImportButtonProps {
  onImportComplete?: () => void;
  className?: string;
}

export function ImportButton({ onImportComplete, className }: ImportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImportComplete = () => {
    onImportComplete?.();
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        <Upload className="h-4 w-4 mr-2" />
        Import Orders
      </Button>

      <FileImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </>
  );
}