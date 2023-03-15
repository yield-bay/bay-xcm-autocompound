import { useAtom } from 'jotai';
import { FC, ReactNode, useEffect } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './Layout';
import { walletAccountsAtom } from '@store/accountAtoms';
import { walletsAtom, walletAtom } from '@store/walletAtoms';
import { getWallets } from '@talismn/connect-wallets';
import { pullWalletAccounts } from '@utils/polkadotMethods';

interface Props {
  children: ReactNode;
}

const Providers: FC<Props> = ({ children }) => {
  const [, setWallets] = useAtom(walletsAtom);
  const [, setWalletAccounts] = useAtom(walletAccountsAtom);
  const [wallet] = useAtom(walletAtom);

  const queryClient = new QueryClient();

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
    <QueryClientProvider client={queryClient}>
      <ChakraProvider>
        <Layout>{children}</Layout>
      </ChakraProvider>
    </QueryClientProvider>
  );
};

export default Providers;
