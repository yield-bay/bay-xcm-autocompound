import type { WalletAccount } from '@talismn/connect-wallets';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const walletAccountsAtom = atom<WalletAccount[] | null>(null);
walletAccountsAtom.debugLabel = 'walletAccounts';

// Address of the selected Accounts
const accountAddressAtom = atomWithStorage<string | null>(
  'jotai:account_address',
  null
);
accountAddressAtom.debugLabel = 'accountsAddress';

// selected account
export const accountAtom = atom(
  (get) => {
    const polkadotAccountAddress = get(accountAddressAtom);
    if (polkadotAccountAddress == null) return null;
    return (
      // using polkaAccountAddress to find polkadotAccount
      get(walletAccountsAtom)?.find(
        (account) => account.address === get(accountAddressAtom)
      ) ?? null
    );
  },
  (get, set, accountUpdate: WalletAccount | null) => {
    set(
      accountAddressAtom,
      accountUpdate !== null ? accountUpdate.address : null
    );
  }
);
accountAtom.debugLabel = 'polkadotAccount';
