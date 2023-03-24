import { FC } from 'react';
import { FarmType, XcmpTaskType } from '@utils/types';
import Loader from '@components/Library/Loader';
import FarmCard from './FarmCard';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';

interface Props {
  farms: FarmType[];
  noFarms: boolean;
  isLoading: boolean;
  xcmpTasks: XcmpTaskType[];
}

const FarmsList: FC<Props> = ({ farms, noFarms, isLoading, xcmpTasks }) => {
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
          return <FarmCard farm={farm} key={index} xcmpTask={xcmpTask} />;
        })
      ) : (
        <div className="flex items-center justify-center">
          <p>No Results. Try searching for something else.</p>
        </div>
      )}
    </div>
  );
};

export default FarmsList;
