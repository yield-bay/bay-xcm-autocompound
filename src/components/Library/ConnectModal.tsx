import ModalWrapper from './ModalWrapper';
import type { Wallet, WalletAccount } from '@talismn/connect-wallets';
import { walletModalOpenAtom } from '@store/commonAtoms';
import { walletsAtom, walletAtom } from '@store/walletAtoms';
import { walletAccountsAtom, accountAtom } from '@store/accountAtoms';
import { useAtom } from 'jotai';
import { FC } from 'react';
import { APP_NAME } from '@utils/constants';
import Image from 'next/image';
import clsx from 'clsx';
import { pullWalletAccounts } from '@utils/polkadotMethods';

interface Props {
  connected: boolean;
}

const ConnectModal: FC = () => {
  const [isOpen, setIsOpen] = useAtom(walletModalOpenAtom);
  const [wallets, setWallets] = useAtom(walletsAtom);
  const [walletAccounts, setWalletAccounts] = useAtom(walletAccountsAtom);
  const [wallet, setWallet] = useAtom(walletAtom);
  const [account, setAccount] = useAtom(accountAtom);

  const connected = walletAccounts !== null;

  return (
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
                    pullWalletAccounts(wallet, setWalletAccounts);
                    // jotai:: setting selected wallet
                    setWallet(wallet);
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
                  key={account.name}
                  onClick={async () => {
                    setAccount(account);
                    // setWalletConnected(true);
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
        {/* {account && ( // 
          <div className="flex flex-col gap-y-10 m-10">
            <button
              className="p-3 border border-red-500 hover:bg-red-50 text-red-500 font-semibold rounded"
              onClick={() => {
                setWallet(null);
                setWalletAccounts(null);
                setAccount(null);
                // setWalletConnected(false);
              }}
            >
              Disconnect
            </button>
          </div>
        )} */}
      </div>
    </ModalWrapper>
  );
};

export default ConnectModal;
