# MotoTrack Pro: Google Play submission package

App: **Mototrack Pro** · package: `com.mototrackpro` · version 1.0 (versionCode 1)
Customer GPS vehicle-tracking app for the MotoTrack24 portal (https://mototrack24.com). Bangladesh.

---------------------------------------------------------------------------------------------------------------------

## 0. STOP: fix these before you build (they decide what customers get)

| # | Check | Why | Status |
|---|---|---|---|
| 1 | **DGePay is on the TEST server.** `.env` has `DGEPAY_BASE_URL=https://api-uat.dgepay.net/dipon/v3` (UAT = test). | A release build with this URL cannot take real payments. Put the **live** DGePay URL and the **live** client id / api key / secret in `.env`, then build. | ⚠ MUST FIX |
| 2 | Google Maps key restriction | Add the **SHA-1 of the upload key** and the **Play App Signing SHA-1** (Play Console → App integrity) to the key in Google Cloud, package `com.mototrackpro`. Without it the map is blank in the Play version. | to do |
| 3 | Firebase fingerprints | Add the same two SHA-1/SHA-256 in Firebase console → Project settings → your Android app. Without it push tokens can fail. | to do |
| 4 | Backend files uploaded | Certificate files + "engine since" transformers (see `backend-patch/README.txt`). | to do |
| 5 | Backend route cache | `php artisan route:clear` on the server after the route files. | to do |

SHA-1 of your upload key:
```
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -list -v -keystore D:\mototrack-apps\mototrackpro\android\app\mototrack-upload.keystore
```

---------------------------------------------------------------------------------------------------------------------

## 1. The file to upload

| What | Where |
|---|---|
| **App bundle (AAB)** | `D:\mototrack-apps\mototrackpro\android\app\build\outputs\bundle\release\app-release.aab` |

Build it:
```
cd D:\mototrack-apps\mototrackpro\android
.\gradlew clean
.\gradlew bundleRelease
```
Keep safe (never upload, never share, never lose): `android\app\mototrack-upload.keystore` and its password.

Technical facts (Play Console asks for some of these):
- minSdk 24 (Android 7.0), targetSdk 36, 64-bit (arm64 + x86_64 are included by the React Native build).
- Languages in the app: English, Bangla.
- Permissions: INTERNET, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, POST_NOTIFICATIONS,
  WRITE_EXTERNAL_STORAGE (Android 9 and older only).
- Uses Google Play in-app update (forced update screen), Firebase Cloud Messaging, Google Maps SDK.

---------------------------------------------------------------------------------------------------------------------

## 2. Store listing: text (copy and paste)

### App name (max 30)
```
Mototrack Pro
```
Alternative if taken: `MotoTrack GPS Pro`

### Short description (max 80)
```
Live GPS tracking, playback, reports and alerts for your vehicles.
```
Bangla (add under Manage translations → Bangla):
```
আপনার গাড়ির লাইভ জিপিএস ট্র্যাকিং, প্লেব্যাক, রিপোর্ট ও অ্যালার্ট।
```

### Full description (max 4000)
```
Mototrack Pro is the official MotoTrack24 app for customers. See where your vehicles are, right now, from your phone.

LIVE TRACKING
• See every vehicle on the map in real time, with its speed, status and direction.
• Know at a glance which vehicles are moving, idling, parked or offline.
• Live speedometer with total and today's kilometres for each vehicle.
• Map styles: standard, satellite, hybrid, terrain and OpenStreetMap, plus Street View.

PLAYBACK
• Replay any trip for today, yesterday, the last 7 days or a custom time range.
• See stops, distance, driving and parking time, and the journey timeline with addresses.

REPORTS
• Daily, monthly and hourly distance, trips, speed, locations, activity, engine, fuel and movement reports.
• Download reports as PDF, Excel or CSV.

ALERTS AND NOTIFICATIONS
• Instant push alerts: overspeed, geofence in and out, ignition on and off, idle, offline and more.
• Today's alerts at a glance, with older alerts one tap away.
• Switch alarms on or off from Alarm settings.

GEOFENCES AND SPEED LIMITS
• Draw a geofence on the map and get an alert when a vehicle leaves it.
• Set an overspeed limit for each vehicle.

RENEW AND PAY
• See when each vehicle's service ends and renew from the app.

CERTIFICATES AND WARRANTY
• View or download the certificate of each device.
• See the warranty countdown of every device.

MORE
• Share a vehicle's live location.
• English and Bangla.
• Light and dark mode.

You need a MotoTrack24 account to use the app. Log in with the phone number or email and password you use on mototrack24.com. For help call the support number on the login screen.
```
Bangla full description (translation):
```
মোটোট্র্যাক প্রো হলো মোটোট্র্যাক২৪-এর গ্রাহকদের জন্য অফিসিয়াল অ্যাপ। আপনার ফোন থেকেই এখনই দেখুন আপনার গাড়ি কোথায়।

লাইভ ট্র্যাকিং
• মানচিত্রে প্রতিটি গাড়ি রিয়েল-টাইমে দেখুন: গতি, অবস্থা ও দিকসহ।
• কোন গাড়ি চলছে, ইঞ্জিন চালু, পার্ক করা বা অফলাইন, এক নজরে জানুন।
• প্রতিটি গাড়ির লাইভ স্পিডোমিটার এবং মোট ও আজকের কিলোমিটার।
• মানচিত্রের ধরন: স্ট্যান্ডার্ড, স্যাটেলাইট, হাইব্রিড, টেরেইন, ওপেনস্ট্রিটম্যাপ এবং স্ট্রিট ভিউ।

প্লেব্যাক
• আজ, গতকাল, গত ৭ দিন বা নিজের পছন্দের সময়ের যেকোনো ট্রিপ আবার দেখুন।
• স্টপ, দূরত্ব, চলা ও পার্কিংয়ের সময় এবং ঠিকানাসহ যাত্রার টাইমলাইন দেখুন।

রিপোর্ট
• দৈনিক, মাসিক ও ঘণ্টাভিত্তিক দূরত্ব, ট্রিপ, গতি, অবস্থান, কার্যক্রম, ইঞ্জিন, জ্বালানি ও চলাচলের রিপোর্ট।
• রিপোর্ট পিডিএফ, এক্সেল বা সিএসভি হিসেবে ডাউনলোড করুন।

অ্যালার্ট ও নোটিফিকেশন
• তাৎক্ষণিক পুশ অ্যালার্ট: ওভারস্পিড, জিওফেন্স, ইগনিশন চালু/বন্ধ, অলস ও অফলাইন এবং আরও।
• আজকের অ্যালার্ট এক নজরে, পুরনো অ্যালার্ট এক ট্যাপে।
• অ্যালার্ম সেটিংস থেকে অ্যালার্ম চালু বা বন্ধ করুন।

জিওফেন্স ও গতির সীমা
• মানচিত্রে জিওফেন্স আঁকুন এবং গাড়ি বাইরে গেলে অ্যালার্ট পান।
• প্রতিটি গাড়ির জন্য ওভারস্পিড সীমা ঠিক করুন।

নবায়ন ও পেমেন্ট
• প্রতিটি গাড়ির সেবার মেয়াদ কবে শেষ দেখুন এবং অ্যাপ থেকেই নবায়ন করুন।

সার্টিফিকেট ও ওয়ারেন্টি
• প্রতিটি ডিভাইসের সার্টিফিকেট দেখুন বা ডাউনলোড করুন।
• প্রতিটি ডিভাইসের ওয়ারেন্টির কাউন্টডাউন দেখুন।

আরও
• গাড়ির লাইভ লোকেশন শেয়ার করুন।
• ইংরেজি ও বাংলা।
• লাইট ও ডার্ক মোড।

অ্যাপ ব্যবহারের জন্য মোটোট্র্যাক২৪ অ্যাকাউন্ট দরকার। mototrack24.com-এ যে ফোন নম্বর বা ইমেইল ও পাসওয়ার্ড ব্যবহার করেন, সেটি দিয়ে লগ ইন করুন।
```

### Release notes (What's new, max 500 per language)
```
First release of Mototrack Pro: live tracking, playback, reports, alerts, geofences, renewals, certificates and warranty.
```

---------------------------------------------------------------------------------------------------------------------

## 3. Store listing: graphics (you must prepare these)

| Asset | Required size | Format | Notes |
|---|---|---|---|
| **App icon** | **512 × 512 px** | PNG (32-bit, up to 1 MB) | Orange `#FF4F01` background with the white pin logo (the same as the phone icon). The pin file is `android/app/src/main/res/drawable-nodpi/ic_launcher_logo.webp` (500×500, transparent). Put it on an orange square, export PNG 512×512. No rounded corners (Play rounds it). |
| **Feature graphic** | **1024 × 500 px** | PNG or JPG, no transparency | Wordmark logo + a short line, e.g. "Track your vehicles live". Keep text away from the edges. |
| **Phone screenshots** | min 2, up to 8. 16:9 or 9:16, each side 320 to 3840 px | PNG or JPG | Take from the app (real phone, 1080×2400 ideal). Suggested set below. |
| 7-inch / 10-inch tablet screenshots | optional | | Not needed. |

Suggested screenshots, in this order:
1. Home (counts + banner + Recharge now)
2. Vehicle details with the speedometer
3. Live map
4. Vehicles list
5. Playback with the journey timeline
6. Alerts (today)
7. Reports hub
8. Profile menu (Certificates, Warranty)

Tip: log in with a demo account, not a real customer, so no real plates or names appear in public screenshots.

---------------------------------------------------------------------------------------------------------------------

## 4. App content: answers for the Play Console forms

### 4.1 Basic information
| Field | Answer |
|---|---|
| App or game | App |
| Free or paid | Free |
| Category | **Maps & Navigation** (alternative: Auto & Vehicles) |
| Tags | Vehicle tracking, GPS tracker, Fleet |
| Contact email | `mototrackgps@gmail.com` (use the support email you want public) |
| Contact phone | support number printed on the login screen |
| Website | https://mototrack24.com |

### 4.2 Privacy policy (required)
```
https://mototrack24.com/privacy
```
(The page already exists on the server. Open it in a browser first to make sure it loads without login. It should mention: account details, vehicle location data, device tokens for notifications, how long data is kept, and how to delete the account.)

### 4.3 Account deletion (required because the app has accounts)
- **In the app:** Profile → **Delete my account** (already built).
- **Play Console asks for a web link** to request deletion. Use:
  ```
  https://mototrack24.com/delete-account
  ```
  (a public page; upload the backend files listed in `backend-patch/README.txt` first and test the link in a browser).

### 4.4 App access (reviewers must be able to log in)
Choose **"All or some functionality is restricted"** and give a test account:
```
Instructions:  Open the app, enter the phone number and password below, tap SIGN IN.
Phone/email:   <create a demo customer on mototrack24.com with 2 or 3 demo vehicles>
Password:      <its password>
Notes:         Live data needs vehicles that report. Use the demo account only.
```
Do **not** give a real customer's account. Create a dedicated demo user.

### 4.5 Ads
**No, the app does not contain ads.**

### 4.6 Content rating (IARC questionnaire)
Answer **No** to violence, sexual content, language, drugs, gambling, user-generated content, location sharing with strangers.
The app shares a vehicle's live location only through a link the customer creates (Share). Choose "No" for "users can interact/exchange content".
Expected result: **Everyone / PEGI 3**.

### 4.7 Target audience
**18 and over** (business and vehicle owners). Not designed for children.

### 4.8 Government apps / News apps / COVID / Financial features
- Government app: **No**
- News app: **No**
- Health: **No**
- **Financial features:** the app lets customers pay a service renewal with DGePay. Choose **"My app doesn't provide financial services"** (it is a payment for the company's own service, not a bank or loan feature). If the form insists, declare "Payments".

### 4.9 Data safety form

Does your app collect or share any of the required user data types? **Yes**
Is all data encrypted in transit? **Yes** (HTTPS only)
Can users request data deletion? **Yes** (in-app and web, see 4.3)

| Data type | Collected | Shared | Purpose | Optional? |
|---|---|---|---|---|
| **Personal info → Name** | Yes | No | Account management | No |
| **Personal info → Email address** | Yes | No | Account management | No |
| **Personal info → Phone number** | Yes | No | Account management, login | No |
| **Location → Precise location** | Yes | No | App functionality (vehicle tracker position shown to its owner; the phone's own location only when "My location" is pressed) | Phone location is optional |
| **App activity / App interactions** | No | | | |
| **Device or other IDs** | Yes | No | App functionality (Firebase push notification token) | No |
| **Photos and files** | No | | | |
| **Financial info → Payment info** | **No.** Card details are entered on the DGePay page, never in the app | | | |
| **Financial info → Purchase history** | Yes (service renewals and payments) | No | App functionality | No |
| **App info and performance → Crash logs** | No (no crash SDK installed) | | | |

"Shared": answer **No** for everything. Data goes to the company's own server, Firebase (service provider for push) and DGePay (payment processor). Those are service providers acting for the app; Play counts them as "not shared" when used only to run the service.

### 4.10 Permissions declaration
| Permission | Why (use this wording if asked) |
|---|---|
| `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` | Optional "My location" button on the vehicle map, to show the customer's own position next to their vehicle and to give route distances. Not used in the background. |
| `POST_NOTIFICATIONS` | Vehicle alerts (overspeed, geofence, ignition). |
| `INTERNET` | Server connection. |
| `WRITE_EXTERNAL_STORAGE` (Android 9 and older only) | Saving a downloaded certificate PDF into Downloads. |

The app does **not** use background location, so no "background location" declaration is needed.

### 4.11 Other declarations
- **Advertising ID:** No (the app does not use it). If the form lists it as used by a library, answer "No, not for ads".
- **Health Connect, SMS, call log, accessibility, VPN, exact alarm:** none used.

---------------------------------------------------------------------------------------------------------------------

## 5. Release steps (in order)

1. Fix section 0.
2. Build the AAB (section 1).
3. Play Console → **Create app** → name, default language English (United States) or English, App, Free, accept the declarations.
4. **Set up your app** checklist: fill 4.1 to 4.11, privacy policy, app access, ads, content rating, target audience, data safety.
5. **Main store listing**: text (section 2) and graphics (section 3). Add Bangla as a translation.
6. **Testing → Internal testing → Create new release** → upload `app-release.aab` → release notes → Save → Review → Roll out to internal testing.
7. **Testers**: add your email list; open the opt-in link on the phone; install **from Play**; test login, live map, notifications, payment (small real amount), certificate download, forced update.
8. When it is good: **Production → Create new release** → add the same AAB (or promote from internal) → countries (Bangladesh, and others if you want) → send for review.
9. First review takes from a few hours up to several days.

New personal developer accounts (created after Nov 2023) must run a **closed test with at least 12 testers for 14 days** before Production is allowed. If your account is new, create a Closed testing track, add 12+ testers, keep them opted in for 14 days, then apply for production access. Organization accounts are exempt.

---------------------------------------------------------------------------------------------------------------------

## 6. For every later update

1. Raise `versionCode` by 1 (and `versionName`) in `android/app/build.gradle`.
2. `.\gradlew bundleRelease`
3. Upload the new AAB, add release notes, roll out.
4. The forced-update screen will bring customers to it.

## 7. Files in this project that matter for the store

| File | Purpose |
|---|---|
| `android/app/build/outputs/bundle/release/app-release.aab` | upload |
| `android/app/mototrack-upload.keystore` | your upload key (secret, back it up) |
| `C:\Users\Squad\.gradle\gradle.properties` | the four key settings (secret) |
| `android/app/google-services.json` | Firebase config (already in the build) |
| `.env` | live API / Maps / DGePay values baked into the release |
| `backend-patch/` | server files to upload (delete the folder after) |
