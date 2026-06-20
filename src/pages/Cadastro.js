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
  KeyboardAvoidingView, // <-- NOVO: Controla o comportamento do teclado
  ScrollView,           // <-- NOVO: Permite rolar a tela
  Platform,             // <-- NOVO: Identifica se é Android ou iOS
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// IMPORTAÇÕES DO FIREBASE
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Cadastro({ navigation }) {
  // ESTADOS PARA CAPTURAR OS TEXTOS
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  // FUNÇÃO PARA MASCARAR O CPF (XXX.XXX.XXX-XX)
  const formatarCPF = (texto) => {
    let num = texto.replace(/\D/g, "");
    num = num.replace(/(\d{3})(\d)/, "$1.$2");
    num = num.replace(/(\d{3})(\d)/, "$1.$2");
    num = num.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return num;
  };

  // FUNÇÃO DE CADASTRO COM FIREBASE
  const handleCriarConta = async () => {
    if (!nome || !cpf || !email || !senha) {
      Alert.alert("Atenção", "Por favor, preencha todos os campos!");
      return;
    }

    if (cpf.length < 14) {
      Alert.alert("Atenção", "Por favor, digite um CPF válido.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        senha,
      );
      const user = userCredential.user;

      await setDoc(doc(db, "usuarios", user.uid), {
        nome: nome,
        cpf: cpf,
        email: email,
        criadoEm: new Date(),
      });

      Alert.alert("Sucesso!", "Sua conta foi criada com sucesso!");
      navigation.navigate("Login");
    } catch (error) {
      console.log(error.code);

      if (error.code === "auth/email-already-in-use") {
        Alert.alert("Erro", "Este e-mail já está cadastrado.");
      } else if (error.code === "auth/weak-password") {
        Alert.alert("Erro", "A senha precisa ter pelo menos 6 caracteres.");
      } else if (error.code === "auth/invalid-email") {
        Alert.alert("Erro", "O formato do e-mail é inválido.");
      } else {
        Alert.alert("Erro", "Não foi possível criar a conta. Tente novamente.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A2A66" />

      {/* O Header fica fixo no topo */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="bus" size={80} color="white" />
        <Text style={styles.headerText}>Recarga Buss</Text>
      </View>

      {/* Envolvendo o formulário com KeyboardAvoidingView e ScrollView */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <Text style={styles.title}>Cadastro</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome Completo"
              placeholderTextColor="#666"
              value={nome}
              onChangeText={setNome}
            />
            
            <TextInput
              style={styles.input}
              placeholder="CPF"
              keyboardType="numeric"
              placeholderTextColor="#666"
              value={cpf}
              maxLength={14}
              onChangeText={(texto) => setCpf(formatarCPF(texto))}
            />
            
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

            <TouchableOpacity style={styles.buttonMain} onPress={handleCriarConta}>
              <Text style={styles.buttonMainText}>Criar Conta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.buttonSecondaryText}>
                Já tem conta? Fazer Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    backgroundColor: "#0A2E6E",
    height: "30%",
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerText: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 10,
  },
  form: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 20, // <-- Adicionado um pequeno espaçamento no fundo para a rolagem ficar confortável
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
    backgroundColor: "#0A2E6E",
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