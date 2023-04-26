import ModalWrapper from './ModalWrapper';
import type { Wallet, WalletAccount } from '@talismn/connect-wallets';
import { walletModalOpenAtom } from '@store/commonAtoms';
import { walletsAtom, walletAtom } from '@store/walletAtoms';
import { walletAccountsAtom, accountAtom } from '@store/accountAtoms';
import { useAtom } from 'jotai';
import { FC } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { APP_NAME } from '@utils/constants';

const ConnectModal: FC = () => {
  const [isOpen, setIsOpen] = useAtom(walletModalOpenAtom);
  const [wallets] = useAtom(walletsAtom);
  const [walletAccounts, setWalletAccounts] = useAtom(walletAccountsAtom);
  const [, setWallet] = useAtom(walletAtom);
  const [, setAccount] = useAtom(accountAtom);

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
                  className="flex flex-row gap-x-5 items-center ring-1 ring-baseGray hover:ring-primaryGreen rounded-xl p-6 text-left border-0 focus:outline-0 transition duration-200"
                  key={wallet.extensionName}
                  onClick={async () => {
                    try {
                      await wallet.enable(APP_NAME);
                      await wallet.subscribeAccounts(
                        (accounts: WalletAccount[] | undefined) => {
                          // jotai:: setting accounts in selected wallet
                          setWalletAccounts(accounts as WalletAccount[]);
                          if (accounts?.length == 1) {
                            setAccount(accounts[0]);
                            setIsOpen(false);
                          }
                          setWallet(wallet);
                        }
                      );
                    } catch (err) {
                      console.log('Error in subscribing accounts: ', err);
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
              {walletAccounts?.map((account: WalletAccount) => (
                <button
                  className={clsx(
                    'flex flex-col gap-y-3 ring-1 ring-[#666666] hover:ring-primaryGreen p-6 rounded-lg focus:outline-0 transition duration-200 '
                  )}
                  key={account.name}
                  onClick={() => {
                    setAccount(account);
                    setIsOpen(false);
                  }}
                >
                  <p>{account.name}</p>
                  <p className="text-[#969696] text-base">
                    {account.address.slice(0, 20)}...
                    {account.address.slice(-15)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-left">
            <p className="mb-5">No accounts found!</p>
            <p>Please check if your wallet is connected and try again.</p>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};

export default ConnectModal;
