import type { Wallet, WalletAccount } from '@talismn/connect-wallets';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

const walletNameAtom = atomWithStorage<string | null>(
  'jotai:wallet_name', // key
  null // intial value
);

const originalWalletAtom = atom<Wallet | null>(null);
originalWalletAtom.debugLabel = 'wallet';

export const walletsAtom = atom<Wallet[]>([]);

export const walletAtom = atom(
  (get) => get(originalWalletAtom),
  (get, set, update: Wallet | null) => {
    set(originalWalletAtom, update);
    set(walletNameAtom, update !== null ? update.extensionName : null);
  }
);

export const connected = atomWithStorage<boolean>(
  'jotai:connected', // key
  false // initial value
);
