import { useAtom } from 'jotai';
import { accountAtom, walletAccountsAtom } from '@store/accountAtoms';
import { walletAtom, walletsAtom } from '@store/walletAtoms';
import { useEffect, useState } from 'react';
import _ from 'lodash';
import { getWallets } from '@talismn/connect-wallets';
import Header from '@components/Header';

const Home = () => {
  return (
    <div className="min-h-screen w-full">
      <Header />
    </div>
  );
};

export default Home;
