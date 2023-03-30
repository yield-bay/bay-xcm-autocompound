import { useEffect, useState } from 'react';
import _ from 'lodash';
import MetaTags from '@components/Common/metaTags/MetaTags';
import {
  FarmsQuery,
  XcmpTasksQuery,
  AddXcmpTaskMutation,
  UpdateXcmpTaskMutation,
} from '@utils/api';
import { useMutation, useQuery } from 'urql';
import { filterMGXFarms } from '@utils/farmMethods';
import FarmsList from './FarmsList';
import SearchInput from '@components/Library/SearchInput';
import useFilteredFarms from '@hooks/useFilteredFarms';
import { XcmpTaskType } from '@utils/types';
import { useAtom } from 'jotai';
import { accountAtom } from '@store/accountAtoms';
import { turingAddressAtom } from '@store/commonAtoms';

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [account] = useAtom(accountAtom);
  const [turingAddress] = useAtom(turingAddressAtom);

  console.log('turing address', turingAddress);

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
      userAddress: turingAddress,
      chain: 'ROCOCO',
    },
    pause: account == null,
  });
  const { data: xcmpTasksData, fetching: xcmpTasksFetching } = xcmpTasksResult;

  useEffect(() => {
    console.log('xcmpTasksData', xcmpTasksData?.xcmpTasks);
  }, [xcmpTasksData]);

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
          isLoading={farmsFetching || xcmpTasksData?.xcmpTasks == undefined}
          xcmpTasks={xcmpTasksData?.xcmpTasks ?? []}
        />
      </div>
    </main>
  );
};

export default App;
