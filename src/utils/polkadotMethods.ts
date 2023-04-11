import { APP_NAME } from './constants';
import type { Wallet, WalletAccount } from '@talismn/connect-wallets';

export const pullWalletAccounts = async (
  wallet: Wallet,
  setWalletAccounts: (value: WalletAccount[]) => void
) => {
  try {
    await wallet.enable(APP_NAME);
    await wallet.subscribeAccounts((accounts: WalletAccount[] | undefined) => {
      // jotai:: setting accounts in selected wallet
      setWalletAccounts(accounts as WalletAccount[]);
    });
  } catch (err) {
    console.error(err);
  }
};
