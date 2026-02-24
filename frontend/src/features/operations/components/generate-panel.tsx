import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardBody } from '@/components/ui/card';

interface GeneratePanelProps {
  raceId: number;
  selectedRouteIds: Set<number>;
}

export function GeneratePanel({ raceId, selectedRouteIds }: GeneratePanelProps) {
  const selectionCount = selectedRouteIds.size;

  const handleExportPdf = () => {
    const url = selectionCount > 0
      ? `/api/v1/races/${raceId}/routes/export_pdf?ids=${[...selectedRouteIds].join(',')}`
      : `/api/v1/races/${raceId}/routes/export_pdf`;
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `race-${raceId}-routes.pdf`;
        link.click();
        URL.revokeObjectURL(blobUrl);
      });
  };

  const handleExportCsv = () => {
    const url = selectionCount > 0
      ? `/api/v1/races/${raceId}/routes/export_csv?ids=${[...selectedRouteIds].join(',')}`
      : `/api/v1/races/${raceId}/routes/export_csv`;
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `race-${raceId}-routes.csv`;
        link.click();
        URL.revokeObjectURL(blobUrl);
      });
  };

  return (
    <Card>
      <CardHeader className="px-4 py-3">
        <h3 className="text-base font-semibold text-gray-900">Generate</h3>
      </CardHeader>
      <CardBody className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Button
            id="download-pdf-btn"
            size="sm"
            variant="secondary"
            onClick={handleExportPdf}
            disabled={selectionCount === 0}
            title="Download route cards as PDF"
          >
            {selectionCount > 0 ? `Download PDF (${selectionCount})` : 'Download PDF'}
          </Button>
          <Button
            id="export-csv-btn"
            size="sm"
            variant="secondary"
            onClick={handleExportCsv}
            title="Export routes as CSV"
          >
            {selectionCount > 0 ? `Export CSV (${selectionCount})` : 'Export CSV'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
