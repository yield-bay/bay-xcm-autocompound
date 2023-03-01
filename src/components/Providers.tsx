import { walletsAtom } from '@store/walletAtoms';
import { getWallets } from '@talismn/connect-wallets';
import { useAtom } from 'jotai';
import { ReactNode, useEffect } from 'react';
import localFont from '@next/font/local';

// Fonts
const satoshi = localFont({
  src: [
    {
      path: '../../public/fonts/satoshi/Satoshi-Regular.woff2',
      weight: '400', // font-normal
    },
    {
      path: '../../public/fonts/satoshi/Satoshi-Medium.woff2',
      weight: '500', // font-medium
    },
    {
      path: '../../public/fonts/satoshi/Satoshi-Bold.woff2',
      weight: '700', // font-bold
    },
  ],
  variable: '--font-satoshi',
});

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

  return <div className={`${satoshi.variable} font-sans`}>{children}</div>;
};

export default Providers;
