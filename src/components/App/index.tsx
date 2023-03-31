import { useEffect, useState } from 'react';
import _ from 'lodash';
import MetaTags from '@components/Common/metaTags/MetaTags';
import {
  autocompoundEventsQuery,
  FarmsQuery,
  XcmpTasksQuery,
} from '@utils/api';
import { useMutation, useQuery } from 'urql';
import { filterMGXFarms } from '@utils/farmMethods';
import FarmsList from './FarmsList';
import SearchInput from '@components/Library/SearchInput';
import useFilteredFarms from '@hooks/useFilteredFarms';
import { useAtom } from 'jotai';
import { accountAtom } from '@store/accountAtoms';
import { turingAddressAtom, viewPositionsAtom } from '@store/commonAtoms';
import clsx from 'clsx';

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [account] = useAtom(accountAtom);
  const [turingAddress] = useAtom(turingAddressAtom);
  const [viewPositions] = useAtom(viewPositionsAtom);

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

  const [autocompoundEventsResult, reexecuteAutocompoundEventsQuery] = useQuery(
    {
      query: autocompoundEventsQuery,
      variables: {
        userAddress: turingAddress,
        chain: 'ROCOCO',
      },
      pause: account == null,
    }
  );
  const { data: autocompoundEventsData, fetching: autocompoundEventsFetching } =
    autocompoundEventsResult;

  useEffect(() => {
    console.log('autocompoundEventsData', autocompoundEventsData);
  }, [autocompoundEventsData]);

  const [filteredFarms, noFilteredFarms] = useFilteredFarms(
    filterMGXFarms(farmsData?.farms),
    searchTerm
  );

  // const [updateAutocompoundEventResult, updateAutocompoundEvent] = useMutation(
  //   updateAutocompoundEventStatusMutation
  // );
  // const updateAutocompoundingHandler = async (
  //   userAddress: string,
  //   chain: string,
  //   taskId: string,
  //   lp: TokenType,
  //   newStatus: string
  // ) => {
  //   const variables = {
  //     userAddress,
  //     chain,
  //     taskId,
  //     lp,
  //     newStatus,
  //   };
  //   console.log('Updating the autocompounding event...');
  //   updateAutocompoundEvent(variables).then((result) => {
  //     console.log('updateAutocompounding Result', result);
  //   });
  // };

  return (
    <main
      className={clsx(
        'min-w-full bg-baseGrayMid rounded-3xl py-14',
        farmsFetching || xcmpTasksData?.xcmpTasks == undefined
          ? 'min-h-screen'
          : 'min-h-fit'
      )}
    >
      <MetaTags />
      <div className="max-w-[1138px] mx-auto">
        <div className="items-center w-full justify-center sm:justify-end lg:justify-center">
          <SearchInput
            term={searchTerm}
            setTerm={setSearchTerm}
            disabled={viewPositions}
          />
        </div>
        <FarmsList
          farms={filteredFarms}
          noFarms={noFilteredFarms}
          isLoading={
            account
              ? farmsFetching || xcmpTasksData?.xcmpTasks == undefined
              : farmsFetching
          }
          xcmpTasks={xcmpTasksData?.xcmpTasks ?? []}
          autocompoundEvents={autocompoundEventsData?.autocompoundEvents ?? []}
        />
      </div>
    </main>
  );
};

export default App;
