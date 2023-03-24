import { useEffect, useState } from 'react';
import _ from 'lodash';
import MetaTags from '@components/Common/metaTags/MetaTags';
import { FarmsQuery, XcmpTasksQuery } from '@utils/api';
import { useQuery } from 'urql';
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
  const [dummyXcmp, setDummyXcmp] = useState<XcmpTaskType[]>([]);

  const [farmsResult, reexecuteQuery] = useQuery({
    query: FarmsQuery,
    variables: {
      chain: 'Mangata Kusama',
      protocol: 'Mangata X',
    },
  });
  const { data: farmsData, fetching: farmsFetching, error } = farmsResult;

  const [xcmpTasksResult, reexecuteXcmpTasksQuery] = useQuery({
    query: XcmpTasksQuery,
    variables: {
      // userAddress: account?.address,
      userAddress: '67qEhopwu1mE43vzPMR7cvrA3GaTsbKT6ktf22CXy8pbsob5',
      chain: 'ROCOCO',
    },
    pause: account == null,
  });
  const { data: xcmpTasksData, fetching: xcmpTasksFetching } = xcmpTasksResult;

  useEffect(() => {
    if (xcmpTasksFetching == false) {
      if (xcmpTasksData?.xcmpTasks.length > 0) {
        console.log('xcmpTasksData', xcmpTasksData.xcmpTasks);
      } else {
        // If no xcmp tasks, then set dummy data
        setDummyXcmp([
          {
            taskId: '123',
            userAddress: '5GVpo5GAXgzH43by4CCzbqv7mwUd1zJg3mqiZ3zHLL6UWAtB',
            lpName: 'MGR-TUR',
            chain: 'ROCOCO', // ROCOCO
            status: 'RUNNING', // RUNNING
          },
          {
            taskId: '242',
            userAddress: '5GVpo5GAXgzH43by4CCzbqv7mwUd1zJg3mqiZ3zHLL6UWAtB',
            lpName: 'MGR-IMBU',
            chain: 'ROCOCO', // ROCOCO
            status: 'FINISHED', // FINISHED
          },
        ]);
      }
    }
  }, [xcmpTasksFetching]);

  const [filteredFarms, noFilteredFarms] = useFilteredFarms(
    filterMGXFarms(farmsData?.farms),
    searchTerm
  );

  return (
    <main className="min-w-full min-h-screen bg-baseGrayMid rounded-3xl py-14">
      <MetaTags />
      <div className="max-w-[1138px] mx-auto">
        <div className="items-center w-full justify-center sm:justify-end lg:justify-center">
          <SearchInput term={searchTerm} setTerm={setSearchTerm} />
        </div>
        <FarmsList
          farms={filteredFarms}
          noFarms={noFilteredFarms}
          isLoading={farmsFetching}
          xcmpTasks={dummyXcmp}
        />
      </div>
    </main>
  );
};

export default App;
