import { useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  preview: any[];
  totalRows: number;
  validRows: number;
}

interface ImportResult {
  success: boolean;
  totalProcessed: number;
  successfulInserts: number;
  failedInserts: number;
  errors: any[];
  duplicatesSkipped?: number;
}

export function useFileImport() {
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const validateFile = async (file: File): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> => {
    setIsValidating(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/import/validate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Validation failed');
      }

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Validation failed' 
      };
    } finally {
      setIsValidating(false);
    }
  };

  const importFile = async (
    file: File, 
    options: {
      skipDuplicates?: boolean;
      batchSize?: number;
    } = {}
  ): Promise<{
    success: boolean;
    data?: ImportResult;
    error?: string;
  }> => {
    setIsImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('skipDuplicates', (options.skipDuplicates ?? true).toString());
      formData.append('batchSize', (options.batchSize ?? 100).toString());

      const response = await fetch(`${API_BASE_URL}/api/import/execute`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Import failed');
      }

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Import failed' 
      };
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/import/template`);
      
      if (!response.ok) {
        throw new Error('Template download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'order_import_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Template download failed:', error);
      return false;
    }
  };

  return {
    validateFile,
    importFile,
    downloadTemplate,
    isValidating,
    isImporting
  };
}