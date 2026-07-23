import * as Crypto from "expo-crypto";

export async function generateId() {
  return await Crypto.getRandomBytesAsync(8).then((bytes) =>
    Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(""),
  );
}
