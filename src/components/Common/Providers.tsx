import { walletsAtom } from '@store/walletAtoms';
import { getWallets } from '@talismn/connect-wallets';
import { useAtom } from 'jotai';
import { FC, ReactNode, useEffect } from 'react';
import localFont from 'next/font/local';
import Layout from './Layout';

// Fonts
const satoshi = localFont({
  src: '../../styles/fonts/Satoshi-Variable.ttf',
  variable: '--font-satoshi',
});

interface Props {
  children: ReactNode;
}

const Providers: FC<Props> = ({ children }) => {
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

  return (
    <div className={`${satoshi.variable} font-sans`}>
      <Layout>{children}</Layout>
    </div>
  );
};

export default Providers;
