// The registration certificate of a device (the same certificate the web panel shows and downloads as a PDF).
import client from './client';
import endpoints from './endpoints';

/**
 * The links of one device's certificate (GET /certificate-link?device_id=).
 *
 * ⚠️ BACKEND ENDPOINT NEEDED: this route does not exist yet (the app shows "not available yet" until it does).
 * The web panel only has `objects/{id}/certificate` (needs the web login) and the public page `certificate/{token}`
 * whose token (CertificateController::encryptId) only the server can make. To add:
 *   routes/api.php (next to `warranty-check`):  GET certificate-link  -> V1\CertificateLinkController@index
 *   routes/web.php (public, next to `certificate/{token}`):  GET certificate/{token}/pdf -> CertificateController@pdf
 *   index(): find the device in the user's accessible devices, check the same permission as the web download
 *   (admin or device_certificate), token = CertificateController::encryptId($device->id), answer the links below.
 *   pdf($token): decryptToken, load the device and answer renderPdf() with the same headers as download().
 * Expected answer:
 * {
 *   status: 1,
 *   view_url: 'https://mototrack24.com/certificate/<token>',        // the public certificate page (opens in the app)
 *   download_url: 'https://mototrack24.com/certificate/<token>/pdf', // the A4 PDF (the phone downloads it)
 *   filename: 'certificate-12.pdf'
 * }
 * A device the customer may not get a certificate for answers { status: 0, message } with HTTP 403 / 404.
 * @param {number} deviceId
 */
export async function getCertificateLinks(deviceId) {
  const response = await client.get(endpoints.certificateLink, { params: { device_id: deviceId } });
  return response.data;
}
