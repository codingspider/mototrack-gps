<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\CertificateController;
use App\Http\Controllers\Controller;

/**
 * Certificate links for the mobile app
 *
 * GET api/certificate-link?device_id=123
 *
 * Answers the two public links of one device's certificate:
 *  - view_url:     the certificate page (opens inside the app)
 *  - download_url: the A4 PDF (the phone downloads it)
 * The links carry the encrypted device id, the same token the QR code on the certificate uses.
 * No extra permission: any logged-in user gets the certificate of their own devices (the lookup below only
 * finds devices the user can access). The web panel's "device_certificate" rule is not used by the app.
 */
class CertificateLinkController extends Controller
{
    public function index()
    {
        $deviceId = request()->input('device_id') ?: request()->input('vehicle_id');

        if (empty($deviceId) || !is_numeric($deviceId)) {
            return response()->json([
                'status' => 0,
                'errors' => ['device_id' => trans('validation.required', ['attribute' => 'device_id'])],
            ], 422);
        }

        $device = $this->user->accessibleDevices()->find($deviceId);

        if (!$device) {
            return response()->json(['status' => 0, 'message' => trans('global.not_found')], 404);
        }

        $token = CertificateController::encryptId($device->id);

        return response()->json([
            'status'       => 1,
            'view_url'     => route('certificate.show', ['token' => $token]),
            'download_url' => route('certificate.pdf', ['token' => $token]),
            'filename'     => 'certificate-' . $device->id . '.pdf',
        ], 200);
    }
}
