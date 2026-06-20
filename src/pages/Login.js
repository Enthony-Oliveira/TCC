import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// IMPORTAÇÕES DO FIREBASE
import { auth } from "../firebaseConfig"; 
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Login({ navigation }) {
  // 1. ESTADOS PARA CAPTURAR O QUE O USUÁRIO DIGITA
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  // 2. FUNÇÃO DE LOGIN ASSÍNCRONA COM O FIREBASE
  const handleLogin = async () => {
    // Validação para não deixar o usuário tentar logar com campos vazios
    if (!email || !senha) {
      Alert.alert("Atenção", "Por favor, preencha o e-mail e a senha!");
      return;
    }

    try {
      // Tenta fazer o login no Firebase com os dados digitados
      await signInWithEmailAndPassword(auth, email, senha);
      
      // Se der certo, vai direto para o Menu (usando replace como você configurou)
      navigation.replace("Menu"); 
      
    } catch (error) {
      console.log("Erro no login:", error.code);
      
      // Tratamento para avisar o usuário se ele errar a senha ou o e-mail
      if (
        error.code === "auth/invalid-credential" || 
        error.code === "auth/wrong-password" || 
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-email"
      ) {
        Alert.alert("Erro", "E-mail ou senha incorretos.");
      } else {
        Alert.alert("Erro", "Não foi possível fazer o login. Tente novamente.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A2A66" />

      {/* Cabeçalho Azul - Mantido idêntico */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="bus" size={70} color="white" />
        <Text style={styles.headerText}>Recarga Buss</Text>
      </View>

      <SafeAreaView style={styles.formContainer}>
        <View style={styles.form}>
          <Text style={styles.title}>Tela de Login</Text>

          {/* 3. INPUTS CONECTADOS AOS ESTADOS */}
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            secureTextEntry={true}
            placeholderTextColor="#666"
            value={senha}
            onChangeText={setSenha}
          />

          <TouchableOpacity style={styles.buttonMain} onPress={handleLogin}>
            <Text style={styles.buttonMainText}>Login</Text>
          </TouchableOpacity>

          {/* Link para voltar ao cadastro */}
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={() => navigation.navigate("Cadastro")}
          >
            <Text style={styles.buttonSecondaryText}>Ainda não tem conta? Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    backgroundColor: "#0A2A66",
    height: "30%",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingTop: StatusBar.currentHeight,
  },
  headerText: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "bold",
    marginLeft: 15,
  },
  formContainer: {
    flex: 1,
  },
  form: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#000",
  },
  input: {
    backgroundColor: "#F1F3F5",
    height: 55,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  buttonMain: {
    backgroundColor: "#0A2A66",
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonMainText: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "600",
  },
  buttonSecondary: {
    marginTop: 20,
    alignItems: "center",
  },
  buttonSecondaryText: {
    color: "#3B82F6",
    fontSize: 16,
  },
});