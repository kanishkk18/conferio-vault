import { create } from "zustand";

interface VaultKeyState {
  masterKey: CryptoKey | null;
  isUnlocked: boolean;
  setMasterKey: (key: CryptoKey) => void;
  lock: () => void;
}

export const useVaultKeyStore = create<VaultKeyState>((set) => ({
  masterKey: null,
  isUnlocked: false,
  setMasterKey: (key) => set({ masterKey: key, isUnlocked: true }),
  lock: () => set({ masterKey: null, isUnlocked: false }),
}));

/** Convenience accessor for non-component code (e.g. query functions). */
export function getMasterKey(): CryptoKey | null {
  return useVaultKeyStore.getState().masterKey;
}
