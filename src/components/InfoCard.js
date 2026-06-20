import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function InfoCard({ number, label, subtitle }) {
  return (
    <View style={styles.cardContainer}>
      <Text style={styles.numberText}>{number}</Text>
      
      <Text style={styles.labelText}>{label}</Text>
      
      {/* Renderização condicional: só mostra o subtitle se ele existir */}
      {subtitle ? (
        <Text style={styles.subtitleText}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 24,
    marginVertical: 10,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center', // No Flutter, a Column centraliza os itens na horizontal por padrão
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8, // Substitui o SizedBox(height: 8.0)
  },
  labelText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  subtitleText: {
    marginTop: 12, // Substitui o SizedBox(height: 12.0)
    fontSize: 14,
    color: '#BDBDBD', // Cor aproximada do Colors.grey.shade400
  },
});