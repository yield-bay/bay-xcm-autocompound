import { useAtom } from 'jotai';
import { accountAtom, walletAccountsAtom } from '@store/accountAtoms';
import { walletAtom } from '@store/walletAtoms';
import { useEffect, useState } from 'react';
import { APP_NAME } from '@utils/constants';
import {
  getWallets,
  type WalletAccount,
  type Wallet,
} from '@talismn/connect-wallets';

const WalletFlow = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]); // list of required & installed wallets
  const [wallet, setWallet] = useAtom(walletAtom); // selected wallet
  const [walletAccounts, setWalletAccounts] = useAtom(walletAccountsAtom); // connected accounts in selected wallet
  const [account, setAccount] = useAtom(accountAtom); // selected account

  useEffect(() => {
    let unmounted = false;
    let supportedWallets = getWallets().filter(
      (wallet) =>
        wallet.extensionName == 'polkadot-js' ||
        wallet.extensionName == 'talisman'
    );
    if (!unmounted) {
      setWallets(supportedWallets);
    }
    return () => {
      unmounted = true;
    };
  }, []);

  const connected = walletAccounts !== null;

  return (
    <div className="min-h-screen w-full">
      <p>Account: {account ? account.address : 'No account'}</p>
      {!connected ? (
        <div className="m-10 flex flex-col gap-y-5">
          {wallets.map((wallet: Wallet) => (
            <button
              className="border border-black max-w-fit hover:border-gray-600 rounded p-4 text-gray-900 font-semibold bg-gray-50 active:bg-gray-100 transition duration-200"
              key={wallet.extensionName}
              onClick={async () => {
                try {
                  await wallet.enable(APP_NAME);
                  await wallet.subscribeAccounts(
                    (accounts: WalletAccount[]) => {
                      // jotai:: setting accounts in selected wallet
                      setWalletAccounts(accounts);
                    }
                  );
                  // jotai:: setting selected wallet
                  setWallet(wallet);
                } catch (err) {
                  console.error(err);
                }
              }}
            >
              Connect to {wallet.title}
            </button>
          ))}
        </div>
      ) : walletAccounts.length > 0 ? (
        <div className="m-10 flex flex-col gap-y-5">
          <p>
            Accounts in{' '}
            {wallet?.extensionName ? wallet.extensionName : 'no_wallet_found'}
          </p>
          {walletAccounts.map((account: WalletAccount) => (
            <button
              className="border border-black max-w-fit hover:border-gray-600 rounded p-4 text-gray-900 font-semibold bg-gray-50 active:bg-gray-100 transition duration-200"
              key={account.name}
              onClick={async () => {
                setAccount(account);
              }}
            >
              {account.address}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <p>No accounts found</p>
          <p>Please check settings and try again</p>
        </div>
      )}

      {account && (
        <div className="m-10">
          <p>connected</p>
          <div className="p-6 rounded border border-black bg-gray-200 max-w-fit">
            <p>Address:: {account?.address}</p>
            <p>Name:: {account?.name}</p>
            <p>Wallet:: {account?.wallet?.extensionName}</p>
          </div>
        </div>
      )}

      {account && (
        <div className="m-10">
          <button
            className="p-3 border border-red-500 hover:bg-red-50 text-red-500 font-semibold rounded"
            onClick={() => {
              setWallet(null);
              setWalletAccounts(null);
              setAccount(null);
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletFlow;
