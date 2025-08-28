// components/import/ImportButton.tsx - Enhanced Import Button with Better Integration
"use client";

import { useState } from "react";
import { Upload, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import FileImportModal from "./FileImportModal";

interface ImportButtonProps {
  onImportComplete?: () => void;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg";
  showDropdown?: boolean;
}

export function ImportButton({ 
  onImportComplete, 
  className,
  variant = "outline",
  size = "default",
  showDropdown = true
}: ImportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImportComplete = () => {
    onImportComplete?.();
    setIsModalOpen(false);
  };

  const downloadTemplate = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${API_BASE_URL}/api/import/template`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'lunaa_order_import_template.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Template download failed:', err);
    }
  };

  if (!showDropdown) {
    // Simple button without dropdown
    return (
      <>
        <Button
          variant={variant}
          size={size}
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

  // Button with dropdown menu
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={className}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Orders
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setIsModalOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Import CSV/Excel</span>
              <span className="text-xs text-gray-500">Upload order data from file</span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Download Template</span>
              <span className="text-xs text-gray-500">Get CSV template with sample data</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FileImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </>
  );
}