# BAAC OUTLET Android

Android wrapper is isolated from the customer PWA so iPhone/iPad behavior is not changed.

Production web origin:
https://baac-smart-outlet-app.pages.dev

Application ID:
th.co.baac.smartoutlet

The Android project uses Trusted Web Activity (TWA). The website remains the source of the customer UI and data.

Before a release build, configure the production signing certificate SHA-256 in the website Digital Asset Links file and sign the Android App Bundle/APK with that same key.
