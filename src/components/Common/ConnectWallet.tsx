import { type FC, useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { useAtom } from 'jotai';
import { accountAtom, walletAccountsAtom } from '@store/accountAtoms';
import { walletModalOpenAtom } from '@store/commonAtoms';
import { walletAtom } from '@store/walletAtoms';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const ConnectWallet: FC = () => {
  const [, setIsOpen] = useAtom(walletModalOpenAtom);
  const [, setWallet] = useAtom(walletAtom); // selected wallet
  const [walletAccounts, setWalletAccounts] = useAtom(walletAccountsAtom); // connected accounts in selected wallet
  const [account, setAccount] = useAtom(accountAtom); // selected account

  const [isCopied, setIsCopied] = useState(false); // copied address to clipboard
  const timerRef = useRef<null | ReturnType<typeof setTimeout>>(null);

  const connected = walletAccounts !== null;

  useEffect(() => {
    // Clear timeout when component unmounts
    return () => {
      clearTimeout(timerRef.current as ReturnType<typeof setTimeout>);
    };
  }, []);

  return (
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
          <div
            className="ml-6 cursor-pointer"
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
          </div>
          <div
            className="ml-3 cursor-pointer"
            onClick={() => {
              // Clear all states to disconnect wallet
              setWallet(null);
              setWalletAccounts(null);
              setAccount(null);
            }}
          >
            <Image
              src="/icons/XCircle.svg"
              alt="disconnect wallet"
              width={24}
              height={24}
            />
          </div>
        </div>
      )}
    </button>
  );
};

export default ConnectWallet;
