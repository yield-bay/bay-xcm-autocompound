import { useEffect, useState } from 'react';
import _ from 'lodash';
import { useQuery } from '@tanstack/react-query';
import { fetchFarms, fetchXcmpTasks } from '@utils/api';
import { filterMGXFarms } from '@utils/farmMethods';
import FarmsList from './FarmsList';
import SearchInput from '@components/Library/SearchInput';
import useFilteredFarms from '@hooks/useFilteredFarms';
import { XcmpTaskType } from '@utils/types';
import { useAtom } from 'jotai';
import { accountAtom } from '@store/accountAtoms';

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [account] = useAtom(accountAtom);

  const [xcmpTasks, setXcmpTasks] = useState<XcmpTaskType[]>();

  // const { isLoading: isXcmpLoading, data: xcmpTasks } = useQuery({
  //   queryKey: ['xcmpTasks'],
  //   queryFn: async () => {
  //     try {
  //       const { xcmpTasks } = await fetchXcmpTasks();
  //       console.log('xcmpTasks', xcmpTasks);
  //       return xcmpTasks;
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   },
  // });

  const { isLoading, data: farms } = useQuery({
    queryKey: ['pools'],
    queryFn: async () => {
      try {
        const { farms } = await fetchFarms();
        const filteredMGXFarms = filterMGXFarms(farms); // Filter farms with MGX token
        return filteredMGXFarms;
      } catch (error) {
        console.log(error);
      }
    },
  });

  useEffect(() => {
    (async () => {
      const userAddress = account?.address;
      try {
        const { xcmpTasks } = await fetchXcmpTasks(userAddress as string);
        console.log('xcmpTasks', xcmpTasks);
        return xcmpTasks;
      } catch (error) {
        console.log(error);
      }
    })();
  }, [account?.address]);

  const [filteredFarms, noFilteredFarms] = useFilteredFarms(farms, searchTerm);

  return (
    <main className="min-w-full min-h-screen bg-baseGrayMid rounded-3xl py-14">
      <div className="max-w-[1138px] mx-auto">
        <div className="items-center w-full justify-center sm:justify-end lg:justify-center">
          <SearchInput term={searchTerm} setTerm={setSearchTerm} />
        </div>
        <FarmsList
          farms={filteredFarms}
          noFarms={noFilteredFarms}
          isLoading={isLoading}
        />
      </div>
    </main>
  );
};

export default App;
