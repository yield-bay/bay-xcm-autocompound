import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { has } from 'lodash';

const Home: NextPage = () => {
  const [hasPolkadotjsExt, setHasPolkadotjsExt] = useState(false);
  const [allAccounts, setAllAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccount, setSelectedAccount] =
    useState<InjectedAccountWithMeta>();

  // Function to Select wallets
  const handleOnClickConnectPolkadotExtension = async () => {
    const extension = await web3Enable('YieldBay Mangata');
    if (extension.length == 0) {
      setHasPolkadotjsExt(false);
      return;
    }
    const allAccounts = await web3Accounts();
    setHasPolkadotjsExt(true);
    setAllAccounts(allAccounts);

    if (allAccounts.length === 1) {
      setSelectedAccount(allAccounts[0]);
    }
  };

  useEffect(() => {
    setHasPolkadotjsExt(has(window?.injectedWeb3, 'polkadot-js'));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>Mangata App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex w-full flex-1 flex-col items-center justify-center px-10 text-center max-w-fit">
        {/* Has polkadot extenstion and have no accounts fetched */}
        {hasPolkadotjsExt && allAccounts.length === 0 ? (
          <button
            className="w-full flex rounded-full border items-center p-8 transform hover:scale-102"
            onClick={handleOnClickConnectPolkadotExtension}
          >
            <div className="w-full flex-1 flex flex-row items-center text-left space-x-6">
              <Image
                src="/images/polkadot-ext.svg"
                width="45"
                height="45"
                alt="walletIcon"
              />
              <p className="font-medium text-lg">
                Connect to the Polkadot wallet
              </p>
            </div>
          </button>
        ) : (
          !hasPolkadotjsExt && (
            <div>
              <p>
                Please install either PolkadotJS or Talisman wallet extension
              </p>
            </div>
          )
        )}
        {/* There are more than 1 account but none is selected */}
        {allAccounts.length > 0 && !selectedAccount && (
          <div className="flex flex-col mt-5 gap-5 max-w-xl">
            <p>No account selected</p>
            <p>Select one of the accounts:</p>
            {allAccounts.map((account) => {
              return (
                <button
                  key={account.address}
                  className="text-left border w-full border-black px-10 py-6
                rounded-lg hover:scale-[1.02] transition duration-200 hover:shadow-lg"
                  onClick={() => setSelectedAccount(account)}
                >
                  <p>Name: {account.meta.name}</p>
                  <p>
                    Address: {account.address.slice(0, 5)}...
                    {account.address.slice(-5)}
                  </p>
                  <p>Wallet: {account.meta.source}</p>
                </button>
              );
            })}
          </div>
        )}
        {/* Have a account selected */}
        {selectedAccount && (
          <div>
            <p className="text-left">Selected Account:</p>
            <button
              className="text-left border w-full border-black px-10 py-6
                          rounded-lg hover:scale-[1.02] transition duration-200 hover:shadow-lg"
            >
              <p>Name: {selectedAccount.meta.name}</p>
              <p>
                Address: {selectedAccount.address.slice(0, 5)}...
                {selectedAccount.address.slice(-5)}
              </p>
              <p>Wallet: {selectedAccount.meta.source}</p>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
