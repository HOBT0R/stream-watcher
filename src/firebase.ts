import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const useEmulator = import.meta.env.VITE_USE_AUTH_EMULATOR === 'true';

let firebaseConfig;

if (useEmulator) {
  firebaseConfig = {
    apiKey: 'fake-api-key',
    authDomain: 'localhost',
    projectId: 'stream-watcher-dev',
    storageBucket: 'stream-watcher-dev.appspot.com',
    messagingSenderId: 'fake-sender-id',
    appId: 'fake-app-id',
  };
} else {
  // Your web app's Firebase configuration
  firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

if (useEmulator) {
  const emulatorHost = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || 'localhost:9099';
  connectAuthEmulator(auth, `http://${emulatorHost}`);
} 