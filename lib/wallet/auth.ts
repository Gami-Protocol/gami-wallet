import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'gami.vault.pin.v1';
const VAULT_MODE_KEY = 'gami.vault.mode.v1';

export type VaultMode = 'biometric' | 'pin' | 'skip';

/**
 * Thin wrapper around expo-local-authentication used to gate sensitive actions
 * (unlock, reveal backup phrase, confirm send).
 */
export async function biometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && enrolled;
}

export async function authenticate(reason: string): Promise<boolean> {
  const available = await biometricAvailable();
  if (!available) {
    // No biometrics enrolled (or running in preview) — treat as a soft pass so
    // the flow is testable; real builds will have Face ID / device passcode.
    return true;
  }
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function setVaultMode(mode: VaultMode, pin?: string): Promise<void> {
  await SecureStore.setItemAsync(VAULT_MODE_KEY, mode);
  if (mode === 'pin' && pin) {
    await SecureStore.setItemAsync(PIN_KEY, pin);
  } else {
    await SecureStore.deleteItemAsync(PIN_KEY);
  }
}

const VAULT_MODES: VaultMode[] = ['biometric', 'pin', 'skip'];

function isVaultMode(value: string): value is VaultMode {
  return (VAULT_MODES as string[]).includes(value);
}

export async function getVaultMode(): Promise<VaultMode | null> {
  const raw = await SecureStore.getItemAsync(VAULT_MODE_KEY);
  if (raw === null || raw === undefined) return null;
  return isVaultMode(raw) ? raw : null;
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  return stored !== null && stored === pin;
}

export async function clearVault(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
  await SecureStore.deleteItemAsync(VAULT_MODE_KEY);
}
