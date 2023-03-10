import { FC, useEffect } from 'react';
import ModalWrapper from '../Library/ModalWrapper';
import { useAtom } from 'jotai';
import {
  mainModalOpenAtom,
  selectedFarmAtom,
  selectedTabModalAtom,
} from '@store/commonAtoms';
import clsx from 'clsx';
import { accountAtom } from '@store/accountAtoms';
import { FarmType } from '@utils/types';
import { WalletAccount } from '@talismn/connect-wallets';
import CompoundTab from './CompoundTab';
import AddLiquidityTab from './AddLiquidityTab';
import RemoveLiquidityTab from './RemoveLiquidityTab';

const tabs = [
  { name: 'Compound', id: 0 },
  { name: 'Add Liquidity', id: 1 },
  { name: 'Remove Liquidity', id: 2 },
];

interface TabContentProps {
  selectedTab: number;
  farm: FarmType;
  account: WalletAccount;
}

const TabContent = ({ selectedTab, farm, account }: TabContentProps) => {
  switch (selectedTab) {
    case 0:
      return <CompoundTab farm={farm} account={account} />;
    case 1:
      return <AddLiquidityTab farm={farm} account={account} />;
    case 2:
      return <RemoveLiquidityTab farm={farm} account={account} />;
    default:
      return <CompoundTab farm={farm} account={account} />;
  }
};

const MainModal: FC = () => {
  const [open, setOpen] = useAtom(mainModalOpenAtom);
  const [selectedTab, setSelectedTab] = useAtom(selectedTabModalAtom);
  const [selectedFarm] = useAtom(selectedFarmAtom);
  const [account] = useAtom(accountAtom);

  useEffect(() => {
    console.log('selectedFarm', selectedFarm);
    console.log('account', account);
  }, [selectedFarm, account]);

  return (
    <ModalWrapper open={open} setOpen={setOpen}>
      {/* DESKTOP */}
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
        />
      </div>
    </ModalWrapper>
  );
};

export default MainModal;
