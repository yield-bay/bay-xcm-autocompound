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
import { Modal, useLocalStorage } from '@talismn/connect-ui';
// Mangata SDK
import { Mangata } from '@mangata-finance/sdk';
import { MG_MAINNET_1, MG_MAINNET_2 } from '@utils/constants';

const WalletFlow = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]); // list of required & installed wallets
  const [wallet, setWallet] = useAtom(walletAtom); // selected wallet
  const [walletAccounts, setWalletAccounts] = useAtom(walletAccountsAtom); // connected accounts in selected wallet
  const [account, setAccount] = useAtom(accountAtom); // selected account
  const [walletConnected, setWalletConnected] = useState(false); // connected to wallet

  // Modal
  const [isOpen, setIsOpen] = useState(false);

  // Mangata
  // useEffect(() => {
  //   (async () => {
  //     const mangata = Mangata.getInstance([MG_MAINNET_1, MG_MAINNET_2]);
  //     console.log('fetching pools...');
  //     const liquidity_pools = await mangata.getPools();
  //     console.log('liquidity pools\n', liquidity_pools);
  //   })();
  // }, []);

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
      <Modal
        className="border border-red-500 bg-white"
        title="Connect Wallet"
        isOpen={isOpen}
        appId=""
        handleClose={() => setIsOpen(false)}
      >
        <div className="flex flex-col gap-y-5 bg-white">
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
                {wallet?.extensionName
                  ? wallet.extensionName
                  : 'no_wallet_found'}
              </p>
              {walletAccounts.map((account: WalletAccount) => (
                <button
                  className="border border-black max-w-fit hover:border-gray-600 rounded p-4 text-gray-900 font-semibold bg-gray-50 active:bg-gray-100 transition duration-200"
                  key={account.name}
                  onClick={async () => {
                    setAccount(account);
                    setWalletConnected(true);
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
        </div>
      </Modal>
      <p>Account: {account ? account.address : 'No account'}</p>
      {!account ? (
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 rounded bg-cyan-400 text-black"
        >
          Connect
        </button>
      ) : null}
      {/* {!connected ? (
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
      )} */}

      {connected && account && (
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
        <div className="flex flex-col gap-y-10 m-10">
          <button
            className="p-3 border border-red-500 hover:bg-red-50 text-red-500 font-semibold rounded"
            onClick={() => {
              setWallet(null);
              setWalletAccounts(null);
              setAccount(null);
              setWalletConnected(false);
            }}
          >
            Disconnect
          </button>
        </div>
      )}

      {account && (
        <button
          className="px-4 py-2 rounded bg-blue-500 text-black"
          onClick={async () => {
            try {
              const signer = account?.wallet?.signer;

              const { signature } = await signer.signRaw({
                type: 'payload',
                data: 'This is a test call.',
                address: account?.address,
              });
              console.log("signature", signature);
            } catch (error) {
              console.error(error);
            }
          }}
        >
          Connect
        </button>
      )}
    </div>
  );
};

export default WalletFlow;
