import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  Auth,
} from 'firebase/auth';
// @ts-ignore — getReactNativePersistence is exported at runtime but not in the TS types
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from './config';

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function getApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) {
    const app = getApp();
    try {
      _auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      // Auth already initialized (e.g. Fast Refresh) — reuse existing instance
      _auth = getAuth(app);
    }
  }
  return _auth;
}

export function getFirebaseDb(): Firestore {
  if (!_db) {
    _db = getFirestore(getApp());
  }
  return _db;
}
