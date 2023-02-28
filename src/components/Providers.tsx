import { walletsAtom } from '@store/walletAtoms';
import { getWallets } from '@talismn/connect-wallets';
import { useAtom } from 'jotai';
import { ReactNode, useEffect } from 'react';

const Providers = ({ children }: { children: ReactNode }) => {
  // Wallet Setup on mount
  const [, setWallets] = useAtom(walletsAtom);
  useEffect(() => {
    let unmounted = false;
    let supportedWallets = getWallets().filter(
      (wallet) =>
        wallet.extensionName == 'polkadot-js' ||
        wallet.extensionName == 'talisman'
    );
    if (!unmounted) {
      setWallets(supportedWallets);
    }
    return () => {
      unmounted = true;
    };
  }, []);

  return <div>{children}</div>;
};

export default Providers;
