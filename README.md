# Afya-Vault (Production Website)

This scaffold is a production-style single web app for Afya-Vault built for Firebase Hosting with Firebase Authentication and Firestore as the backend database.

## What this package contains
- Single web app for Patients and Providers (role-based dashboards)
- Firebase Authentication (email/password)
- Firestore collections: users, patients, records, appointments
- Provider record signing (locks record from edits by others)
- Ready for Firebase Hosting (firebase.json and .firebaserc included)
- /assets folder for images (replace doctor-hero.png with your photo)

## Setup & Deployment (Firebase Hosting)
1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Authentication** (Email/Password) and **Firestore** (in production mode)
3. Replace `firebase-config.js` with your web config found in Project Settings > General > Your apps
4. Update `.firebaserc` with your project id
5. (Optional) Install Firebase CLI: `npm install -g firebase-tools` and login: `firebase login`
6. Deploy: `firebase deploy --only hosting` from the project root

## Security
Security guidance is included here and explained in the project README. **You must** set Firestore rules in the Firebase Console to enforce role-based access and prevent unauthorized writes. Example rules are provided in the documentation; apply them before taking the site to production.

## Notes
- The "Sign & Lock" feature marks records as signed in Firestore. For strong tamper-proofing, integrate server-side cryptographic signing (KMS/HSM) and verification.

Built for Said Ali — Afya-Vault
