@php
    $company = settings('main_settings.company_name') ?: settings('main_settings.server_name') ?: 'MotoTrack';
    $email   = settings('main_settings.email') ?: 'mototrackgps@gmail.com';
    $phone   = settings('main_settings.phone');
@endphp
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Delete your account - {{ $company }}</title>
    <meta name="robots" content="noindex,follow">
    <style>
        body { margin: 0; padding: 24px 18px 48px; font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
               font-size: 16px; line-height: 1.65; color: #1f2937; background: #ffffff; }
        .wrap { max-width: 720px; margin: 0 auto; }
        h1 { font-size: 26px; margin: 0 0 8px; color: #111827; line-height: 1.25; }
        h2 { font-size: 19px; margin: 28px 0 8px; color: #111827; }
        a { color: #ff4f01; }
        .lead { color: #4b5563; margin: 0 0 8px; }
        .box { border: 1px solid #fed7c3; background: #fff7f2; border-radius: 12px; padding: 14px 16px; }
        ol, ul { padding-left: 22px; margin: 8px 0; }
        li { margin: 4px 0; }
        .note { font-size: 14px; color: #6b7280; }
        @media (prefers-color-scheme: dark) {
            body { color: #e5e7eb; background: #0e131a; }
            h1, h2 { color: #f9fafb; }
            .lead, .note { color: #9ca3af; }
            .box { background: #1a1410; border-color: #4a2a17; }
        }
    </style>
</head>
<body>
<div class="wrap">
    <h1>Delete your account</h1>
    <p class="lead">{{ $company }} (Mototrack Pro app and mototrack24.com)</p>

    <h2>Option 1: delete it yourself in the app</h2>
    <div class="box">
        <ol>
            <li>Open the <strong>Mototrack Pro</strong> app and log in.</li>
            <li>Tap the profile button (top right) to open your profile.</li>
            <li>Tap <strong>Delete my account</strong>.</li>
            <li>Enter your password and tap <strong>Yes, delete my account</strong>.</li>
        </ol>
        <p style="margin:8px 0 0">Your account is closed straight away and you are logged out.</p>
    </div>

    <h2>Option 2: ask us to delete it</h2>
    <p>If you cannot open the app, send us a request from the email address or phone number registered on your account:</p>
    <ul>
        <li>Email: <a href="mailto:{{ $email }}?subject=Delete%20my%20account">{{ $email }}</a></li>
        @if ($phone)
            <li>Phone: {{ $phone }}</li>
        @endif
    </ul>
    <p>Write "Delete my account" and the phone number or email you use to log in. We may ask you to confirm that the
       account is yours. We handle requests as soon as we can.</p>

    <h2>What is deleted</h2>
    <ul>
        <li>Your login (the account can no longer be used to sign in).</li>
        <li>Your profile details: name, phone number, email address and photo.</li>
        <li>Your notification (push) tokens, so the phone stops receiving alerts.</li>
        <li>Your saved settings, geofences and alert rules.</li>
    </ul>

    <h2>What may be kept</h2>
    <ul>
        <li>Payment and renewal records, when we must keep them for accounting or legal reasons.</li>
        <li>Vehicle and device records that belong to the service provider, not to your personal profile.</li>
    </ul>

    <h2>Questions</h2>
    <p>Contact us at <a href="mailto:{{ $email }}">{{ $email }}</a>.
       See also our <a href="{{ url('privacy') }}">Privacy Policy</a>.</p>
    <p class="note">This page is the account and data deletion information for the Mototrack Pro app on Google Play.</p>
</div>
</body>
</html>
