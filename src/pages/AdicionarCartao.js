import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Feather } from '@expo/vector-icons';

// O CustomInput DEVE FICAR AQUI FORA
const CustomInput = ({ label, value, onChangeText, keyboardType = "default", maxLength, autoCapitalize }) => (
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
  const primaryDarkBlue = '#0F3271';
  const buttonBlue = '#3B82F6';

  // Estados dos inputs
  const [numero, setNumero] = useState('');
  const [nome, setNome] = useState('');
  const [validade, setValidade] = useState('');
  const [cvc, setCvc] = useState('');

  // Valores de Exibição Dinâmicos (Fallback se estiver vazio)
  const numeroDisplay = numero || '1234 5678 9052 2568';
  const nomeDisplay = nome ? nome.toUpperCase() : 'NOME';
  const validadeDisplay = validade || '12/30';

  // === LÓGICA DE MÁSCARAS NATIVAS ===
  const handleNumeroChange = (text) => {
    const formatado = text
      .replace(/\D/g, '')
      .replace(/(\d{4})(?=\d)/g, '$1 ')
      .substring(0, 19);
    setNumero(formatado);
  };

  const handleValidadeChange = (text) => {
    const formatado = text
      .replace(/\D/g, '')
      .replace(/(\d{2})(?=\d)/g, '$1/')
      .substring(0, 5);
    setValidade(formatado);
  };

  const handleCvcChange = (text) => {
    const formatado = text.replace(/\D/g, '').substring(0, 3);
    setCvc(formatado);
  };

  // === REGRAS DE NEGÓCIO: DETECTAR BANDEIRA E BANCO ===
  const detectarBandeira = (num) => {
    if (num.startsWith('4')) return 'credit-card'; // Visa
    if (num.startsWith('5')) return 'credit-card'; // Mastercard
    if (num.startsWith('34') || num.startsWith('37')) return 'credit-card'; // Amex
    return 'credit-score'; // Genérico
  };

  const detectarBanco = (num) => {
    const numLimpo = num.replace(/\s/g, ''); 
    if (numLimpo.length >= 4) {
      if (['5350', '5502', '5448'].some(p => numLimpo.startsWith(p))) 
        return { cor: '#8A05BE', nome: 'nubank' };
      
      if (['4576', '5447'].some(p => numLimpo.startsWith(p))) 
        return { cor: '#EC7000', nome: 'Itaú' };
      
      if (['4984', '5283'].some(p => numLimpo.startsWith(p))) 
        return { cor: '#CC0000', nome: 'Santander' };
      
      if (['4551', '4623'].some(p => numLimpo.startsWith(p))) 
        return { cor: '#CC092F', nome: 'bradesco' };
      
      if (['5373', '5220'].some(p => numLimpo.startsWith(p))) 
        return { cor: '#11C76F', nome: 'picpay' };
    }
    return { cor: primaryDarkBlue, nome: '' }; 
  };

  const bancoAtual = detectarBanco(numero);
  const bandeiraAtual = detectarBandeira(numero);

  // === FUNÇÃO PARA SALVAR (SIMULAÇÃO) ===
  const handleSalvar = () => {
    if (!numero || !nome || !validade || !cvc) {
      Alert.alert('Atenção', 'Preencha todos os campos do cartão para testar.');
      return;
    }

    Alert.alert(
      'Cartão Adicionado!',
      'Este é um ambiente de testes. Seu cartão foi salvo temporariamente e será apagado assim que o aplicativo for fechado.',
      [
        { text: 'Entendi', onPress: () => navigation.goBack() }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Botão Voltar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={32} color="black" />
          </TouchableOpacity>
        </View>

        {/* Título */}
        <Text style={[styles.title, { color: primaryDarkBlue }]}>
          Adicionar Cartão
        </Text>

        {/* AVISO DE AMBIENTE DE TESTE */}
        <View style={styles.disclaimerContainer}>
          <Feather name="shield" size={24} color="#3B82F6" />
          <Text style={styles.disclaimerText}>
            <Text style={{ fontWeight: 'bold' }}>Ambiente de Teste Seguro:</Text> Fique à vontade para testar. Nenhum dado real é salvo no banco de dados e as informações desaparecem ao fechar o app.
          </Text>
        </View>

        {/* DESENHO DO CARTÃO */}
        <View style={[styles.cardPreview, { backgroundColor: bancoAtual.cor }]}>
          
          <View style={styles.cardRowBetween}>
            <MaterialIcons name="memory" size={44} color="rgba(255,255,255,0.7)" />
            <Text style={styles.bankNameText}>
              {bancoAtual.nome}
            </Text>
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

        {/* FORMULÁRIO BRANCO */}
        <View style={styles.formContainer}>
          <CustomInput 
            label="Numero do Cartão" 
            value={numero} 
            onChangeText={handleNumeroChange} 
            keyboardType="numeric"
            maxLength={19}
          />
          
          <CustomInput 
            label="Nome do Cartão" 
            value={nome} 
            onChangeText={setNome} 
            autoCapitalize="words"
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

        {/* BOTÃO SALVAR */}
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: buttonBlue }]}
          onPress={handleSalvar}
        >
          <Text style={styles.saveButtonText}>Salvar Cartão</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16, // Reduzi um pouco para dar espaço ao aviso
  },
  disclaimerContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  disclaimerText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#0F3271',
    lineHeight: 20,
  },
  cardPreview: {
    height: 210,
    borderRadius: 16,
    padding: 24,
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  cardRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankNameText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  cardNumberText: {
    color: 'white',
    fontSize: 22,
    letterSpacing: 2.0,
    fontWeight: '600',
  },
  cardRowBetweenBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  expiryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  cardHolderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  inputContainer: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  flexHalf: {
    flex: 1,
  },
  spaceWidth: {
    width: 16,
  },
  saveButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
});