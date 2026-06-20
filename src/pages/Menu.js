import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Menucard from "../components/Menucard";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Passagens from "./passagens";

export default function MenuPrincipal({navigation}) {
  return (
    <View style={styles.container}>
      {/* Configuração da StatusBar para ficar azul escura */}
      <StatusBar barStyle="light-content" backgroundColor="#0A2A66" />

      {/* Cabeçalho com Menu Hamburguer */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => console.log("Abrir Menu")}>
          <Ionicons name="menu" size={35} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Título Principal */}
        <Text style={styles.title}>Recarga Buss</Text>

        {/* Aqui entrarão os seus MenuCards */}

        <Menucard
          title={"Passagens"}
          subtitle={"Veja suas Recargas"}
          backgroundColor="#0BA95B"
          icon={
            <MaterialCommunityIcons
              name="ticket-outline"
              size={50}
              color="#ffffff"
            />
          }
          onPress={() => navigation.navigate("Passagens")}
        />

        <Menucard
          title={"Recarga"}
          subtitle={"Faça a recarga do seu cartão"}
          backgroundColor="#F4C20D"
          icon={
            <MaterialCommunityIcons
              name="credit-card-outline"
              size={50}
              color="#ffffff"
            />
          }
          onPress={() => navigation.navigate("Recarga")}
        />

        <Menucard
          title={"Extrato"}
          subtitle={"Veja suas Recargas"}
          backgroundColor="#4BA3F0"
          icon={
            <MaterialCommunityIcons
              name="clipboard-text-clock-outline"
              size={50}
              color="#ffffff"
            />
          }
          onPress={() => navigation.navigate("Extrato")}
        />

        <Menucard
          title={"Declaração"}
          subtitle={"Envie sua declaração matricula"}
          backgroundColor="#7CC4FF"
          icon={
            <MaterialCommunityIcons
              name="file-document-edit-outline"
              size={50}
              color="#ffffff"
            />
          }
          onPress={() => navigation.navigate("Declaracao")}
        />

        <Menucard
          title={"Cartão"}
          subtitle={"Adicione o Seu Cartão"}
          backgroundColor="#7B61FF"
          icon={
            <MaterialCommunityIcons
              name="card-account-details-outline"
              size={50}
              color="#ffffff"
            />
          }
          onPress={() => navigation.navigate("AdicionarCartao")}
        />

        <View style={styles.menuContainer}>
          {/* Espaço reservado para os imports do MenuCard que você vai fazer */}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    backgroundColor: "#0A2A66",
    height: 100,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0A2A66",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 20,
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
});
