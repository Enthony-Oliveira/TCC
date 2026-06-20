import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons'; 

// IMPORTAÇÕES DO FIREBASE
import { auth, db } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

// Componentes
import ExtratoCard from '../components/ExtratoCard'; 

export default function Extrato() {
  const navigation = useNavigation();
  const primaryDarkBlue = '#0F3271';

  // Estados para gerenciar a lista do Firebase
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const userUid = auth.currentUser?.uid;
    
    if (!userUid) {
      setCarregando(false);
      return;
    }

    // Criamos a rota para a subcoleção "extrato" e já pedimos para ordenar pela data ("desc" = mais recente primeiro)
    const extratoRef = collection(db, "usuarios", userUid, "extrato");
    const q = query(extratoRef, orderBy("data", "desc"));

    // O onSnapshot escuta em tempo real. Se ele recarregar e abrir essa tela, já vai estar lá!
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listaExtrato = [];
      
      snapshot.forEach((doc) => {
        const dados = doc.data();
        
        // Converte a data do Firebase (Timestamp) para uma data legível no Brasil
        let dataFormatada = '';
        if (dados.data) {
          dataFormatada = dados.data.toDate().toLocaleString('pt-BR', { 
            dateStyle: 'short', 
            timeStyle: 'short' 
          });
        }

        listaExtrato.push({
          id: doc.id, // ID único do documento gerado pelo Firebase
          quantidade: dados.quantidade,
          pagamento: dados.pagamento,
          valorTotalFormatado: dados.valorTotalFormatado,
          data: dataFormatada
        });
      });

      setHistorico(listaExtrato);
      setCarregando(false);
    }, (error) => {
      console.error("Erro ao buscar extrato:", error);
      setCarregando(false);
    });

    return () => unsubscribe();
  }, []);

  // Equivalente ao itemBuilder
  const renderItem = ({ item }) => {
    const descricaoFormatada = `Recarga - ${item.quantidade} passagens (${item.pagamento})`;

    return (
      <ExtratoCard
        data={item.data}
        descricao={descricaoFormatada}
        valor={`+ R$ ${item.valorTotalFormatado}`}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Botão de voltar */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={32} color="black" />
          </TouchableOpacity>
        </View>

        {/* Título */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: primaryDarkBlue }]}>
            Extrato
          </Text>
        </View>

        {/* Lista de Recargas (Dinâmica e com Loading) */}
        {carregando ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={primaryDarkBlue} />
            <Text style={[styles.emptyText, { marginTop: 10 }]}>Carregando histórico...</Text>
          </View>
        ) : historico.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma recarga feita ainda.</Text>
          </View>
        ) : (
          <FlatList
            data={historico}
            keyExtractor={(item) => item.id} // Agora usamos o ID real do banco
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            bounces={true} 
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}

      </View>
    </SafeAreaView>
  );
}

// Estilos 
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
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#757575', 
  },
});