import { useAtom } from 'jotai';
import { FC, ReactNode, useEffect } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './Layout';
import { walletAccountsAtom } from '@store/accountAtoms';
import { walletsAtom, walletAtom } from '@store/walletAtoms';
import { getWallets, WalletAccount } from '@talismn/connect-wallets';
import { createClient, defaultExchanges, Provider as UrqlProvider } from 'urql';
import { API_URL, APP_NAME } from '@utils/constants';

interface Props {
  children: ReactNode;
}

const Providers: FC<Props> = ({ children }) => {
  const [, setWallets] = useAtom(walletsAtom);
  const [, setWalletAccounts] = useAtom(walletAccountsAtom);
  const [wallet] = useAtom(walletAtom);

  const queryClient = new QueryClient();

  const urqlClient = createClient({
    url: API_URL,
    exchanges: defaultExchanges,
    requestPolicy: 'cache-and-network',
  });

  useEffect(() => {
    let unmounted = false;
    const walletsOrder = ['talisman', 'polkadot-js', 'subwallet-js'];
    let supportedWallets = getWallets().filter((wallet) =>
      walletsOrder.includes(wallet.extensionName)
    );
    if (!unmounted) {
      setWallets(supportedWallets);
    }
    return () => {
      unmounted = true;
    };
  }, []);

  useEffect(() => {
    if (wallet !== null) {
      (async () => {
        try {
          await wallet.enable(APP_NAME);
          await wallet.subscribeAccounts(
            (accounts: WalletAccount[] | undefined) => {
              // jotai:: setting accounts in selected wallet
              setWalletAccounts(accounts as WalletAccount[]);
            }
          );
        } catch (err) {
          console.log('Error in subscribing accounts: ', err);
        }
      })();
    }
  }, [wallet]);

  return (
    <ChakraProvider>
      <QueryClientProvider client={queryClient}>
        <UrqlProvider value={urqlClient}>
          <Layout>{children}</Layout>
        </UrqlProvider>
      </QueryClientProvider>
    </ChakraProvider>
  );
};

export default Providers;
