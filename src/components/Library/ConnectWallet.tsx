import { FC, useEffect } from 'react';
import { useAtom } from 'jotai';
import { accountAtom, walletAccountsAtom } from '@store/accountAtoms';
import { walletsAtom } from '@store/walletAtoms';
import { useState, Fragment } from 'react';
import { Transition, Dialog } from '@headlessui/react';
import { Wallet, WalletAccount } from '@talismn/connect-wallets';
import { walletAtom } from '@store/walletAtoms';
import { APP_NAME } from '@utils/constants';

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
  const closeModal = () => {
    setIsOpen(false);
  };

  const openModal = () => {
    setIsOpen(true);
  };

  const ConnectModal = () => (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="border font-inter border-[#314584] w-full max-w-fit text-base font-bold leading-5 transform overflow-hidden rounded-2xl px-12 py-8 sm:p-[40px] text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3">Select Wallet</Dialog.Title>

                <div className="mt-8 flex flex-col gap-y-4">
                  <div className="flex flex-col gap-y-5">
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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

  return (
    <div className="flex flex-row">
      <button
        onClick={openModal}
        className="flex flex-row h-fit items-center justify-center ring-1 text-base ring-[#314584] hover:ring-[#455b9c] font-semibold rounded-xl leading-5 transition duration-200 py-[10.5px] px-4 sm:py-[12px] sm:px-[33px]"
      >
        {account == null ? 'Connect Wallet' : `${account.name}`}
      </button>
      <ConnectModal />
    </div>
  );
};

export default ConnectWallet;
