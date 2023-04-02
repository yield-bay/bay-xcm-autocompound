import { FC } from 'react';
import { useAtom } from 'jotai';
import { AutocompoundEventType, FarmType, XcmpTaskType } from '@utils/types';
import Loader from '@components/Library/Loader';
import FarmCard from './FarmCard';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';
import { viewPositionsAtom } from '@store/commonAtoms';

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
  const noXcmpTasks =
    xcmpTasks !== undefined ? (xcmpTasks.length == 0 ? true : false) : true;

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
