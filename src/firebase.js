import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Suas chaves de configuração que você acabou de copiar
const firebaseConfig = {
  apiKey: "AIzaSyBFXbIQEq6docp3DVZLRBQO4WjwokRF6_A",
  authDomain: "monitor-coimbra.firebaseapp.com",
  databaseURL: "https://monitor-coimbra-default-rtdb.firebaseio.com",
  projectId: "monitor-coimbra",
  storageBucket: "monitor-coimbra.firebasestorage.app",
  messagingSenderId: "117676113712",
  appId: "1:117676113712:web:239f07951033a5628492f5"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta o Realtime Database para usarmos no resto do projeto
export const db = getDatabase(app);