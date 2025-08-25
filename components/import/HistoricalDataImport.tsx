/* eslint-disable @typescript-eslint/no-explicit-any */
// components/import/HistoricalDataImport.tsx - Component for importing 18 months of data
"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  RefreshCw,
  Database,
  TrendingUp,
} from "lucide-react";

interface ImportSummary {
  totalProcessed: number;
  successfulImports: number;
  duplicatesSkipped: number;
  errors: number;
  transformationErrors: number;
  skippedRows: number;
}

interface ImportError {
  originalRowNo: string;
  customerName: string;
  error: string;
}

export default function HistoricalDataImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);
  const [batchSize, setBatchSize] = useState(50);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(
    null
  );
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<string>("");

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        // Reset previous results
        setImportSummary(null);
        setImportErrors([]);
        setPreviewData([]);
        setCurrentStatus("");
      }
    },
    []
  );

  const downloadTemplate = () => {
    const link = document.createElement("a");
    link.href = `${process.env.NEXT_PUBLIC_API_URL}/api/import/template`;
    link.download = "lunaa_import_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setCurrentStatus("Preparing upload...");

    try {
      const formData = new FormData();
      formData.append("csvFile", selectedFile);
      formData.append("dryRun", isDryRun.toString());
      formData.append("batchSize", batchSize.toString());
      formData.append("skipDuplicates", skipDuplicates.toString());

      setCurrentStatus("Uploading and parsing CSV...");
      setUploadProgress(20);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/import/historical-csv`,
        {
          method: "POST",
          body: formData,
        }
      );

      setUploadProgress(50);
      setCurrentStatus("Processing data...");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Import failed");
      }

      const result = await response.json();

      setUploadProgress(100);
      setCurrentStatus(isDryRun ? "Preview completed!" : "Import completed!");

      // Set results
      setImportSummary(result.summary);
      setImportErrors(result.errors || []);
      setPreviewData(result.preview || []);
    } catch (error) {
      console.error("Import failed:", error);
      setCurrentStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    if (status.includes("Error"))
      return <XCircle className="h-4 w-4 text-red-500" />;
    if (status.includes("completed"))
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Historical Data Import
        </h1>
        <p className="text-gray-600">
          Import your 18 months of order data into the new normalized system
        </p>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import Instructions
          </CardTitle>
          <CardDescription>
            Follow these steps to import your historical CSV data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">📁 File Requirements:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• CSV format only</li>
                <li>• Maximum 50MB per file</li>
                <li>• Must match your current format</li>
                <li>• One month per file recommended</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">🔄 Process:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 1. Run preview first (Dry Run)</li>
                <li>• 2. Check results and errors</li>
                <li>• 3. Fix any issues in CSV</li>
                <li>• 4. Run actual import</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Historical CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFile && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type}
                    </p>
                  </div>
                  <Badge variant="outline">Ready</Badge>
                </div>
              </div>
            )}
          </div>

          {/* Import Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={isDryRun}
                  onChange={(e) => setIsDryRun(e.target.checked)}
                  className="rounded"
                />
                <span>Dry Run (Preview Only)</span>
              </label>
              <p className="text-xs text-gray-500">
                Preview results without importing
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Batch Size:</label>
              <Input
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value) || 50)}
                min={10}
                max={200}
                className="w-20"
              />
              <p className="text-xs text-gray-500">Orders per batch (10-200)</p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="rounded"
                />
                <span>Skip Duplicates</span>
              </label>
              <p className="text-xs text-gray-500">
                Skip orders that may already exist
              </p>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  {getStatusIcon(currentStatus)}
                  {currentStatus}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isUploading}
            className="w-full"
            size="lg"
          >
            {isUploading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {isDryRun ? "Running Preview..." : "Importing Data..."}
              </>
            ) : (
              <>
                {isDryRun ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Run Preview
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Start Import
                  </>
                )}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {importSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {isDryRun ? "Preview Results" : "Import Results"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {importSummary.totalProcessed}
                </div>
                <div className="text-sm text-blue-700">Total Processed</div>
              </div>

              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {importSummary.successfulImports}
                </div>
                <div className="text-sm text-green-700">
                  {isDryRun ? "Valid Orders" : "Successfully Imported"}
                </div>
              </div>

              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {importSummary.duplicatesSkipped}
                </div>
                <div className="text-sm text-yellow-700">
                  Duplicates Skipped
                </div>
              </div>

              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {importSummary.errors + importSummary.transformationErrors}
                </div>
                <div className="text-sm text-red-700">Total Errors</div>
              </div>
            </div>

            {/* Success Rate */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Success Rate</span>
                <span>
                  {(
                    (importSummary.successfulImports /
                      importSummary.totalProcessed) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <Progress
                value={
                  (importSummary.successfulImports /
                    importSummary.totalProcessed) *
                  100
                }
                className="h-3"
              />
            </div>

            {/* Detailed Breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Rows Skipped (Invalid):</span>
                <span>{importSummary.skippedRows}</span>
              </div>
              <div className="flex justify-between">
                <span>Transformation Errors:</span>
                <span>{importSummary.transformationErrors}</span>
              </div>
              <div className="flex justify-between">
                <span>Import Errors:</span>
                <span>{importSummary.errors}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Data */}
      {previewData && previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
            <CardDescription>
              First 5 orders that will be imported
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Payment</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((order, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">
                            {order.order.customer_name}
                          </div>
                          {order.order.phone_number && (
                            <div className="text-gray-500">
                              {order.order.phone_number}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        {new Date(order.order.order_date).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        {order.order.currency} {order.amounts.total_amount}
                      </td>
                      <td className="p-2">{order.order.payment_method}</td>
                      <td className="p-2">
                        <Badge variant="outline">{order.order.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {importErrors && importErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Import Errors ({importErrors.length})
            </CardTitle>
            <CardDescription>Issues that need to be resolved</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {importErrors.map((error, index) => (
                <div
                  key={index}
                  className="p-3 bg-red-50 rounded-lg border border-red-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-red-800">
                        Row #{error.originalRowNo}: {error.customerName}
                      </div>
                      <div className="text-sm text-red-600 mt-1">
                        {error.error}
                      </div>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      Error
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {importSummary && !isDryRun && importSummary.successfulImports > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">
              🎉 Import Completed!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-green-700">
            <p className="mb-3">
              Successfully imported {importSummary.successfulImports} orders.
              You can now proceed with your next month&apos;s data.
            </p>
            <div className="space-y-2 text-sm">
              <p>✅ Check your Orders page to verify the imported data</p>
              <p>✅ Review the Products and Packages sections</p>
              <p>✅ Continue with the next month&apos;s CSV file</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">
            💡 Tips for Best Results
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 space-y-2 text-sm">
          <p>• Always run a preview first to identify issues</p>
          <p>• Import one month at a time for better error tracking</p>
          <p>• Clean up phone numbers in format: +60123456789</p>
          <p>• Ensure dates are in DD/MM/YY format</p>
          <p>• Keep batch size at 50-100 for optimal performance</p>
          <p>• Review errors and fix them in the CSV before re-importing</p>
        </CardContent>
      </Card>
    </div>
  );
}
