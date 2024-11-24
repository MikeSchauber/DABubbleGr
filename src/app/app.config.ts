import { ApplicationConfig } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        apiKey: "AIzaSyB8af0a2TmEVm4i3E02PZ2tXRHMc7Ih69c",
        authDomain: "dabubble382.firebaseapp.com",
        projectId: "dabubble382",
        storageBucket: "dabubble382.appspot.com",  
        messagingSenderId: "1025519789933",
        appId: "1:1025519789933:web:641a80f3ee273246159c64",
        measurementId: "G-0SYEDTFX53",
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
  ],
};
