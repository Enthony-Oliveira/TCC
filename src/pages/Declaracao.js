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
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Notifications from "expo-notifications";

// AJUSTADO: Importado 'deleteDoc'
import { db, auth } from "../firebaseConfig";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function Declaracao() {
  const navigation = useNavigation();

  const primaryDarkBlue = "#0F3271";
  const buttonBlue = "#3B82F6";
  const dangerRed = "#E53935"; // Cor vermelha para o botão de excluir

  const [dataVencimento, setDataVencimento] = useState("");
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingScreen, setIsLoadingScreen] = useState(true);

  // 1. CARREGAR DADOS SALVOS DO FIREBASE AO ABRIR A TELA
  useEffect(() => {
    async function carregarDadosFirebase() {
      try {
        const docRef = doc(db, "declaracoes", "minha_matricula");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const dados = docSnap.data();
          if (dados.dataVencimento) setDataVencimento(dados.dataVencimento);
          if (dados.arquivo) setArquivoSelecionado(dados.arquivo);
        }
      } catch (error) {
        console.log("Erro ao buscar dados do Firebase:", error);
      } finally {
        setIsLoadingScreen(false);
      }
    }
    carregarDadosFirebase();
  }, []);

  // 2. CONFIGURAR NOTIFICAÇÕES
  useEffect(() => {
    async function configurarNotificacoes() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("vencimentos", {
          name: "Alertas de Vencimento",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }
    }
    configurarNotificacoes();
  }, []);

  const handleDataChange = (text) => {
    let formatado = text.replace(/\D/g, "");
    if (formatado.length > 2)
      formatado = formatado.replace(/^(\d{2})(\d)/g, "$1/$2");
    if (formatado.length > 5)
      formatado = formatado.replace(/^(\d{2})\/(\d{2})(\d)/g, "$1/$2/$3");
    setDataVencimento(formatado.substring(0, 10));
  };

  let mensagemPrazo = "";
  let corPrazo = "transparent";

  if (dataVencimento.length === 10) {
    const partes = dataVencimento.split("/");
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const ano = parseInt(partes[2], 10);

    const vencimento = new Date(ano, mes, dia);
    const hoje = new Date();
    vencimento.setHours(0, 0, 0, 0);
    hoje.setHours(0, 0, 0, 0);

    if (vencimento.getDate() !== dia || isNaN(vencimento.getTime())) {
      mensagemPrazo = "Data inválida";
      corPrazo = "#E53935";
    } else {
      const diffTime = vencimento - hoje;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        mensagemPrazo = "Declaração vencida!";
        corPrazo = "#E53935";
      } else if (diffDays === 0) {
        mensagemPrazo = "Vence hoje!";
        corPrazo = "#F57C00";
      } else {
        mensagemPrazo = `Faltam ${diffDays} dias para vencer`;
        corPrazo = "#43A047";
      }
    }
  }

  const selecionarArquivo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setArquivoSelecionado(result.assets[0]);
      }
    } catch (err) {
      console.log("Erro ao selecionar arquivo:", err);
    }
  };

  const agendarNotificacaoVencimento = async () => {
    try {
      const partes = dataVencimento.split("/");
      const dia = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10) - 1;
      const ano = parseInt(partes[2], 10);

      let tituloNotificacao = "Atenção: Matrícula Próxima do Vencimento! ⏳";
      let corpoNotificacao = `Sua declaração de matrícula vence em breve (${dataVencimento}).`;

      let dataNotificacao = new Date(ano, mes, dia - 5, 9, 0, 0);

      if (dataNotificacao <= new Date()) {
        dataNotificacao = new Date(Date.now() + 10000);
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: tituloNotificacao,
          body: corpoNotificacao,
          sound: true,
        },
        trigger: {
          date: dataNotificacao,
          channelId: "vencimentos",
        },
      });

      console.log("Notificação criada com sucesso!");
    } catch (error) {
      console.log("Erro ao agendar notificação:", error);
    }
  };

  // ENVIO PARA O FIRESTORE
  const enviarArquivo = async () => {
    if (
      dataVencimento.length < 10 ||
      mensagemPrazo === "Data inválida" ||
      mensagemPrazo === "Declaração vencida!"
    ) {
      Alert.alert(
        "Atenção",
        "Verifique a data informada. Não é possível enviar uma declaração vencida ou inválida.",
      );
      return;
    }

    if (!arquivoSelecionado) {
      Alert.alert("Atenção", "Selecione um arquivo antes de enviar!");
      return;
    }

    setIsUploading(true);

    try {
      const arquivoParaSalvar = {
        name: arquivoSelecionado.name,
        mimeType: arquivoSelecionado.mimeType || "",
        size: arquivoSelecionado.size || 0,
      };

      await setDoc(doc(db, "declaracoes", "minha_matricula"), {
        dataVencimento: dataVencimento,
        arquivo: arquivoParaSalvar,
        atualizadoEm: new Date().toISOString(),
      });

      const usuarioAtual = auth.currentUser;
      if (usuarioAtual) {
        await setDoc(
          doc(db, "usuarios", usuarioAtual.uid),
          {
            isEstudante: true,
            tipoPassagem: "meia",
          },
          { merge: true },
        );
        console.log(
          "Perfil de estudante ativado com sucesso para o UID:",
          usuarioAtual.uid,
        );
      }

      await agendarNotificacaoVencimento();

      Alert.alert(
        "Sucesso",
        "Declaração salva com sucesso e benefício de estudante ativado!",
        [{ text: "OK" }],
      );
    } catch (error) {
      console.log("Erro ao salvar no Firebase:", error);
      Alert.alert("Erro", "Não foi possível salvar os dados.");
    } finally {
      setIsUploading(false);
    }
  };

  // NOVA FUNÇÃO: EXCLUIR DOCUMENTO E REVERTER PASSAGEM
  const excluirDocumento = async () => {
    Alert.alert(
      "Excluir Declaração",
      "Tem certeza que deseja excluir? Você perderá o benefício da meia-passagem e voltará a pagar o valor integral (R$ 4,35).",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, excluir",
          style: "destructive",
          onPress: async () => {
            setIsUploading(true);
            try {
              // 1. Apaga a declaração do Firebase
              await deleteDoc(doc(db, "declaracoes", "minha_matricula"));

              // 2. Retorna o usuário para passagem normal
              const usuarioAtual = auth.currentUser;
              if (usuarioAtual) {
                await setDoc(
                  doc(db, "usuarios", usuarioAtual.uid),
                  {
                    isEstudante: false,
                    tipoPassagem: "inteira",
                  },
                  { merge: true },
                );
              }

              // 3. Limpa a tela e cancela notificações programadas
              setArquivoSelecionado(null);
              setDataVencimento("");
              await Notifications.cancelAllScheduledNotificationsAsync();

              Alert.alert(
                "Excluído",
                "Sua declaração foi removida e sua tarifa voltou ao normal.",
              );
            } catch (error) {
              console.log("Erro ao excluir:", error);
              Alert.alert("Erro", "Não foi possível excluir o documento.");
            } finally {
              setIsUploading(false);
            }
          },
        },
      ],
    );
  };

  const isPdf =
    arquivoSelecionado?.mimeType === "application/pdf" ||
    arquivoSelecionado?.name?.toLowerCase().endsWith(".pdf");

  if (isLoadingScreen) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={primaryDarkBlue} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={32} color="black" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { color: primaryDarkBlue }]}>
          Declaração{"\n"}de Matrícula
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={dataVencimento}
            onChangeText={handleDataChange}
            keyboardType="numeric"
            placeholder="Data de Vencimento"
            placeholderTextColor="#999"
            maxLength={10}
          />
        </View>

        {mensagemPrazo !== "" && (
          <View style={styles.prazoContainer}>
            <Feather
              name={corPrazo === "#43A047" ? "check-circle" : "alert-circle"}
              size={18}
              color={corPrazo}
            />
            <Text style={[styles.prazoText, { color: corPrazo }]}>
              {mensagemPrazo}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: buttonBlue, marginTop: 24 },
          ]}
          onPress={selecionarArquivo}
        >
          <Text style={styles.buttonText}>Selecionar Arquivo</Text>
        </TouchableOpacity>

        <Text style={styles.helperText}>(PDF/PNG/JPG)</Text>

        <View style={styles.previewBox}>
          {!arquivoSelecionado ? (
            <Feather name="upload-cloud" size={64} color="#666" />
          ) : (
            <View style={styles.previewContent}>
              <MaterialIcons
                name={isPdf ? "picture-as-pdf" : "image"}
                size={64}
                color={buttonBlue}
              />
              <Text style={styles.fileNameText} numberOfLines={2}>
                {arquivoSelecionado.name}
              </Text>
              {arquivoSelecionado.size > 0 && (
                <Text style={styles.fileSizeText}>
                  {(arquivoSelecionado.size / 1024).toFixed(1)} KB
                </Text>
              )}
              {dataVencimento.length === 10 && (
                <Text style={styles.fileDateText}>
                  Vence em: {dataVencimento}
                </Text>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: buttonBlue,
              marginTop: 40,
              opacity: isUploading ? 0.7 : 1,
            },
          ]}
          onPress={enviarArquivo}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Salvar Dados</Text>
          )}
        </TouchableOpacity>

        {/* BOTÃO DE EXCLUIR (Aparece apenas se houver documento selecionado/salvo) */}
        {arquivoSelecionado && (
          <TouchableOpacity
            style={[
              styles.buttonOutlined,
              { borderColor: dangerRed, marginTop: 16 },
            ]}
            onPress={excluirDocumento}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={dangerRed} />
            ) : (
              <View style={styles.deleteButtonContent}>
                <Feather
                  name="trash-2"
                  size={20}
                  color={dangerRed}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.buttonText, { color: dangerRed }]}>
                  Excluir Documento
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F4F5F7" },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { alignItems: "flex-start", marginBottom: 24 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 40,
  },
  inputContainer: { backgroundColor: "#FFFFFF", borderRadius: 12 },
  textInput: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: "#000",
  },
  prazoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  prazoText: { fontSize: 14, fontWeight: "600", marginLeft: 6 },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonOutlined: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  deleteButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: { fontSize: 18, fontWeight: "bold", color: "white" },
  helperText: {
    fontSize: 14,
    color: "#9E9E9E",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  previewBox: {
    height: 240,
    width: "100%",
    backgroundColor: "#F4F5F7",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#BDBDBD",
    justifyContent: "center",
    alignItems: "center",
  },
  previewContent: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  fileNameText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  fileSizeText: { color: "#9E9E9E", fontSize: 14, marginBottom: 4 },
  fileDateText: {
    color: "#0F3271",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
  },
});
