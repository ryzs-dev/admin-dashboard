import ImportComponent from '@/components/modules/import/ImportComponent';

export default function ImportPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Import Data</h1>

      <p className="mb-4">
        Use the form below to import data into the CRM system.
      </p>

      <ImportComponent />
    </div>
  );
}
