import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  ActivityIndicator,
  Clipboard,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather, MaterialIcons } from "@expo/vector-icons";

// IMPORTAÇÃO DA BIBLIOTECA DE NOTIFICAÇÕES
import * as Notifications from "expo-notifications";

// IMPORTAÇÕES DO FIREBASE
import { auth, db } from "../firebaseConfig";
import {
  doc,
  updateDoc,
  increment,
  collection,
  addDoc,
  getDoc,
} from "firebase/firestore";

// CONFIGURAÇÃO ESSENCIAL: Faz a notificação cair do topo (Heads-up) mesmo com o app aberto!
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export default function Recarga() {
  const navigation = useNavigation();

  // Cores do layout padrão
  const primaryDarkBlue = "#0F3271";
  const buttonBlue = "#3B82F6";
  const pixGreen = "#32BCAD";

  // Estados da tela
  const [valorPassagem, setValorPassagem] = useState(4.65);
  const [quantidade, setQuantidade] = useState(0);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [modalCartaoVisivel, setModalCartaoVisivel] = useState(false);
  const [modalPixVisivel, setModalPixVisivel] = useState(false);
  const [isCarregando, setIsCarregando] = useState(false);

  // 1. VERIFICAR SE É ESTUDANTE PARA APLICAR A MEIA-PASSAGEM
  useEffect(() => {
    async function verificarEstudante() {
      if (auth.currentUser) {
        try {
          const userRef = doc(db, "usuarios", auth.currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const dados = userSnap.data();
            if (dados.isEstudante === true) {
              setValorPassagem(2.35);
            }
          }
        } catch (error) {
          console.log("Erro ao buscar dados de estudante:", error);
        }
      }
    }
    verificarEstudante();
  }, []);

  // 2. SOLICITAR PERMISSÃO E CRIAR CANAL DE NOTIFICAÇÃO
  useEffect(() => {
    async function configurarNotificacoes() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("Permissão para notificações locais não foi concedida.");
        return;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("recargas-channel", {
          name: "Confirmações de Recarga",
          importance: Notifications.AndroidNotificationImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#3B82F6",
        });
      }
    }
    configurarNotificacoes();
  }, []);

  // Funções de controle do contador
  const incrementar = () => setQuantidade(quantidade + 1);
  const decrementar = () => {
    if (quantidade > 0) setQuantidade(quantidade - 1);
  };

  // Cálculos dinâmicos
  const total = quantidade * valorPassagem;
  const totalFormatado = total.toFixed(2).replace(".", ",");
  const isCartaoSelecionado = formaPagamento.startsWith("Cartão");

  // FUNÇÃO EXCLUSIVA PARA DISPARAR O BANNER DO TOPO
  const dispararNotificacaoSucesso = async (tipoPagamento) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Recarga Confirmada! 🚌✨",
          body: `Seu pagamento via ${tipoPagamento} de R$ ${totalFormatado} foi validado. Suas passagens já estão disponíveis!`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
          channelId: "recargas-channel",
        },
      });
    } catch (error) {
      console.log("Erro ao disparar notificação:", error);
    }
  };

  // FUNÇÃO DE RECARGA NO BANCO DE DADOS
  const executarRecargaNoFirebase = async (pagamentoAtual) => {
    setIsCarregando(true);

    try {
      const userUid = auth.currentUser.uid;
      const userRef = doc(db, "usuarios", userUid);

      // Atualização atômica do saldo
      await updateDoc(userRef, {
        saldoPassagens: increment(quantidade),
        passagensTotalHistorico: increment(quantidade),
      });

      // Registro histórico na subcoleção "extrato"
      await addDoc(collection(db, "usuarios", userUid, "extrato"), {
        tipo: "Recarga",
        quantidade: quantidade,
        valorTotal: total,
        valorTotalFormatado: totalFormatado,
        pagamento: pagamentoAtual,
        data: new Date(),
        tipoPassagemAplicada: valorPassagem === 2.35 ? "Meia" : "Inteira",
      });

      // Fecha o modal do PIX se estiver aberto
      setModalPixVisivel(false);

      // 1. Dispara a notificação local passando a forma de pagamento correta
      await dispararNotificacaoSucesso(pagamentoAtual);

      // 2. Retorna para a tela anterior direto
      navigation.goBack();
    } catch (error) {
      console.error("Erro crítico ao processar recarga:", error);
      Alert.alert(
        "Falha na Operação",
        "Não foi possível concluir a recarga. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setIsCarregando(false);
    }
  };

  // FUNÇÃO DO BOTÃO "CONFIRMAR PAGAMENTO"
  const handleBotaoRecarregar = async () => {
    if (quantidade === 0) {
      Alert.alert("Atenção", "Adicione pelo menos 1 passagem para recarregar!");
      return;
    }
    if (formaPagamento === "") {
      Alert.alert("Atenção", "Por favor, selecione uma forma de pagamento!");
      return;
    }
    if (!auth.currentUser) {
      Alert.alert("Erro", "Sessão expirada. Faça login novamente.");
      return;
    }

    if (formaPagamento === "PIX") {
      setModalPixVisivel(true);
      return;
    }

    setIsCarregando(true);
    try {
      const userRef = doc(db, "usuarios", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (!userData.cartaoCadastrado) {
          Alert.alert(
            "Cartão Não Encontrado",
            "Cadastre um cartão válido na aba de dados antes de realizar uma recarga.",
          );
          setIsCarregando(false);
          return;
        }
      }

      await executarRecargaNoFirebase(formaPagamento);
    } catch (error) {
      console.error(error);
      setIsCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Botão Superior de Voltar */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            disabled={isCarregando}
          >
            <Feather name="arrow-left" size={32} color="black" />
          </TouchableOpacity>
        </View>

        {/* Display do Valor Acumulado */}
        <Text style={[styles.title, { color: primaryDarkBlue }]}>Recarga</Text>

        <Text style={[styles.totalText, { color: primaryDarkBlue }]}>
          R$ {totalFormatado}
        </Text>

        <Text
          style={[
            styles.tipoTarifaText,
            { color: valorPassagem === 2.35 ? "#43A047" : "#757575" },
          ]}
        >
          {valorPassagem === 2.35
            ? "✨ Tarifa de Meia-Passagem (Estudante)"
            : "Tarifa Inteira (Vale Transporte)"}
        </Text>

        {/* Componente Seletor de Quantidades */}
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={styles.circleButton}
            onPress={decrementar}
            disabled={isCarregando}
          >
            <Feather name="minus" size={32} color="black" />
          </TouchableOpacity>

          <View style={styles.quantityBox}>
            <Text style={styles.quantityText}>{quantidade}</Text>
          </View>

          <TouchableOpacity
            style={styles.circleButton}
            onPress={incrementar}
            disabled={isCarregando}
          >
            <Feather name="plus" size={32} color="black" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.subtitle, { color: primaryDarkBlue }]}>
          Forma de Pagamento
        </Text>

        {/* Opção Conclusiva: Cartão */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setModalCartaoVisivel(true)}
          disabled={isCarregando}
          style={[
            styles.paymentOption,
            isCartaoSelecionado && {
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderColor: buttonBlue,
            },
          ]}
        >
          <MaterialIcons name="credit-card" size={32} color="black" />
          <Text style={[styles.paymentText, { color: primaryDarkBlue }]}>
            {isCartaoSelecionado ? formaPagamento : "Cartão"}
          </Text>
          <View style={styles.spacer} />
          {isCartaoSelecionado && (
            <MaterialIcons name="check-circle" size={24} color={buttonBlue} />
          )}
        </TouchableOpacity>

        {/* Opção Conclusiva: PIX */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setFormaPagamento("PIX")}
          disabled={isCarregando}
          style={[
            styles.paymentOption,
            formaPagamento === "PIX" && {
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderColor: buttonBlue,
            },
          ]}
        >
          <MaterialIcons name="pix" size={32} color={pixGreen} />
          <Text style={[styles.paymentText, { color: primaryDarkBlue }]}>
            PIX
          </Text>
          <View style={styles.spacer} />
          {formaPagamento === "PIX" && (
            <MaterialIcons name="check-circle" size={24} color={buttonBlue} />
          )}
        </TouchableOpacity>

        <View style={styles.spacer} />

        {/* Gatilho Inicial */}
        <TouchableOpacity
          style={[
            styles.rechargeButton,
            { backgroundColor: buttonBlue },
            { opacity: isCarregando ? 0.7 : 1 },
          ]}
          onPress={handleBotaoRecarregar}
          disabled={isCarregando}
        >
          {isCarregando ? (
            <ActivityIndicator color="#FFF" size="large" />
          ) : (
            <Text style={styles.rechargeButtonText}>Confirmar Pagamento</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* MODAL 1: Escolha do Cartão */}
      <Modal
        visible={modalCartaoVisivel}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={[styles.modalTitle, { color: primaryDarkBlue }]}>
              Escolha a função do cartão
            </Text>

            <TouchableOpacity
              style={[
                styles.modalButtonFilled,
                { backgroundColor: buttonBlue },
              ]}
              onPress={() => {
                setFormaPagamento("Cartão (Crédito)");
                setModalCartaoVisivel(false);
              }}
            >
              <Text style={styles.modalButtonFilledText}>Crédito</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButtonOutlined, { borderColor: buttonBlue }]}
              onPress={() => {
                setFormaPagamento("Cartão (Débito)");
                setModalCartaoVisivel(false);
              }}
            >
              <Text
                style={[styles.modalButtonOutlinedText, { color: buttonBlue }]}
              >
                Débito
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalCartaoVisivel(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: TELA DO PIX */}
      <Modal visible={modalPixVisivel} transparent={true} animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <MaterialIcons
              name="pix"
              size={50}
              color={pixGreen}
              style={{ alignSelf: "center", marginBottom: 16 }}
            />

            <Text style={[styles.modalTitle, { color: primaryDarkBlue }]}>
              Pagamento via PIX
            </Text>

            <Text
              style={{
                textAlign: "center",
                fontSize: 16,
                marginBottom: 8,
                color: "#555",
              }}
            >
              Valor a pagar:
            </Text>
            <Text
              style={{
                textAlign: "center",
                fontSize: 32,
                fontWeight: "bold",
                color: primaryDarkBlue,
                marginBottom: 24,
              }}
            >
              R$ {totalFormatado}
            </Text>

            <View style={styles.pixCodeContainer}>
              <Text
                style={styles.pixCodeText}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426655440000...
              </Text>
            </View>

            {/* BOTÃO CORRIGIDO: Copia o código, altera o estado, executa no Firebase e notifica */}
            <TouchableOpacity
              style={[
                styles.modalButtonFilled,
                {
                  backgroundColor: pixGreen,
                  flexDirection: "row",
                  justifyContent: "center",
                },
              ]}
              onPress={async () => {
                Clipboard.setString(
                  "00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426655440000",
                );
                // Garante que a string do histórico/notificação seja salva explicitamente como "PIX"
                setFormaPagamento("PIX");
                await executarRecargaNoFirebase("PIX");
              }}
              disabled={isCarregando}
            >
              {isCarregando ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Feather
                    name="copy"
                    size={20}
                    color="#FFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.modalButtonFilledText}>
                    Copiar Código PIX
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalPixVisivel(false)}
              style={styles.modalCancelButton}
              disabled={isCarregando}
            >
              <Text style={styles.modalCancelText}>Cancelar Operação</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F4F5F7" },
  container: { flex: 1, padding: 24 },
  backButtonContainer: { alignItems: "flex-start", marginBottom: 16 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  totalText: {
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  tipoTarifaText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 40,
  },
  counterRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  circleButton: {
    width: 50,
    height: 50,
    backgroundColor: "#E0E0E0",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityBox: {
    width: 120,
    height: 50,
    backgroundColor: "#E0E0E0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 16,
  },
  quantityText: { fontSize: 24, fontWeight: "bold", color: "#000" },
  subtitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: 8,
  },
  paymentText: { fontSize: 20, fontWeight: "bold", marginLeft: 12 },
  spacer: { flex: 1 },
  rechargeButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  rechargeButtonText: { fontSize: 20, fontWeight: "bold", color: "#FFF" },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtonFilled: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  modalButtonFilledText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  modalButtonOutlined: {
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
  },
  modalButtonOutlinedText: { fontSize: 16, fontWeight: "bold" },
  modalCancelButton: { marginTop: 16, alignItems: "center" },
  modalCancelText: { color: "#757575", fontSize: 16 },
  pixCodeContainer: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
  },
  pixCodeText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },
});
