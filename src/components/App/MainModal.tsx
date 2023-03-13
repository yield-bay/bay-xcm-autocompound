import { FC, useEffect, useState } from 'react';
import ModalWrapper from '../Library/ModalWrapper';
import { useAtom } from 'jotai';
import {
  mainModalOpenAtom,
  promotedPools,
  selectedFarmAtom,
  selectedTabModalAtom,
  turingHelperAtom,
  mangataHelperAtom,
  account1Atom,
  mangataAddressAtom,
  turingAddressAtom,
} from '@store/commonAtoms';
import clsx from 'clsx';
import { accountAtom } from '@store/accountAtoms';
import { FarmType } from '@utils/types';
import { WalletAccount } from '@talismn/connect-wallets';
import CompoundTab from './CompoundTab';
import AddLiquidityTab from './AddLiquidityTab';
import RemoveLiquidityTab from './RemoveLiquidityTab';
import _ from 'lodash';

// Utils
import { MangataRococo, TuringStaging } from '@utils/xcm/config';
import BN from 'bn.js';
import { delay, getDecimalBN } from '@utils/xcm/common/utils';
import Account from '@utils/xcm/common/account';
import MangataHelper from '@utils/xcm/common/mangataHelper';
import TuringHelper from '@utils/xcm/common/turingHelper';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';

const tabs = [
  { name: 'Compound', id: 0 },
  { name: 'Add Liquidity', id: 1 },
  { name: 'Remove Liquidity', id: 2 },
];

interface TabContentProps {
  selectedTab: number;
  farm: FarmType;
  account: WalletAccount;
  pool: any;
}

const MainModal: FC = () => {
  const [open, setOpen] = useAtom(mainModalOpenAtom);
  const [selectedTab, setSelectedTab] = useAtom(selectedTabModalAtom);
  const [selectedFarm] = useAtom(selectedFarmAtom);
  const [account] = useAtom(accountAtom);
  const [, setMangataHelperX] = useAtom(mangataHelperAtom);
  const [, setTuringHelperX] = useAtom(turingHelperAtom);
  const [, setAccount1] = useAtom(account1Atom);
  const [, setMangataAddress] = useAtom(mangataAddressAtom);
  const [, setTuringAddress] = useAtom(turingAddressAtom);
  // const [pools, setPools] = useAtom(promotedPools);

  const [pool, setPool] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const initialiseHelperSetup = async () => {
    if (account?.address == null) return;

    // TODO: Calling it here until i find a way to modularise it
    // This code should initialise first before doing anything
    // So, can put it in Layout or App.tsx

    setIsLoading(true);

    const signer = account?.wallet?.signer;

    console.log('Initializing APIs of both chains ...');

    // Helper setup for Mangata and Turing on Rococo Testnet
    const turingHelper = new TuringHelper(TuringStaging);
    await turingHelper.initialize();
    setTuringHelperX(turingHelper);

    const mangataHelper = new MangataHelper(MangataRococo);
    await mangataHelper.initialize();
    setMangataHelperX(mangataHelper);

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
    setAccount1(account1);

    const mangataAddress = account1.getChainByName(mangataChainName)?.address;
    const turingAddress = account1.getChainByName(turingChainName)?.address;
    console.log('mangataAddress', mangataAddress);
    console.log('turingAddress', turingAddress);
    setMangataAddress(mangataAddress);
    setTuringAddress(turingAddress);

    const pools = await mangataHelper.getPools({ isPromoted: true });
    console.log('Promoted Pools', pools);

    const tokenNames = formatTokenSymbols(
      replaceTokenSymbols(selectedFarm?.asset.symbol as string)
    );
    // const poolName = `${mgxToken.symbol}-${turToken.symbol}`
    const poolName = `${tokenNames[0]}-${tokenNames[1]}`;
    console.log('poolname', poolName);
    const token0 = tokenNames[0];
    const token1 = tokenNames[1];

    // Make a state for this
    const pool = _.find(pools, {
      firstTokenId: mangataHelper.getTokenIdBySymbol(token0),
      secondTokenId: mangataHelper.getTokenIdBySymbol(token1),
    });
    setPool(pool);
    console.log(`Found a pool of ${poolName}`, pool);

    if (_.isUndefined(pool)) {
      throw new Error(`Couldn’t find a liquidity pool for ${poolName} ...`);
    }

    // Calculate rwards amount in pool
    const { liquidityTokenId } = pool;

    console.log(
      `Checking how much reward available in ${poolName} pool, tokenId: ${liquidityTokenId} ...`
    );

    // Issue: current we couldn’t read this rewards value correct by always getting 0 on the claimable rewards.
    // The result is different from that in src/mangata.js
    const rewardAmount = await mangataHelper.calculateRewardsAmount(
      mangataAddress,
      liquidityTokenId
    );
    console.log(`Claimable reward in ${poolName}: `, rewardAmount);

    const liquidityBalance = await mangataHelper.mangata?.getTokenBalance(
      liquidityTokenId,
      mangataAddress
    );
    const poolNameDecimalBN = getDecimalBN(
      mangataHelper.getDecimalsBySymbol(poolName)
    );
    console.log(
      'liquidity balance',
      liquidityBalance?.reserved,
      'poolName DecimalBN',
      poolNameDecimalBN,
      'decimal',
      mangataHelper.getDecimalsBySymbol(poolName)
    );

    const numReserved = new BN(liquidityBalance.reserved).div(
      poolNameDecimalBN
    );

    console.log(
      `Before auto-compound, ${
        account?.name
      } reserved "${poolName}": ${numReserved.toString()} ... lb ${liquidityBalance.reserved.toString()}`
    );

    console.log('num reserved', numReserved);

    setIsLoading(false);
  };

  useEffect(() => {
    initialiseHelperSetup();
  }, [selectedFarm?.id]);

  const TabContent = ({ selectedTab, farm, account }: TabContentProps) => {
    switch (selectedTab) {
      case 0:
        return <CompoundTab farm={farm} account={account} pool={pool} />;
      case 1:
        return <AddLiquidityTab farm={farm} account={account} pool={pool} />;
      case 2:
        return <RemoveLiquidityTab farm={farm} account={account} pool={pool} />;
      default:
        return <CompoundTab farm={farm} account={account} pool={pool} />;
    }
  };

  return (
    <ModalWrapper open={open} setOpen={setOpen}>
      {/* DESKTOP */}
      {!isLoading ? (
        <div className="hidden sm:block">
          <nav className="inline-flex justify-between w-full" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setSelectedTab(tab.id)}
                className={clsx(
                  tab.id == selectedTab
                    ? 'ring-1 ring-primaryGreen  px-4'
                    : 'opacity-40',
                  'rounded-md px-4 py-[10px] transition duration-300 ease-in-out'
                )}
                aria-current={tab.id ? 'page' : undefined}
              >
                {tab.name}
              </button>
            ))}
          </nav>
          <TabContent
            selectedTab={selectedTab}
            farm={selectedFarm as FarmType}
            account={account as WalletAccount}
            pool={pool}
          />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          initialising...
        </div>
      )}
    </ModalWrapper>
  );
};

export default MainModal;
