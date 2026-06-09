import AsyncStorage from "@react-native-async-storage/async-storage";

export const storeData = async <T>(name: string, value: T) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(name, jsonValue);
  } catch {
    return null;
  }
};

export const getData = async <T>(name: string): Promise<T | null> => {
  try {
    const value = await AsyncStorage.getItem(name);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};
