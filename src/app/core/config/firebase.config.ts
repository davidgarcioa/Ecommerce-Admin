import { InjectionToken } from '@angular/core';
import { FirebaseOptions } from 'firebase/app';

export const FIREBASE_CONFIG = new InjectionToken<FirebaseOptions>('FIREBASE_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    apiKey: 'AIzaSyDhvzu6gXlQLEB1Ewm35ys70eSOP7ZyZPQ',
    authDomain: 'likoba-f4a5b.firebaseapp.com',
    projectId: 'likoba-f4a5b',
    storageBucket: 'likoba-f4a5b.firebasestorage.app',
    messagingSenderId: '1081428247156',
    appId: '1:1081428247156:web:b49c90504dd7e26e61c721',
  }),
});
