const CryptoJS = require('crypto-js');
const crypto = require('crypto');

// Get secret key from env or use default for dev
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'supersecretencryptionkey256bitprsu!';

/**
 * Encrypts a given text using AES-256
 * @param {String} text - The text to encrypt
 * @returns {String} - Encrypted string
 */
const encryptAES = (text) => {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

/**
 * Decrypts a given ciphertext using AES-256
 * @param {String} ciphertext - The text to decrypt
 * @returns {String} - Decrypted string
 */
const decryptAES = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Generates SHA-256 hash
 * @param {String} data - Data to hash
 * @returns {String} - Hash string
 */
const generateHash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

module.exports = {
  encryptAES,
  decryptAES,
  generateHash
};
