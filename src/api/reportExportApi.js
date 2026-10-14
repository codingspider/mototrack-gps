// Asks the server to turn the table on the screen into a PDF, Excel or CSV file (V1\ReportExportController@store).
import client from './client';
import endpoints from './endpoints';

const EXPORT_TIMEOUT_MS = 90000; // a long PDF takes a while to draw

/**
 * Make a file out of a report table.
 * Answer: { status: 1, url: 'https://.../report-export/<token>', filename: 'daily-activity-2026-10-12-204000.pdf', expires_in: 900 }
 * The link is public and works for 15 minutes; opening it downloads the file.
 * @param {'pdf'|'xlsx'|'csv'} format
 * @param {{ title: string, subtitle: string, generatedAt: string, summary: Array, columns: string[], rows: string[][] }} model
 */
export async function createReportExport(format, model) {
  const response = await client.post(
    endpoints.reportExport,
    {
      format,
      title: model.title,
      subtitle: model.subtitle,
      generated: model.generatedAt,
      summary: model.summary,
      columns: model.columns,
      rows: model.rows,
    },
    { timeout: EXPORT_TIMEOUT_MS },
  );
  return response.data;
}
