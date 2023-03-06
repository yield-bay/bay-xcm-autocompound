import { type FC, useRef, useEffect } from 'react';
import { useAtom } from 'jotai';
import { accountAtom, walletAccountsAtom } from '@store/accountAtoms';
import { walletsAtom } from '@store/walletAtoms';
import { useState } from 'react';
import { Wallet, WalletAccount } from '@talismn/connect-wallets';
import { walletAtom } from '@store/walletAtoms';
import { APP_NAME } from '@utils/constants';
import ModalWrapper from './ModalWrapper';
import Image from 'next/image';
import clsx from 'clsx';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

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

  const [isCopied, setIsCopied] = useState(false); // copied address to clipboard
  const timerRef = useRef<null | ReturnType<typeof setTimeout>>(null);

  const connected = walletAccounts !== null;

  useEffect(() => {
    // Clear timeout when component unmounts
    return () => {
      clearTimeout(timerRef.current as ReturnType<typeof setTimeout>);
    };
  }, []);

  const ConnectModal = () => (
    <ModalWrapper open={isOpen} setOpen={setIsOpen}>
      <div className="flex flex-col gap-y-4">
        {!connected ? (
          <div className="flex flex-col gap-y-8">
            <h3>Connect Wallet</h3>
            <div className="flex flex-col gap-y-5">
              {wallets.map((wallet: Wallet) => (
                <button
                  className="flex flex-row gap-x-5 items-center border border-baseGray hover:border-primaryGreen rounded-xl p-6 text-left transition duration-200"
                  key={wallet.extensionName}
                  onClick={async () => {
                    try {
                      await wallet.enable(APP_NAME);
                      await wallet.subscribeAccounts(
                        (accounts: WalletAccount[] | undefined) => {
                          // jotai:: setting accounts in selected wallet
                          setWalletAccounts(accounts as WalletAccount[]);
                        }
                      );
                      // jotai:: setting selected wallet
                      setWallet(wallet);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  <Image
                    alt={wallet.logo.alt}
                    src={wallet.logo.src}
                    width={32}
                    height={32}
                  />
                  <span>{wallet.title}</span>
                </button>
              ))}
            </div>
          </div>
        ) : walletAccounts.length > 0 ? (
          <div className="flex flex-col gap-y-8">
            <h3>Select Account</h3>
            <div className="flex flex-col gap-y-5">
              {walletAccounts.map((account: WalletAccount) => (
                <button
                  className={clsx(
                    'flex flex-col gap-y-3 border border-[#666666] hover:border-primaryGreen p-6 rounded-lg'
                  )}
                  onClick={async () => {
                    setAccount(account);
                    setWalletConnected(true);
                    setIsOpen(false);
                  }}
                >
                  <p>{account.name}</p>
                  <p className="text-[#969696] text-base">{account.address}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-10">
            <p>No accounts found</p>
            <p>Please check settings and try again</p>
          </div>
        )}
        {/* </div> */}
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
    <>
      <button
        onClick={account == null ? () => setIsOpen(true) : () => {}}
        className={clsx(
          'flex flex-row h-fit items-center w-[200px] justify-center text-base leading-[22px] bg-white text-black py-6 rounded-lg transition duration-200',
          account == null ? 'hover:bg-offWhite' : 'cursor-default'
        )}
      >
        {account == null ? (
          <span>Connect Wallet</span>
        ) : (
          <div className="inline-flex">
            <span>
              {account.name && account?.name.length > 10
                ? `${account.name.slice(0, 10)}...`
                : account.name}
            </span>
            <button
              className="ml-6"
              onClick={() => {
                navigator.clipboard.writeText(account?.address);
                setIsCopied(true);
                timerRef.current = setTimeout(() => {
                  setIsCopied(false);
                }, 500);
              }}
            >
              {isCopied ? (
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              ) : (
                <Image
                  src="/icons/Copy.svg"
                  alt="copy address"
                  width={24}
                  height={24}
                />
              )}
            </button>
            <button
              className="ml-3"
              onClick={() => {
                // Clear all states to disconnect wallet
                setWallet(null);
                setWalletAccounts(null);
                setAccount(null);
                setWalletConnected(false);
              }}
            >
              <Image
                src="/icons/XCircle.svg"
                alt="disconnect wallet"
                width={24}
                height={24}
              />
            </button>
          </div>
        )}
      </button>
      <ConnectModal />
    </>
  );
};

export default ConnectWallet;
