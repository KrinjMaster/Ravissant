import AsyncStorage from "@react-native-async-storage/async-storage";

export const storeData = async <T>(name: string, value: T) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(name, jsonValue);
  } catch {
    return null;
  }
};

export const getData = async (name: string) => {
  try {
    const jsonValue = await AsyncStorage.getItem(name);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch {
    return null;
  }
};
