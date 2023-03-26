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

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [account] = useAtom(accountAtom);

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
      userAddress: '67qEhopwu1mE43vzPMR7cvrA3GaTsbKT6ktf22CXy8pbsob5', // Jack Sparrow's Turing Address
      chain: 'ROCOCO',
    },
    pause: account == null,
  });
  const { data: xcmpTasksData, fetching: xcmpTasksFetching } = xcmpTasksResult;

  // ADD NEW TASK
  const [addXcmpTaskResult, addXcmpTask] = useMutation(AddXcmpTaskMutation);
  const addXcmpTaskHandler = async (
    taskId: string,
    userAddress: string,
    lpName: string,
    chain: string
  ) => {
    const variables = { taskId, userAddress, lpName, chain };
    console.log('Adding new task...');
    addXcmpTask(variables).then((result) => {
      console.log('addxcmptask result', result);
    });
  };

  // UPDATE TASK
  const [updateXcmpTaskResult, updateXcmpTask] = useMutation(
    UpdateXcmpTaskMutation
  );
  const updateXcmpTaskHandler = async (
    taskId: string,
    userAddress: string,
    lpName: string,
    chain: string,
    newStatus: string
  ) => {
    const variables = { taskId, userAddress, lpName, chain, newStatus };
    console.log('Updating task...');
    updateXcmpTask(variables).then((result) => {
      console.log('updateXcmpTask result', result);
    });
  };

  useEffect(() => {
    if (xcmpTasksFetching == false) {
      console.log('xcmpTasksData', xcmpTasksData?.xcmpTasks);
    } else {
      console.log('xcmpTasksFetching', xcmpTasksFetching);
    }
  }, [xcmpTasksData]);

  const [filteredFarms, noFilteredFarms] = useFilteredFarms(
    filterMGXFarms(farmsData?.farms),
    searchTerm
  );

  return (
    <main className="min-w-full min-h-screen bg-baseGrayMid rounded-3xl py-14">
      <MetaTags />
      <div className="max-w-[1138px] mx-auto">
        {/* <Button
          bgColor="white"
          textColor="black"
          size="lg"
          onClick={() =>
            updateXcmpTaskHandler(
              '321', // taskId
              '67qEhopwu1mE43vzPMR7cvrA3GaTsbKT6ktf22CXy8pbsob5', // userAddress
              'MGR-IMBU', // lpName
              'ROCOCO', // chain
              'CANCELLED' // status
            )
          }
        >
          Update task
        </Button> */}
        <div className="items-center w-full justify-center sm:justify-end lg:justify-center">
          <SearchInput term={searchTerm} setTerm={setSearchTerm} />
        </div>
        <FarmsList
          farms={filteredFarms}
          noFarms={noFilteredFarms}
          isLoading={farmsFetching || xcmpTasksFetching}
          xcmpTasks={xcmpTasksData?.xcmpTasks ?? []}
        />
      </div>
    </main>
  );
};

export default App;
