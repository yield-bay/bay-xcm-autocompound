import { FC, useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { AutocompoundEventType, FarmType, XcmpTaskType } from '@utils/types';
import Loader from '@components/Library/Loader';
import FarmCard from './FarmCard';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';
import {
  viewPositionsAtom,
  account1Atom,
  mangataHelperAtom,
  mgxBalanceAtom,
} from '@store/commonAtoms';
import { getDecimalBN } from '@utils/xcm/common/utils';

interface Props {
  farms: FarmType[];
  noFarms: boolean;
  isLoading: boolean;
  xcmpTasks: XcmpTaskType[];
  autocompoundEvents: AutocompoundEventType[];
}

const FarmsList: FC<Props> = ({
  farms,
  noFarms,
  isLoading,
  xcmpTasks,
  autocompoundEvents,
}) => {
  const [viewPositions] = useAtom(viewPositionsAtom);
  const [account1] = useAtom(account1Atom);
  const [mangataHelper] = useAtom(mangataHelperAtom);
  const [mgxBalance, setMgxBalance] = useAtom(mgxBalanceAtom);

  const noXcmpTasks =
    xcmpTasks !== undefined ? (xcmpTasks.length == 0 ? true : false) : true;

  useEffect(() => {
    // Fetching MGX and TUR balance of connect account on Mangata Chain
    (async () => {
      if (account1) {
        const mgrBalance = await mangataHelper.mangata?.getTokenBalance(
          '0', // MGR TokenId
          account1.address
        );
        const mgrBalanceFree = mgrBalance.free
          .div(getDecimalBN(18)) // MGR decimals = 18
          .toNumber();
        setMgxBalance(mgrBalanceFree);
      }
    })();
  }, [account1]);

  return (
    <div className="flex flex-col items-center gap-y-[25px] my-16">
      {isLoading ? (
        <>
          <Loader size="lg" />
          <p>loading pools...</p>
        </>
      ) : !noFarms ? (
        farms.map((farm, index) => {
          const [token0, token1] = formatTokenSymbols(
            replaceTokenSymbols(farm?.asset.symbol)
          );
          const xcmpTask = xcmpTasks.find(
            (task) => task.lpName == `${token0}-${token1}`
          );
          const autocompoundEvent = autocompoundEvents.find(
            (event) => event.lp.symbol == `${token0}-${token1}`
          );
          return (
            <FarmCard
              farm={farm}
              key={index}
              xcmpTask={xcmpTask}
              autocompoundEvent={autocompoundEvent}
              mgxBalance={mgxBalance}
            />
          );
        })
      ) : (
        <div className="flex items-center justify-center">
          <p>No Results. Try searching for something else.</p>
        </div>
      )}
      {viewPositions && noXcmpTasks && (
        <>
          <p>No Results. You don&apos;t have any active positions.</p>
          <p>Please add liquidity in some pool first.</p>
        </>
      )}
    </div>
  );
};

export default FarmsList;
