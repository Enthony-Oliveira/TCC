import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  Modal,
  ActivityIndicator // <-- NOVO: Para mostrar a bolinha girando no botão
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather, MaterialIcons } from '@expo/vector-icons'; 

// IMPORTAÇÕES DO FIREBASE
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';

export default function Recarga() {
  const navigation = useNavigation();

  // Cores do seu layout
  const primaryDarkBlue = '#0F3271';
  const buttonBlue = '#3B82F6';
  const VALOR_PASSAGEM = 4.65;

  // Estados
  const [quantidade, setQuantidade] = useState(0);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [modalCartaoVisivel, setModalCartaoVisivel] = useState(false);
  const [isCarregando, setIsCarregando] = useState(false); // <-- NOVO: Controla o estado de carregamento

  // Funções de controle
  const incrementar = () => setQuantidade(quantidade + 1);
  const decrementar = () => {
    if (quantidade > 0) setQuantidade(quantidade - 1);
  };

  // Cálculos dinâmicos
  const total = quantidade * VALOR_PASSAGEM;
  const totalFormatado = total.toFixed(2).replace('.', ',');
  const isCartaoSelecionado = formaPagamento.startsWith('Cartão');

  // FUNÇÃO DE RECARGA COM FIREBASE
  const handleRecarregar = async () => {
    if (quantidade === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos 1 passagem!');
      return;
    }
    if (formaPagamento === '') {
      Alert.alert('Atenção', 'Selecione uma forma de pagamento!');
      return;
    }

    setIsCarregando(true); // Desativa o botão e mostra o carregamento

    try {
      const userUid = auth.currentUser.uid; // Pega o ID do usuário logado
      const userRef = doc(db, "usuarios", userUid);

      // Passo 1: Atualiza o saldo no perfil do usuário
      // O 'increment' do Firebase é inteligente, ele soma a quantidade nova ao saldo atual
      // Passo 1: Atualiza o saldo no perfil do usuário
      await updateDoc(userRef, {
        saldoPassagens: increment(quantidade),
        passagensTotalHistorico: increment(quantidade) // <-- ADICIONE ESTA LINHA!
      });

      // Passo 2: Salva os detalhes da compra na subcoleção "extrato"
      await addDoc(collection(db, "usuarios", userUid, "extrato"), {
        tipo: "Recarga",
        quantidade: quantidade,
        valorTotal: total, // Salva o número puro para facilitar contas futuras
        valorTotalFormatado: totalFormatado, 
        pagamento: formaPagamento,
        data: new Date() // O Firebase vai salvar como um Timestamp (perfeito para ordenar do mais novo pro mais velho depois)
      });

      // Se deu tudo certo, avisa o usuário e volta pro menu
      Alert.alert(
        'Sucesso!', 
        `Recarga de R$ ${totalFormatado} feita com sucesso!`,
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );

    } catch (error) {
      console.error("Erro ao recarregar:", error);
      Alert.alert("Erro", "Não foi possível concluir a recarga. Verifique sua conexão e tente novamente.");
    } finally {
      setIsCarregando(false); // Reativa o botão indepedente de sucesso ou erro
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Botão de voltar */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={isCarregando}>
            <Feather name="arrow-left" size={32} color="black" />
          </TouchableOpacity>
        </View>

        {/* Títulos e Total */}
        <Text style={[styles.title, { color: primaryDarkBlue }]}>Recarga</Text>
        <Text style={[styles.totalText, { color: primaryDarkBlue }]}>
          R$ {totalFormatado}
        </Text>

        {/* Controles de Quantidade */}
        <View style={styles.counterRow}>
          <TouchableOpacity style={styles.circleButton} onPress={decrementar} disabled={isCarregando}>
            <Feather name="minus" size={32} color="black" />
          </TouchableOpacity>

          <View style={styles.quantityBox}>
            <Text style={styles.quantityText}>{quantidade}</Text>
          </View>

          <TouchableOpacity style={styles.circleButton} onPress={incrementar} disabled={isCarregando}>
            <Feather name="plus" size={32} color="black" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.subtitle, { color: primaryDarkBlue }]}>
          Forma de Pagamento
        </Text>

        {/* OPÇÃO: CARTÃO */}
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => setModalCartaoVisivel(true)}
          disabled={isCarregando}
          style={[
            styles.paymentOption,
            isCartaoSelecionado && { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: buttonBlue }
          ]}
        >
          <MaterialIcons name="credit-card" size={32} color="black" />
          <Text style={[styles.paymentText, { color: primaryDarkBlue }]}>
            {isCartaoSelecionado ? formaPagamento : 'Cartão'}
          </Text>
          <View style={styles.spacer} />
          {isCartaoSelecionado && <MaterialIcons name="check-circle" size={24} color={buttonBlue} />}
        </TouchableOpacity>

        {/* OPÇÃO: PIX */}
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => setFormaPagamento('PIX')}
          disabled={isCarregando}
          style={[
            styles.paymentOption,
            formaPagamento === 'PIX' && { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: buttonBlue }
          ]}
        >
          <MaterialIcons name="pix" size={32} color="#32BCAD" />
          <Text style={[styles.paymentText, { color: primaryDarkBlue }]}>PIX</Text>
          <View style={styles.spacer} />
          {formaPagamento === 'PIX' && <MaterialIcons name="check-circle" size={24} color={buttonBlue} />}
        </TouchableOpacity>

        <View style={styles.spacer} />

        {/* BOTÃO RECARREGAR */}
        <TouchableOpacity 
          style={[
            styles.rechargeButton, 
            { backgroundColor: buttonBlue },
            isCarregando && { opacity: 0.7 } // Deixa o botão mais clarinho se estiver carregando
          ]} 
          onPress={handleRecarregar}
          disabled={isCarregando} // Impede cliques duplos
        >
          {isCarregando ? (
            <ActivityIndicator color="#FFF" size="large" />
          ) : (
            <Text style={styles.rechargeButtonText}>Recarregar</Text>
          )}
        </TouchableOpacity>

      </View>

      {/* === MODAL DE ESCOLHA DE CARTÃO === */}
      <Modal visible={modalCartaoVisivel} transparent={true} animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={[styles.modalTitle, { color: primaryDarkBlue }]}>Escolha a função</Text>
            
            <TouchableOpacity 
              style={[styles.modalButtonFilled, { backgroundColor: buttonBlue }]} 
              onPress={() => { setFormaPagamento('Cartão (Crédito)'); setModalCartaoVisivel(false); }}
            >
              <Text style={styles.modalButtonFilledText}>Crédito</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalButtonOutlined, { borderColor: buttonBlue }]} 
              onPress={() => { setFormaPagamento('Cartão (Débito)'); setModalCartaoVisivel(false); }}
            >
              <Text style={[styles.modalButtonOutlinedText, { color: buttonBlue }]}>Débito</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalCartaoVisivel(false)} style={styles.modalCancelButton}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// Estilos (mantidos 100% como o seu original)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  container: {
    flex: 1,
    padding: 24,
  },
  backButtonContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  totalText: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  circleButton: {
    width: 50,
    height: 50,
    backgroundColor: '#E0E0E0', 
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBox: {
    width: 120,
    height: 50,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  quantityText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12, 
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  paymentText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  spacer: {
    flex: 1,
  },
  rechargeButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rechargeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtonFilled: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonFilledText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonOutlined: {
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  modalButtonOutlinedText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCancelButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#757575',
    fontSize: 16,
  }
});