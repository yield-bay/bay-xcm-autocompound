import { walletsAtom } from '@store/walletAtoms';
import { getWallets } from '@talismn/connect-wallets';
import { useAtom } from 'jotai';
import { ReactNode, useEffect } from 'react';

const Providers = ({ children }: { children: ReactNode }) => {
  const [, setWallets] = useAtom(walletsAtom);
  useEffect(() => {
    let unmounted = false;
    let supportedWallets = getWallets().filter(
      (wallet) =>
        wallet.extensionName == 'polkadot-js' ||
        wallet.extensionName == 'talisman'
    );
    if (!unmounted) {
      console.log('supportedwallets: ', supportedWallets);
      setWallets(supportedWallets);
    }
    return () => {
      unmounted = true;
    };
  }, []);
  return <>{children}</>;
};

export default Providers;
