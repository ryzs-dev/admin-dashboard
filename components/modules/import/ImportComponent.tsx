'use client';

import { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useImport } from '@/hooks/useImport';

export default function ImportComponent() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const { importFile, error } = useImport();

  const handleFileChange = (e: { target: { files: FileList | null } }) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !['csv', 'xlsx', 'xls'].includes(fileExtension)) {
        return;
      }
      setFile(selectedFile);

      setSuccess('');
    }
  };

  const handleDrop = (e: {
    preventDefault: () => void;
    dataTransfer: { files: FileList };
  }) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const fileExtension = droppedFile.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !['csv', 'xlsx', 'xls'].includes(fileExtension)) {
        return;
      }
      setFile(droppedFile);

      setSuccess('');
    }
  };

  const handleDragOver = (e: { preventDefault: () => void }) => {
    e.preventDefault();
  };

  const handleImport = async () => {
    if (!file) return;

    setUploading(true);
    setSuccess('');

    try {
      await importFile(file); // use your hook

      setSuccess(`Import Successful`);
      setTimeout(() => setSuccess(''), 3000);

      setFile(null);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);

    setSuccess('');
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-lg bg-white p-6">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors"
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop your file here, or click to browse
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Supports CSV, XLSX, and XLS files
          </p>
          <Input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
          />
          <Button asChild variant="outline" size="sm">
            <label htmlFor="file-input" className="cursor-pointer">
              Select File
            </label>
          </Button>
        </div>

        {file && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFile}
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </Button>
              <Button onClick={handleImport} disabled={uploading} size="sm">
                {uploading ? 'Uploading...' : 'Import'}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 border border-red-200 rounded-lg bg-red-50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">
                {error?.response?.data?.error ||
                  error?.message ||
                  'Something went wrong'}
              </p>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 border border-green-200 rounded-lg bg-green-50 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Success</p>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
          </div>
        )}
      </div>

      <div className="border rounded-lg bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">
            File Requirements
          </h3>
          <Button variant="outline" size="sm" onClick={() => {}}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-gray-400">•</span>
            <span>Accepted formats: CSV, XLSX, XLS</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-400">•</span>
            <span>First row should contain column headers</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-400">•</span>
            <span>Maximum file size: 10MB</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-400">•</span>
            <span>Use the template to ensure proper formatting</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
