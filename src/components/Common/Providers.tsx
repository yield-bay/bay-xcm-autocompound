import { useAtom } from 'jotai';
import { FC, ReactNode, useEffect } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './Layout';
import { walletAccountsAtom } from '@store/accountAtoms';
import { walletsAtom, walletAtom } from '@store/walletAtoms';
import { getWallets } from '@talismn/connect-wallets';
import { pullWalletAccounts } from '@utils/polkadotMethods';
import { createClient, defaultExchanges, Provider as UrqlProvider } from 'urql';
import { API_URL } from '@utils/constants';

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
    let supportedWallets = getWallets().filter(
      (wallet) =>
        wallet.extensionName == 'polkadot-js' ||
        wallet.extensionName == 'talisman' ||
        wallet.extensionName == 'subwallet-js'
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
      pullWalletAccounts(wallet, setWalletAccounts);
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
