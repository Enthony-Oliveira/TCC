import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";

export default function MenuCard({ title, subtitle, backgroundColor, icon, onPress }) {
  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.iconContainer}>
        {icon}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    height: 100,
    borderRadius: 15,
    paddingHorizontal: 25,
    margin: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 2,
  },
  iconContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  }
});