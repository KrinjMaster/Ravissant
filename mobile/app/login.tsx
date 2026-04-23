import { Text, View, StyleSheet } from "react-native";

export default function LoginPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This is login page</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#fff",
  },
});
