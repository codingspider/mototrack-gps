// Customer reports. Every report is one GET call; the shapes are written above each report in utils/reportConfigs.js.
import client from './client';

const REPORT_TIMEOUT_MS = 60000;

/**
 * @param {string} path Report path, e.g. '/reports/distance-report/daily'
 * @param {object} params Query params of that report
 */
export async function getReport(path, params) {
  // Some reports (Location, Trips) make the server look up an address for every point, which can take a while
  const response = await client.get(path, { params, timeout: REPORT_TIMEOUT_MS });
  return response.data;
}
