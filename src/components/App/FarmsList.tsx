import { FC, useEffect } from 'react';
import { useAtom } from 'jotai';
import { AutocompoundEventType, FarmType, XcmpTaskType } from '@utils/types';
import Loader from '@components/Library/Loader';
import FarmCard from './FarmCard';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';
import {
  mgxBalanceAtom,
  userHasProxyAtom,
  mangataHelperAtom,
  account1Atom,
} from '@store/commonAtoms';
import { IS_PRODUCTION } from '@utils/constants';

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
  // Fetching MGX balance in Farmlist as it needs to be updated everytime farms are rendered
  const [mgxBalance, setMgxBalance] = useAtom(mgxBalanceAtom);
  const [userHasProxy] = useAtom(userHasProxyAtom);
  const [mangataHelper] = useAtom(mangataHelperAtom);
  const [account1] = useAtom(account1Atom);

  // Fetching MGX balance
  useEffect(() => {
    (async () => {
      if (mangataHelper == null) return;
      try {
        const bal = await mangataHelper.mangata?.getTokenBalance(
          0,
          account1?.address
        );
        const balFree = parseFloat(BigInt(bal.free).toString(10)) / 10 ** 18; // MGX decimals == 18
        console.log('fetched mgxbalance', balFree);
        setMgxBalance(balFree);
      } catch (error) {
        console.log('error fetching mgx balance', error);
      }
    })();
  }, [account1]);

  // const noXcmpTasks =
  //   xcmpTasks !== undefined ? (xcmpTasks.length == 0 ? true : false) : true;

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
            IS_PRODUCTION
              ? farm?.asset.symbol!
              : replaceTokenSymbols(farm?.asset.symbol!)
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
              hasProxy={userHasProxy}
            />
          );
        })
      ) : (
        <div className="flex items-center justify-center">
          <p>No Results. Try searching for something else.</p>
        </div>
      )}
      {/* {viewPositions && noXcmpTasks && (
        <>
          <p>No Results. You don&apos;t have any active positions.</p>
          <p>Please add liquidity in some pool first.</p>
        </>
      )} */}
    </div>
  );
};

export default FarmsList;
