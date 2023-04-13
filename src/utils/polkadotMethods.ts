import { APP_NAME } from './constants';
import type { Wallet, WalletAccount } from '@talismn/connect-wallets';

export const pullWalletAccounts = async (
  wallet: Wallet,
  setWalletAccounts: (value: WalletAccount[]) => void,
  setAccount: any,
  setIsOpen: any
) => {
  try {
    await wallet.enable(APP_NAME);
    await wallet.subscribeAccounts((accounts: WalletAccount[] | undefined) => {
      // jotai:: setting accounts in selected wallet
      setWalletAccounts(accounts as WalletAccount[]);
      if(accounts?.length == 1) {
        setAccount(accounts[0]);
        setIsOpen(false);
      }      
    });
  } catch (err) {
    console.log('Error in subscribing accounts: ', err);
  }
};
