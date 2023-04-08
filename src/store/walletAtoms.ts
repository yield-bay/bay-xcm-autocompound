import type { Wallet, WalletAccount } from '@talismn/connect-wallets';
import { XcmpTaskType } from '@utils/types';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

const walletNameAtom = atomWithStorage<string | null>(
  'jotai:wallet_name', // key
  null // intial value
);

export const walletsAtom = atom<Wallet[]>([]);

export const walletAtom = atom(
  (get) => {
    const walletName = get(walletNameAtom);
    if (walletName == null) return null;
    return (
      get(walletsAtom)?.find((wallet) => wallet.extensionName === walletName) ??
      null
    );
  },
  (get, set, update: Wallet | null) => {
    set(walletNameAtom, update !== null ? update.extensionName : null);
  }
);

export const selectedTaskAtom = atom<XcmpTaskType | undefined>(undefined);
export const taskIsCompoundingAtom = atom((get) => {
  const task = get(selectedTaskAtom);
  if (task == null) return null;
  return task?.status == 'RUNNING';
});

export const connected = atomWithStorage<boolean>(
  'jotai:connected', // key
  false // initial value
);
