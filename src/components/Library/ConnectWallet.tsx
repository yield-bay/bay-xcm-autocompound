import type { FC } from 'react';
import { useAtom } from 'jotai';
import { accountAtom, walletAccountsAtom } from '@store/accountAtoms';
import { walletsAtom } from '@store/walletAtoms';
import { useState } from 'react';
import { Wallet, WalletAccount } from '@talismn/connect-wallets';
import { walletAtom } from '@store/walletAtoms';
import { APP_NAME } from '@utils/constants';
import ModalWrapper from './Modal';

interface ConnectWalletProps {
  className?: string;
}

const ConnectWallet: FC<ConnectWalletProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [wallets] = useAtom(walletsAtom);
  const [wallet, setWallet] = useAtom(walletAtom); // selected wallet
  const [walletAccounts, setWalletAccounts] = useAtom(walletAccountsAtom); // connected accounts in selected wallet
  const [account, setAccount] = useAtom(accountAtom); // selected account
  const [walletConnected, setWalletConnected] = useState(false); // connected to wallet

  const connected = walletAccounts !== null;

  const ConnectModal = () => (
    <ModalWrapper title="Connect Modal" open={isOpen} setOpen={setIsOpen}>
      <div className="mt-8 flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-5">
          {!connected ? (
            <div className="m-10 flex flex-col gap-y-5">
              {wallets.map((wallet: Wallet) => (
                <button
                  className="border border-baseGray rounded-xl p-4 font-semibold transition duration-200"
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
                  className="border max-w-fit border-gray-600 rounded p-4 font-semibold transition duration-200"
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
        {walletConnected && (
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
      </div>
    </ModalWrapper>
  );

  return (
    <div className="flex flex-row">
      <button
        onClick={() => setIsOpen(true)}
        className="flex flex-row h-fit items-center justify-center text-base leading-[22px] bg-white text-black py-[25px] px-9 rounded-lg hover:bg-offWhite transition duration-200"
      >
        {account == null ? 'Connect Wallet' : `${account.name}`}
      </button>
      <ConnectModal />
    </div>
  );
};

export default ConnectWallet;
