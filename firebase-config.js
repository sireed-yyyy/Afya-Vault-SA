// Replace the values below with your Firebase project config and save as firebase-config.js
const firebaseConfig = {
  apiKey: "REPLACE_API_KEY",
  authDomain: "REPLACE_AUTH_DOMAIN",
  projectId: "REPLACE_PROJECT_ID",
  storageBucket: "REPLACE_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_MESSAGING_SENDER_ID",
  appId: "REPLACE_APP_ID"
};
if(Object.keys(firebaseConfig).length) {
  firebase.initializeApp(firebaseConfig);
  console.log('Firebase ready');
} else {
  console.warn('Firebase config missing - please configure firebase-config.js');
}
