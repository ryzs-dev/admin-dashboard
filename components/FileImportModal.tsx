// components/import/FileImportModal.tsx
"use client";

import { useState, useRef } from "react";
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Download,
  Eye,
  X,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export default function FileImportModal({ isOpen, onClose, onImportComplete }: FileImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'validate' | 'preview' | 'import' | 'complete'>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setStep('validate');
      validateFile(selectedFile);
    }
  };

  const validateFile = async (fileToValidate: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', fileToValidate);

      console.log('Starting validation request...');
      const response = await fetch(`${API_BASE_URL}/api/import/validate`, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers.get('content-type'));

      if (!response.ok) {
        const text = await response.text();
        console.log('Response text:', text);
        
        // Check if response is HTML (error page)
        if (text.includes('<!DOCTYPE')) {
          throw new Error(`API endpoint not found (${response.status}). Check if backend is running and import routes are configured.`);
        }
        
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.details || 'Validation failed');
        } catch {
          throw new Error(`Server error: ${response.status} - ${text.slice(0, 100)}`);
        }
      }

      console.log('Parsing JSON response...');
      const result = await response.json();
      console.log('Validation result:', result);
      
      // Check if the response has the expected structure
      if (!result.success || !result.data) {
        throw new Error('Invalid response format from server');
      }

      setValidationResult(result.data);
      
      if (result.data.validation.isValid) {
        console.log('Validation successful, moving to preview step');
        setStep('preview');
      } else {
        const errorMessage = result.data.validation.errors.length > 0 
          ? result.data.validation.errors.join(', ')
          : 'No valid data found';
        setError(`Validation failed: ${errorMessage}`);
        setStep('upload');
      }

    } catch (err) {
      console.error('Validation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Validation failed';
      setError(errorMessage);
      setStep('upload');
    } finally {
      setIsLoading(false);
    }
  };

  const executeImport = async (skipDuplicates = true) => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setStep('import');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('skipDuplicates', skipDuplicates.toString());
      formData.append('batchSize', '100');

      const response = await fetch(`${API_BASE_URL}/api/import/execute`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Import failed');
      }

      const result = await response.json();
      setImportResult(result.data);
      setStep('complete');
      
      // Refresh parent component data
      onImportComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStep('preview');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/import/template`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'order_import_template.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Template download failed:', err);
    }
  };

  const resetModal = () => {
    setFile(null);
    setStep('upload');
    setValidationResult(null);
    setImportResult(null);
    setError(null);
    setShowPreview(false);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Upload className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Import Orders</h2>
              <p className="text-sm text-gray-500">Upload CSV or Excel files to import orders to Supabase</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            {[
              { key: 'upload', label: 'Upload File', icon: Upload },
              { key: 'validate', label: 'Validate', icon: FileText },
              { key: 'preview', label: 'Preview', icon: Eye },
              { key: 'import', label: 'Import', icon: ArrowRight },
              { key: 'complete', label: 'Complete', icon: CheckCircle }
            ].map((stepItem, index) => {
              const Icon = stepItem.icon;
              const isActive = step === stepItem.key;
              const isCompleted = ['upload', 'validate', 'preview', 'import'].indexOf(stepItem.key) < ['upload', 'validate', 'preview', 'import', 'complete'].indexOf(step);
              
              return (
                <div key={stepItem.key} className="flex items-center">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    isActive ? 'bg-blue-100 text-blue-700' : 
                    isCompleted ? 'bg-green-100 text-green-700' : 
                    'bg-gray-100 text-gray-500'
                  }`}>
                    <Icon className="h-4 w-4" />
                    {stepItem.label}
                  </div>
                  {index < 4 && (
                    <ArrowRight className="h-4 w-4 text-gray-300 mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Upload Your File</h3>
                <p className="text-gray-600 mb-6">
                  Select a CSV or Excel file containing your order data
                </p>
              </div>

              {/* File Upload Area */}
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  CSV, Excel (.xlsx, .xls) files up to 10MB
                </p>
                
                <Button variant="outline">
                  Select File
                </Button>
              </div>

              {/* Template Download */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-1">Need a template?</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Download our CSV template with sample data and proper column headers
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={downloadTemplate}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Upload Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 2: Validation Loading */}
          {step === 'validate' && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Validating File</h3>
              <p className="text-gray-600">
                Checking file format and mapping columns...
              </p>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && validationResult && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Import Preview</h3>
                  <p className="text-gray-600">Review the data before importing</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">
                    {validationResult.summary.totalRows}
                  </div>
                  <div className="text-sm text-blue-600">Total Rows</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">
                    {validationResult.validation.validRows}
                  </div>
                  <div className="text-sm text-green-600">Valid Rows</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900">
                    {validationResult.summary.mappedFields}
                  </div>
                  <div className="text-sm text-purple-600">Mapped Fields</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-900">
                    {validationResult.detectedHeaders.length}
                  </div>
                  <div className="text-sm text-yellow-600">Total Columns</div>
                </div>
              </div>

              {/* Field Mapping */}
              <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Field Mapping</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {Object.entries(validationResult.fieldMapping).map(([dbField, csvHeader]) => (
                  <div key={dbField} className="flex justify-between py-1">
                    <span className="text-gray-600">{dbField}:</span>
                    <span className="font-mono text-green-600">
                      {csvHeader as string}
                    </span>
                  </div>
                ))}
              </div>
            </div>

              {/* Warnings */}
              {validationResult.validation.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Warnings</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      {validationResult.validation.warnings.map((warning: string, index: number) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Data Preview */}
              {validationResult.validation.preview.map((item: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{item.rowNumber}</td>
                  <td className="px-4 py-2">{item.transformed.customer_name || 'N/A'}</td>
                  <td className="px-4 py-2">{item.transformed.phone_number || 'N/A'}</td>
                  <td className="px-4 py-2">
                    {item.transformed.currency || 'MYR'} {item.transformed.total_amount || '0.00'}
                  </td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      {item.transformed.status || 'completed'}
                    </span>
                  </td>
                </tr>
              ))}

              {/* Import Options */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-medium mb-3">Import Options</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Skip duplicate phone numbers</span>
                  </label>
                  <p className="text-xs text-gray-500">
                    Orders with phone numbers that already exist will be skipped
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setStep('upload');
                    setValidationResult(null);
                  }}
                >
                  Choose Different File
                </Button>
                <Button
                  onClick={() => executeImport(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Import {validationResult.validation.validRows} Orders
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Import Progress */}
          {step === 'import' && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Importing Orders</h3>
              <p className="text-gray-600">
                Processing orders in batches... This may take a few minutes.
              </p>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && importResult && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Import Complete!</h3>
                <p className="text-gray-600">
                  Your orders have been successfully imported to Supabase
                </p>
              </div>

              {/* Results Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-900">
                    {importResult.successfulInserts}
                  </div>
                  <div className="text-sm text-green-600">Successfully Imported</div>
                </div>
                
                {importResult.failedInserts > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-900">
                      {importResult.failedInserts}
                    </div>
                    <div className="text-sm text-red-600">Failed</div>
                  </div>
                )}
                
                {importResult.duplicatesSkipped && importResult.duplicatesSkipped > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-900">
                      {importResult.duplicatesSkipped}
                    </div>
                    <div className="text-sm text-yellow-600">Duplicates Skipped</div>
                  </div>
                )}
              </div>

              {/* Error Details */}
              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Import Errors</AlertTitle>
                  <AlertDescription>
                    <details className="mt-2">
                      <summary className="cursor-pointer">View error details</summary>
                      <pre className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto">
                        {JSON.stringify(importResult.errors, null, 2)}
                      </pre>
                    </details>
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {importResult.successfulInserts > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Import Successful</AlertTitle>
                  <AlertDescription>
                    {importResult.successfulInserts} orders have been added to your Supabase database.
                    You can now view them in your orders dashboard.
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={resetModal}
                >
                  Import Another File
                </Button>
                <Button
                  onClick={handleClose}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  View Orders Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}