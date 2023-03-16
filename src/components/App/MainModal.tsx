// Library Imports
import { FC, useEffect, useState, memo } from 'react';
import { useAtom } from 'jotai';
import clsx from 'clsx';
import _ from 'lodash';
import { type WalletAccount } from '@talismn/connect-wallets';
import BN from 'bn.js';
import { useToast } from '@chakra-ui/react';

// Util Imports
import {
  mainModalOpenAtom,
  poolsAtom,
  selectedFarmAtom,
  selectedTabModalAtom,
  turingHelperAtom,
  mangataHelperAtom,
  mangataAddressAtom,
  isInitialisedAtom,
} from '@store/commonAtoms';
import { accountAtom } from '@store/accountAtoms';
import { FarmType } from '@utils/types';
import { delay, getDecimalBN } from '@utils/xcm/common/utils';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';

// Component Imports
import ModalWrapper from '../Library/ModalWrapper';
import CompoundTab from './CompoundTab';
import AddLiquidityTab from './AddLiquidityTab';
import RemoveLiquidityTab from './RemoveLiquidityTab';
import ToastWrapper from '@components/Library/ToastWrapper';

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
  const [selectedFarm, setSelectedFarm] = useAtom(selectedFarmAtom);
  const [account] = useAtom(accountAtom);
  const [pools] = useAtom(poolsAtom);
  const [turingHelper] = useAtom(turingHelperAtom);
  const [mangataHelper] = useAtom(mangataHelperAtom);
  const [mangataAddress] = useAtom(mangataAddressAtom);
  const [isInitialised] = useAtom(isInitialisedAtom);

  const [pool, setPool] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const toast = useToast();

  const initialiseHelperSetup = async () => {
    if (pools == null) return;

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
      toast({
        position: 'top',
        duration: 3000,
        render: () => (
          <ToastWrapper
            title={`Couldn’t find a liquidity pool for ${poolName} ...`}
            status="error"
          />
        ),
      });
      setOpen(false);
      setSelectedFarm(null);
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
    console.log('isInitialised', isInitialised);
    console.log('selectedFarm', selectedFarm);
    if (isInitialised && selectedFarm != null) {
      initialiseHelperSetup();
    }
  }, [selectedFarm?.id, isInitialised]);

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
          preparing pool...
        </div>
      )}
    </ModalWrapper>
  );
};

export default memo(MainModal);
