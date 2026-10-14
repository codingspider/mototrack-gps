BACKEND PATCH: certificate links for the MotoTrack24 mobile app
================================================================
Not part of the mobile app. Copy these files into the WEB project (D:\herd\mototrack, and the live server), then
delete this folder.

1) NEW file  (upload as it is)
   app/Http/Controllers/Api/V1/CertificateLinkController.php

2) REPLACE file  (the old file with one new method pdf() and the PDF code moved into a private pdfResponse())
   app/Http/Controllers/CertificateController.php
   Behaviour of the existing web download (objects/{id}/certificate) is unchanged.

3) ADD two route lines (do not replace the whole files)

   routes/web.php  - next to  Route::get('certificate/{token}', ...)  (around line 27, the same public group):

       Route::get('certificate/{token}/pdf', ['as' => 'certificate.pdf', 'uses' => 'CertificateController@pdf']);

   routes/api.php  - next to  Route::get('warranty-check', ...)  (around line 223, inside the same auth group):

       Route::get('certificate-link', ['as' => 'api.certificate_link', 'uses' => 'V1\CertificateLinkController@index']);

4) On the server, clear the route cache:
       php artisan route:clear
   (and  php artisan route:cache  if you normally use it)

Test (replace HASH and 8):
   GET https://mototrack24.com/api/certificate-link?user_api_hash=HASH&device_id=8
   -> { "status": 1, "view_url": ".../certificate/<token>", "download_url": ".../certificate/<token>/pdf", ... }
   Open download_url in a browser: it downloads the A4 PDF.

Any logged-in user gets the certificate of their own devices (no extra permission).

----------------------------------------------------------------------------------------------------
UPDATE: "engine off since" time (the app shows "Engine Off since 08:40 AM" instead of the last report time)
----------------------------------------------------------------------------------------------------
Two more files changed (already copied to D:\herd\mototrack, upload them to /var/www/mototrack):

   app/Transformers/ApiV1/CustomerVehicleTransformer.php   (new engine_changed_stamp field in GET /api/vehicles)
   app/Transformers/ApiV1/VehicleDetailsTransformer.php    (the same field in GET /api/vehicle-details)

No route change, no cache clear. The new field is unix seconds of traccar.engine_changed_at (null when unknown).
The app works without it (it falls back to the last report time), so uploading is safe at any time.

----------------------------------------------------------------------------------------------------
UPDATE: account deletion page for Google Play  ->  https://mototrack24.com/delete-account
----------------------------------------------------------------------------------------------------
Three files (already in D:\herd\mototrack, upload them to /var/www/mototrack):

   resources/views/legal/delete_account.blade.php               NEW (the page)
   app/Http/Controllers/Frontend/LegalPageController.php        REPLACE (adds deleteAccount())
   routes/web.php                                               ADD ONE LINE, after the 'privacy' route:

       Route::get('delete-account', ['as' => 'legal.delete_account', 'uses' => 'Frontend\LegalPageController@deleteAccount']);

Then:  php artisan route:clear   and   php artisan view:clear
Test:  open https://mototrack24.com/delete-account in a browser (no login needed).
