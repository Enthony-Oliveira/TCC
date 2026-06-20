import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ActivityIndicator, View } from "react-native"; // <-- Importamos para a tela de carregamento

// IMPORTAÇÕES DO FIREBASE
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

// SUAS TELAS
import Cadastro from "./pages/Cadastro";
import Login from "./pages/Login";
import Menu from "./pages/Menu";
import Passagens from "./pages/passagens";
import Recarga from "./pages/Recarga";
import Extrato from "./pages/Extrato";
import AdicionarCartao from "./pages/AdicionarCartao";
import Declaracao from "./pages/Declaracao";

const Stack = createStackNavigator();

export default function App() {
  // ESTADOS PARA CONTROLAR O ACESSO
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Esse é o "vigia" do Firebase. Ele roda assim que o App abre.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user); // Guarda quem é o usuário (ou null se não tiver ninguém)
      setCarregando(false); // Avisa que o Firebase já deu a resposta
    });

    return unsubscribe; // Limpa a memória quando o app fecha
  }, []);

  // Enquanto o Firebase não responde, mostramos um ícone de carregamento
  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0A2A66" }}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* A MÁGICA ACONTECE AQUI NO initialRouteName:
        Se 'usuario' existir (logado), a primeira tela é o Menu.
        Se não existir (deslogado), a primeira tela é o Cadastro.
      */}
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={usuario ? "Menu" : "Cadastro"} 
      >
        <Stack.Screen name="Cadastro" component={Cadastro} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Menu" component={Menu} />
        <Stack.Screen name="Passagens" component={Passagens} />
        <Stack.Screen name="Recarga" component={Recarga} />
        <Stack.Screen name="Extrato" component={Extrato} />
        <Stack.Screen name="Declaracao" component={Declaracao} />
        <Stack.Screen name="AdicionarCartao" component={AdicionarCartao} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}