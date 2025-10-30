
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBOXlrV2E8EUUZl5uMYDCdMWy_UXEnht88",
  authDomain: "afya-vault-c8372.firebaseapp.com",
  projectId: "afya-vault-c8372",
  storageBucket: "afya-vault-c8372.firebasestorage.app",
  messagingSenderId: "295891002235",
  appId: "1:295891002235:web:6c5d66b918ab54aaa513de",
  measurementId: "G-W6HPJ1D5N4"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
