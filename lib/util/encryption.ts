import { AES, enc } from 'crypto-js';

const TEST_DATA = 'Irrelevant data for password verification';

export const generateSalt = () => {
  const validChars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(32);
  globalThis.crypto.getRandomValues(array);
  const numbers = Array.from(array, (x) =>
    validChars.charCodeAt(x % validChars.length)
  );
  const salt = String.fromCharCode(...numbers);
  return salt;
};

export const encrypt = (data: string, password: string, salt: string) => {
  return AES.encrypt(JSON.stringify(data), password + salt).toString();
};

export const decrypt = (
  data: string,
  password: string,
  salt: string
): string => {
  const decrypted = AES.decrypt(data, password + salt);
  return JSON.parse(decrypted.toString(enc.Utf8));
};

export const createTestCipher = (password: string, salt: string) => {
  return encrypt(TEST_DATA, password, salt);
};

export const verifyTestCipher = (
  testCipher: string,
  password: string,
  salt: string
) => {
  try {
    const decrypted = decrypt(testCipher, password, salt);
    return decrypted === TEST_DATA;
  } catch {
    return false;
  }
};
