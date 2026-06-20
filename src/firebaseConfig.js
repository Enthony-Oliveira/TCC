import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Suas credenciais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAOKZFwyfMOZJ00kNxyNJADsTZeDZIxQTI",
  authDomain: "recargabusstcc-react-native.firebaseapp.com",
  projectId: "recargabusstcc-react-native",
  storageBucket: "recargabusstcc-react-native.firebasestorage.app",
  messagingSenderId: "466451028527",
  appId: "1:466451028527:web:4b99018014dd2d4eda04da"
};

let app;
let auth;

// Verifica se o Firebase JÁ FOI inicializado (isso evita o erro de duplicate-app no Expo)
if (!getApps().length) {
  // Se não foi inicializado, cria o app e a autenticação do zero
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} else {
  // Se já foi inicializado (por causa do recarregamento automático), reaproveita o app
  app = getApp();
  auth = getAuth(app);
}

// Exporta o banco de dados e a autenticação
export const db = getFirestore(app);
export { auth };