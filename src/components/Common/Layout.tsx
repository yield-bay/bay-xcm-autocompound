// Library Imports
import { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { useAtom } from 'jotai';
import clsx from 'clsx';
import _ from 'lodash';

// Component Imports
import ConnectModal from '@components/Library/ConnectModal';
import Loading from '@components/Common/Loading';
import MainModal from '@components/App/MainModal';
import Header from './Header';
import Footer from './Footer';

// Util, Store and Hook Imports
import { useIsMounted } from '@hooks/useIsMounted';
import { satoshiFont } from '@utils/localFont';
import { accountAtom } from '@store/accountAtoms';
import {
  mangataHelperAtom,
  turingHelperAtom,
  account1Atom,
  mangataAddressAtom,
  turingAddressAtom,
  poolsAtom,
  isInitialisedAtom,
} from '@store/commonAtoms';
import { MangataRococo, TuringStaging } from '@utils/xcm/config';
import TuringHelper from '@utils/xcm/common/turingHelper';
import MangataHelper from '@utils/xcm/common/mangataHelper';
import Account from '@utils/xcm/common/account';
import StopCompoundingModal from '@components/App/StopCompoundingModal';

interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
  const { mounted } = useIsMounted();
  const [account] = useAtom(accountAtom);
  const [mangataHelperx, setMangataHelper] = useAtom(mangataHelperAtom);
  const [turingHelperx, setTuringHelper] = useAtom(turingHelperAtom);
  const [accountInit, setAccountInit] = useAtom(account1Atom);
  const [, setMangataAddress] = useAtom(mangataAddressAtom);
  const [, setTuringAddress] = useAtom(turingAddressAtom);
  const [, setPools] = useAtom(poolsAtom);
  const [, setIsInitialised] = useAtom(isInitialisedAtom);

  // Initial turing and mangata Helper setup.
  // This is done only once when the app is loaded.
  useEffect(() => {
    (async (accountInit) => {
      if (account?.address == null) {
        console.log('Connect wallet to use App!');
        return;
      }

      if (
        mangataHelperx != null &&
        turingHelperx != null &&
        accountInit?.address === account.address
      ) {
        console.log('accountinit', accountInit?.address);
        console.log('account address', account.address);
        console.log('Already initialised!');
        return;
      }

      console.log('Initializing APIs of both chains ...');

      // Helper setup for Mangata and Turing on Rococo Testnet
      const turingHelper = new TuringHelper(TuringStaging);
      await turingHelper.initialize();
      setTuringHelper(turingHelper);

      const mangataHelper = new MangataHelper(MangataRococo);
      await mangataHelper.initialize();
      setMangataHelper(mangataHelper);

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

      // New account instance from connected account
      const account1 = new Account({
        address: account?.address,
        meta: {
          name: account?.name,
        },
      });
      await account1.init([turingHelper, mangataHelper]);
      console.log('account1', account1);
      // It is setting Account1 here, and this fn runs only once in starting
      // it should re-run when an account is updated.
      setAccountInit(account1);

      const mangataAddress = account1.getChainByName(mangataChainName)?.address;
      const turingAddress = account1.getChainByName(turingChainName)?.address;
      // console.log('mangataAddress', mangataAddress);
      // console.log('turingAddress', turingAddress);
      setMangataAddress(mangataAddress);
      setTuringAddress(turingAddress);

      const pools = await mangataHelper.getPools({ isPromoted: true });
      console.log('Promoted Pools', pools);
      setPools(pools);
      setIsInitialised(true);
    })(accountInit);
  }, [account]);

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
      <StopCompoundingModal />
      <div className="flex flex-col flex-1">
        <Header />
        {children}
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
