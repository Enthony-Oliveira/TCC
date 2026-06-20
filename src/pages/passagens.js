import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons'; 

// IMPORTAÇÕES DO FIREBASE
import { auth, db } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';

// Componentes
import InfoCard from '../components/InfoCard'; 

export default function Passagens() {
  const navigation = useNavigation();
  const primaryDarkBlue = '#0F3271';

  // Estados para guardar os valores do banco
  const [totalHistorico, setTotalHistorico] = useState(0);
  const [restantes, setRestantes] = useState(0);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const userUid = auth.currentUser?.uid;
    
    if (!userUid) {
      setCarregando(false);
      return;
    }

    // Criamos um listener em tempo real no documento do usuário
    const userRef = doc(db, "usuarios", userUid);
    
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const dados = snapshot.data();
        
        // Pega os valores do banco ou joga 0 caso eles ainda não existam no documento
        setRestantes(dados.saldoPassagens || 0);
        setTotalHistorico(dados.passagensTotalHistorico || 0);
      }
      setCarregando(false);
    }, (error) => {
      console.error("Erro ao buscar passagens:", error);
      setCarregando(false);
    });

    // Limpa o listener quando o usuário sai da tela para não gastar internet
    return () => unsubscribe();
  }, []);

  // O cálculo de usadas vira a diferença matemática simples
  const usadas = totalHistorico - restantes;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        <View style={styles.container}>
          
          {/* Botão de Voltar */}
          <View style={styles.backButtonContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={32} color="black" />
            </TouchableOpacity>
          </View>

          {/* Título */}
          <Text style={[styles.title, { color: primaryDarkBlue }]}>
            Passagens
          </Text>

          {carregando ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={primaryDarkBlue} />
              <Text style={styles.loadingText}>Atualizando passagens...</Text>
            </View>
          ) : (
            <View style={styles.cardsContainer}>
              <InfoCard 
                number={String(totalHistorico)} 
                label="Passagens Total" 
              />
              
              <InfoCard 
                number={String(usadas >= 0 ? usadas : 0)} 
                label="Passagens Usadas" 
              />
              
              <InfoCard 
                number={String(restantes)} 
                label="Passagens Restante" 
                subtitle="Você ainda pode usar" 
              />
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  container: {
    padding: 16, 
  },
  backButtonContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  cardsContainer: {
    gap: 16, 
    paddingBottom: 24,
  },
  loadingContainer: {
    marginTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  }
});