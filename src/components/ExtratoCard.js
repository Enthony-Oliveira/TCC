import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ExtratoCard({ data, descricao, valor }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        
        {/* Lado Esquerdo: Data e Descrição */}
        {/* O flex: 1 no estilo 'leftContent' age como o Expanded do Flutter! */}
        <View style={styles.leftContent}>
          <Text style={styles.dataText}>{data}</Text>
          <Text style={styles.descricaoText}>{descricao}</Text>
        </View>

        {/* Lado Direito: Valor */}
        <Text style={styles.valorText}>{valor}</Text>

      </View>
    </View>
  );
}

// Estilos equivalentes aos modificadores e BoxDecoration do Flutter
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', // Colors.white
    padding: 20, // EdgeInsets.all(20.0)
    marginBottom: 16, // EdgeInsets.only(bottom: 16.0)
    borderRadius: 12, // BorderRadius.circular(12.0)
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between', // MainAxisAlignment.spaceBetween
    alignItems: 'center', // Centraliza verticalmente
  },
  leftContent: {
    flex: 1, // Faz o papel do 'Expanded'
    marginRight: 12, // Faz o papel daquele SizedBox de largura 12 de segurança
  },
  dataText: {
    color: '#9E9E9E', // Equivalente ao Colors.grey
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4, // Faz o papel do SizedBox de altura 4 entre a data e a descrição
  },
  descricaoText: {
    color: '#000000', // Colors.black
    fontSize: 16,
    fontWeight: 'bold',
  },
  valorText: {
    color: '#1AA855', // Aquele mesmo verde do card de Passagens
    fontSize: 16,
    fontWeight: 'bold',
  },
});