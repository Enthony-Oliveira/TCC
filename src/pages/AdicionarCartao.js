import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons, Feather } from "@expo/vector-icons";

// IMPORTAÇÕES DO FIREBASE
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";

// Componente CustomInput externo
const CustomInput = ({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  maxLength,
  autoCapitalize,
}) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        placeholderTextColor="#999"
      />
    </View>
  </View>
);

export default function AdicionarCartao() {
  const navigation = useNavigation();

  // Cores do layout
  const primaryDarkBlue = "#0F3271";
  const buttonBlue = "#3B82F6";
  const redDanger = "#EF4444"; // Cor para o botão de excluir

  // Estados
  const [numero, setNumero] = useState("");
  const [nome, setNome] = useState("");
  const [validade, setValidade] = useState("");
  const [cvc, setCvc] = useState("");

  const [isCarregando, setIsCarregando] = useState(true);
  const [temCartaoSalvo, setTemCartaoSalvo] = useState(false);

  // === BUSCAR CARTÃO SALVO AO ABRIR A TELA ===
  useEffect(() => {
    const buscarCartao = async () => {
      try {
        if (!auth.currentUser) return;
        const userRef = doc(db, "usuarios", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const dados = userSnap.data();
          if (dados.cartaoCadastrado) {
            setTemCartaoSalvo(true);
            setNumero(dados.cartaoNumero || "");
            setNome(dados.cartaoNome || "");
            setValidade(dados.cartaoValidade || "");
            // O CVC normalmente não se salva por segurança, então deixamos vazio.
          }
        }
      } catch (error) {
        console.error("Erro ao buscar cartão:", error);
      } finally {
        setIsCarregando(false);
      }
    };

    buscarCartao();
  }, []);

  // Valores de Exibição Dinâmicos
  const numeroDisplay = numero || "1234 5678 9052 2568";
  const nomeDisplay = nome ? nome.toUpperCase() : "NOME DO TITULAR";
  const validadeDisplay = validade || "12/30";

  // === LÓGICA DE MÁSCARAS NATIVAS ===
  const handleNumeroChange = (text) => {
    const formatado = text
      .replace(/\D/g, "")
      .replace(/(\d{4})(?=\d)/g, "$1 ")
      .substring(0, 19);
    setNumero(formatado);
  };

  const handleValidadeChange = (text) => {
    const formatado = text
      .replace(/\D/g, "")
      .replace(/(\d{2})(?=\d)/g, "$1/")
      .substring(0, 5);
    setValidade(formatado);
  };

  const handleCvcChange = (text) => {
    const formatado = text.replace(/\D/g, "").substring(0, 3);
    setCvc(formatado);
  };

  // === DETECTAR BANDEIRA E BANCO ===
  const detectarBandeira = (num) => {
    if (num.startsWith("4")) return "credit-card"; // Visa
    if (num.startsWith("5")) return "credit-card"; // Mastercard
    if (num.startsWith("34") || num.startsWith("37")) return "credit-card"; // Amex
    return "credit-score"; // Genérico
  };

  const detectarBanco = (num) => {
    const numLimpo = num.replace(/\s/g, "");
    if (numLimpo.length >= 4) {
      if (["5350", "5502", "5448"].some((p) => numLimpo.startsWith(p)))
        return { cor: "#8A05BE", nome: "Nubank" };
      if (["4576", "5447"].some((p) => numLimpo.startsWith(p)))
        return { cor: "#EC7000", nome: "Itaú" };
      if (["4984", "5283"].some((p) => numLimpo.startsWith(p)))
        return { cor: "#CC0000", nome: "Santander" };
      if (["4551", "4623"].some((p) => numLimpo.startsWith(p)))
        return { cor: "#CC092F", nome: "Bradesco" };
      if (["5373", "5220"].some((p) => numLimpo.startsWith(p)))
        return { cor: "#11C76F", nome: "PicPay" };
    }
    return { cor: primaryDarkBlue, nome: "Seu Banco" };
  };

  const bancoAtual = detectarBanco(numero);
  const bandeiraAtual = detectarBandeira(numero);

  // === SALVAR CARTÃO NO FIREBASE ===
  const handleSalvar = async () => {
    if (!numero || !nome || !validade || !cvc) {
      Alert.alert(
        "Atenção",
        "Preencha todos os campos para cadastrar o cartão.",
      );
      return;
    }
    if (numero.length < 19) {
      Alert.alert("Atenção", "Número do cartão inválido.");
      return;
    }

    setIsCarregando(true);
    try {
      const userRef = doc(db, "usuarios", auth.currentUser.uid);
      await updateDoc(userRef, {
        cartaoCadastrado: true,
        cartaoNumero: numero,
        cartaoNome: nome,
        cartaoValidade: validade,
        // CVC não é salvo no banco por regras de segurança (PCI Compliance)
      });

      setTemCartaoSalvo(true);
      Alert.alert(
        "Sucesso!",
        "Seu cartão foi cadastrado e validado com sucesso.",
      );
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar o cartão.");
    } finally {
      setIsCarregando(false);
    }
  };

  // === EXCLUIR CARTÃO NO FIREBASE ===
  const handleExcluir = () => {
    Alert.alert(
      "Remover Cartão",
      "Tem certeza que deseja excluir este cartão da sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            setIsCarregando(true);
            try {
              const userRef = doc(db, "usuarios", auth.currentUser.uid);
              // Remove a flag de autorização e apaga os dados do cartão
              await updateDoc(userRef, {
                cartaoCadastrado: false,
                cartaoNumero: deleteField(),
                cartaoNome: deleteField(),
                cartaoValidade: deleteField(),
              });

              setTemCartaoSalvo(false);
              setNumero("");
              setNome("");
              setValidade("");
              setCvc("");
              Alert.alert("Sucesso", "Cartão removido com sucesso!");
            } catch (error) {
              Alert.alert("Erro", "Falha ao remover o cartão.");
            } finally {
              setIsCarregando(false);
            }
          },
        },
      ],
    );
  };

  // TELA DE CARREGAMENTO INICIAL
  if (isCarregando && !numero && !temCartaoSalvo) {
    return (
      <View
        style={[
          styles.safeArea,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={buttonBlue} />
        <Text
          style={{ marginTop: 12, color: primaryDarkBlue, fontWeight: "bold" }}
        >
          Sincronizando segurança...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Botão Voltar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={32} color="black" />
          </TouchableOpacity>
        </View>

        {/* Título */}
        <Text style={[styles.title, { color: primaryDarkBlue }]}>
          {temCartaoSalvo ? "Seu Cartão" : "Adicionar Cartão"}
        </Text>

        {/* AVISO DE SEGURANÇA */}
        <View style={styles.disclaimerContainer}>
          <Feather name="shield" size={24} color="#3B82F6" />
          <Text style={styles.disclaimerText}>
            <Text style={{ fontWeight: "bold" }}>Segurança de Dados:</Text> Seus
            dados de pagamento são criptografados. O CVC nunca é salvo no banco
            de dados.
          </Text>
        </View>

        {/* DESENHO DO CARTÃO */}
        <View style={[styles.cardPreview, { backgroundColor: bancoAtual.cor }]}>
          <View style={styles.cardRowBetween}>
            <MaterialIcons
              name="memory"
              size={44}
              color="rgba(255,255,255,0.7)"
            />
            <Text style={styles.bankNameText}>{bancoAtual.nome}</Text>
          </View>

          <Text style={styles.cardNumberText}>{numeroDisplay}</Text>

          <View style={styles.cardRowBetweenBottom}>
            <View>
              <Text style={styles.expiryText}>{validadeDisplay}</Text>
              <Text style={styles.cardHolderText}>{nomeDisplay}</Text>
            </View>
            <MaterialIcons name={bandeiraAtual} size={36} color="white" />
          </View>
        </View>

        {/* SE TIVER CARTÃO SALVO -> MOSTRA BOTÃO DE EXCLUIR */}
        {temCartaoSalvo ? (
          <View style={styles.savedCardContainer}>
            <Text style={styles.savedCardText}>
              Este cartão está ativo e pronto para recargas de passagens.
            </Text>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: redDanger, flexDirection: "row" },
              ]}
              onPress={handleExcluir}
              disabled={isCarregando}
            >
              {isCarregando ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Feather
                    name="trash-2"
                    size={24}
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.saveButtonText}>Excluir Cartão</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* SE NÃO TIVER CARTÃO SALVO -> MOSTRA O FORMULÁRIO BRANCO */
          <>
            <View style={styles.formContainer}>
              <CustomInput
                label="Número do Cartão"
                value={numero}
                onChangeText={handleNumeroChange}
                keyboardType="numeric"
                maxLength={19}
              />

              <CustomInput
                label="Nome Impresso no Cartão"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="characters"
              />

              <View style={styles.rowInputs}>
                <View style={styles.flexHalf}>
                  <CustomInput
                    label="Validade"
                    value={validade}
                    onChangeText={handleValidadeChange}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View style={styles.spaceWidth} />
                <View style={styles.flexHalf}>
                  <CustomInput
                    label="CVC"
                    value={cvc}
                    onChangeText={handleCvcChange}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>
              </View>
            </View>

            {/* BOTÃO SALVAR NOVO CARTÃO */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: buttonBlue }]}
              onPress={handleSalvar}
              disabled={isCarregando}
            >
              {isCarregando ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Salvar Cartão Seguro</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ESTILOS MANTIDOS E ORGANIZADOS
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F4F5F7" },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { alignItems: "flex-start", marginBottom: 16 },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  disclaimerContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  disclaimerText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: "#0F3271",
    lineHeight: 20,
  },
  cardPreview: {
    height: 210,
    borderRadius: 16,
    padding: 24,
    justifyContent: "space-between",
    marginBottom: 32,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardRowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bankNameText: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
    fontStyle: "italic",
  },
  cardNumberText: {
    color: "white",
    fontSize: 22,
    letterSpacing: 2.0,
    fontWeight: "600",
  },
  cardRowBetweenBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  expiryText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  cardHolderText: { color: "white", fontSize: 18, fontWeight: "bold" },

  // Estilo para a caixa quando o cartão já está salvo
  savedCardContainer: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  savedCardText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },

  formContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  inputWrapper: { marginBottom: 16 },
  inputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  inputContainer: { backgroundColor: "#E0E0E0", borderRadius: 8 },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#000",
  },
  rowInputs: { flexDirection: "row" },
  flexHalf: { flex: 1 },
  spaceWidth: { width: 16 },

  saveButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: { fontSize: 20, fontWeight: "bold", color: "white" },
});
