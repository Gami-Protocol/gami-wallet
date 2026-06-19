import * as SecureStore from 'expo-secure-store';
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { HDKey } from '@scure/bip32';
import { mnemonicToAccount } from 'viem/accounts';

/**
 * Non-custodial wallet layer.
 *
 * - 12-word BIP39 mnemonic generated on device.
 * - Stored ONLY in Expo SecureStore (never AsyncStorage, never plaintext store).
 * - EVM keys derived at m/44'/60'/0'/0/0, Solana at m/44'/501'/0'/0'.
 */

const MNEMONIC_KEY = 'gami.wallet.mnemonic.v1';
const SOLANA_PATH = "m/44'/501'/0'/0'";

export type WalletAddresses = {
  evm: `0x${string}`;
  solana: string;
};

/** Create + persist a fresh 12-word mnemonic. Returns derived addresses. */
export async function createWallet(): Promise<WalletAddresses> {
  const mnemonic = generateMnemonic(wordlist, 128); // 128 bits = 12 words
  await SecureStore.setItemAsync(MNEMONIC_KEY, mnemonic, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return deriveAddresses(mnemonic);
}

/** Import an existing mnemonic (validated) and persist it. */
export async function importWallet(mnemonic: string): Promise<WalletAddresses> {
  const trimmed = mnemonic.trim().toLowerCase();
  if (!validateMnemonic(trimmed, wordlist)) {
    throw new Error('Invalid recovery phrase');
  }
  await SecureStore.setItemAsync(MNEMONIC_KEY, trimmed, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return deriveAddresses(trimmed);
}

export async function hasWallet(): Promise<boolean> {
  const m = await SecureStore.getItemAsync(MNEMONIC_KEY);
  return Boolean(m);
}

/** Returns the raw mnemonic. Callers MUST gate this behind a fresh Face ID prompt. */
export async function revealMnemonic(): Promise<string | null> {
  return SecureStore.getItemAsync(MNEMONIC_KEY);
}

export async function wipeWallet(): Promise<void> {
  await SecureStore.deleteItemAsync(MNEMONIC_KEY);
}

export async function getAddresses(): Promise<WalletAddresses | null> {
  const mnemonic = await SecureStore.getItemAsync(MNEMONIC_KEY);
  if (!mnemonic) return null;
  return deriveAddresses(mnemonic);
}

function deriveAddresses(mnemonic: string): WalletAddresses {
  const evmAccount = mnemonicToAccount(mnemonic); // default m/44'/60'/0'/0/0
  const seed = mnemonicToSeedSync(mnemonic);
  const hd = HDKey.fromMasterSeed(seed);
  const solNode = hd.derive(SOLANA_PATH);
  const solana = encodeSolanaAddress(solNode.publicKey);
  return { evm: evmAccount.address, solana };
}

/** Base58 encode a 32-byte public key into a Solana address. */
function encodeSolanaAddress(pubkey: Uint8Array | null): string {
  if (!pubkey) return '';
  return base58Encode(pubkey);
}

const B58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58Encode(bytes: Uint8Array): string {
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  const digits: number[] = [0];
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = '';
  for (let i = 0; i < zeros; i++) out += B58_ALPHABET[0];
  for (let i = digits.length - 1; i >= 0; i--) out += B58_ALPHABET[digits[i]];
  return out;
}
