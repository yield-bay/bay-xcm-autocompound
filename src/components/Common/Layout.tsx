import { FC, ReactNode, useEffect } from 'react';
import { useIsMounted } from '@hooks/useIsMounted';
import Loading from '@components/Common/Loading';
import clsx from 'clsx';
import { satoshiFont } from '@utils/localFont';
import ConnectModal from '@components/Library/ConnectModal';
import MainModal from '@components/App/MainModal';
import Header from './Header';
import { useAtom } from 'jotai';
import { accountAtom } from '@store/accountAtoms';
import { MangataRococo, TuringStaging } from '@utils/xcm/config';
import TuringHelper from '@utils/xcm/common/turingHelper';
import MangataHelper from '@utils/xcm/common/mangataHelper';
import Account from '@utils/xcm/common/account';
import _ from 'lodash';
import Footer from './Footer';

interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
  const { mounted } = useIsMounted();
  const [account] = useAtom(accountAtom);

  useEffect(() => {
    (async () => {
      if (account?.address == null) return;

      // This code should initialise first before doing anything
      // So, can put it in Layout or App.tsx
      const signer = account?.wallet?.signer;

      console.log('Initializing APIs of both chains ...');

      // Helper setup for Mangata and Turing on Rococo Testnet
      const turingHelper = new TuringHelper(TuringStaging);
      await turingHelper.initialize();

      const mangataHelper = new MangataHelper(MangataRococo);
      await mangataHelper.initialize();

      const turingChainName = turingHelper.config.key;
      const mangataChainName = mangataHelper.config.key;

      console.log('turing Assets', turingHelper.config.assets);
      console.log('mangata Assets', mangataHelper.config.assets);

      const turingNativeToken = _.first(turingHelper.config.assets);
      const mangataNativeToken = _.first(mangataHelper.config.assets);

      console.log(
        `\nTuring chain name: ${turingChainName}, native token: ${JSON.stringify(
          turingNativeToken
        )}`
      );
      console.log(
        `Mangata chain name: ${mangataChainName}, native token: ${JSON.stringify(
          mangataNativeToken
        )}\n`
      );

      console.log('1. Reading token and balance of account ...');

      console.log('account', account);

      // New account instance from connected account
      const account1 = new Account({
        address: account?.address,
        meta: {
          name: account?.name,
        },
      });
      await account1.init([turingHelper, mangataHelper]);
      console.log('account1', account1);

      const mangataAddress = account1.getChainByName(mangataChainName)?.address;
      const turingAddress = account1.getChainByName(turingChainName)?.address;
      console.log('mangataAddress', mangataAddress);
      console.log('turingAddress', turingAddress);

      const pools = await mangataHelper.getPools({ isPromoted: true });
      console.log('Promoted Pools', pools);
    })();
  }, []);

  if (!mounted) {
    return <Loading />;
  }

  return (
    <div
      className={clsx(
        'flex flex-col min-h-screen w-full font-sans text-white font-bold tracking-wide bg-bgBlack bg-bg-pattern',
        satoshiFont.variable
      )}
    >
      <ConnectModal />
      <MainModal />
      <div className="flex flex-col flex-1">
        <Header />
        {children}
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
