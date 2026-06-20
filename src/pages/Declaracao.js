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
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker'; 

export default function Declaracao() {
  const navigation = useNavigation();

  // Cores
  const primaryDarkBlue = '#0F3271';
  const buttonBlue = '#3B82F6';

  // Estados
  const [dataVencimento, setDataVencimento] = useState('');
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);

  // MÁSCARA DE DATA (DD/MM/YYYY)
  const handleDataChange = (text) => {
    let formatado = text.replace(/\D/g, ''); 
    
    if (formatado.length > 2) {
      formatado = formatado.replace(/^(\d{2})(\d)/g, '$1/$2');
    }
    if (formatado.length > 5) {
      formatado = formatado.replace(/^(\d{2})\/(\d{2})(\d)/g, '$1/$2/$3');
    }
    
    setDataVencimento(formatado.substring(0, 10));
  };

  // === LÓGICA DO PRAZO DE VENCIMENTO ===
  let mensagemPrazo = '';
  let corPrazo = 'transparent';

  if (dataVencimento.length === 10) {
    const partes = dataVencimento.split('/');
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1; // JavaScript conta meses de 0 a 11
    const ano = parseInt(partes[2], 10);

    const vencimento = new Date(ano, mes, dia);
    const hoje = new Date();
    
    // Zera as horas para comparar apenas os dias
    vencimento.setHours(0,0,0,0);
    hoje.setHours(0,0,0,0);

    // Valida se a data existe (evita 31/02, por exemplo)
    if (vencimento.getDate() !== dia || isNaN(vencimento.getTime())) {
      mensagemPrazo = 'Data inválida';
      corPrazo = '#E53935'; // Vermelho
    } else {
      // Calcula a diferença em dias
      const diffTime = vencimento - hoje;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        mensagemPrazo = 'Declaração vencida!';
        corPrazo = '#E53935'; // Vermelho
      } else if (diffDays === 0) {
        mensagemPrazo = 'Vence hoje!';
        corPrazo = '#F57C00'; // Laranja
      } else {
        mensagemPrazo = `Faltam ${diffDays} dias para vencer`;
        corPrazo = '#43A047'; // Verde
      }
    }
  }

  // MÉTODO PARA ABRIR O SELETOR DE ARQUIVOS
  const selecionarArquivo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setArquivoSelecionado(result.assets[0]);
      } else {
        console.log('Seleção de arquivo cancelada.');
      }
    } catch (err) {
      console.log('Erro ao selecionar arquivo:', err);
    }
  };

  // VALIDAÇÃO E ENVIO
  const enviarArquivo = () => {
    if (dataVencimento.length < 10 || mensagemPrazo === 'Data inválida' || mensagemPrazo === 'Declaração vencida!') {
      Alert.alert('Atenção', 'Verifique a data informada. Não é possível enviar uma declaração vencida ou inválida.');
      return;
    }
    
    if (!arquivoSelecionado) {
      Alert.alert('Atenção', 'Selecione um arquivo antes de enviar!');
      return;
    }

    Alert.alert('Sucesso', 'Pronto para enviar ao banco de dados!');
  };

  const isPdf = arquivoSelecionado?.name?.toLowerCase().endsWith('.pdf');

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
          Declaração{'\n'}de Matrícula
        </Text>

        {/* Input da Data */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={dataVencimento}
            onChangeText={handleDataChange}
            keyboardType="numeric"
            placeholder="Data de Vencimento da Matrícula"
            placeholderTextColor="#999"
            maxLength={10}
          />
        </View>

        {/* AVISO DE PRAZO DINÂMICO */}
        {mensagemPrazo !== '' && (
          <View style={styles.prazoContainer}>
            <Feather 
              name={corPrazo === '#43A047' ? "check-circle" : "alert-circle"} 
              size={18} 
              color={corPrazo} 
            />
            <Text style={[styles.prazoText, { color: corPrazo }]}>
              {mensagemPrazo}
            </Text>
          </View>
        )}

        {/* Botão Selecionar Arquivo */}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: buttonBlue, marginTop: 24 }]}
          onPress={selecionarArquivo}
        >
          <Text style={styles.buttonText}>Selecionar Arquivo</Text>
        </TouchableOpacity>

        <Text style={styles.helperText}>(PDF/PNG/JPG)</Text>

        {/* CAIXA DE VISUALIZAÇÃO DINÂMICA */}
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
              
              {arquivoSelecionado.size && (
                <Text style={styles.fileSizeText}>
                  {(arquivoSelecionado.size / 1024).toFixed(1)} KB
                </Text>
              )}
            </View>
          )}
        </View>

        {/* BOTÃO ENVIAR */}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: buttonBlue, marginTop: 40 }]}
          onPress={enviarArquivo}
        >
          <Text style={styles.buttonText}>Enviar Arquivo</Text>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 34, 
    marginBottom: 40,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  textInput: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000',
  },
  prazoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  prazoText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  helperText: {
    fontSize: 14,
    color: '#9E9E9E',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  previewBox: {
    height: 220,
    width: '100%',
    backgroundColor: '#F4F5F7',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#BDBDBD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  fileNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  fileSizeText: {
    color: '#9E9E9E',
    fontSize: 14,
  },
});