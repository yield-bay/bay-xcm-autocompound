import { useEffect, useState } from 'react';
import _ from 'lodash';
import MetaTags from '@components/Common/metaTags/MetaTags';
import {
  autocompoundEventsQuery,
  FarmsQuery,
  XcmpTasksQuery,
} from '@utils/api';
import { useQuery } from 'urql';
import { useAtom } from 'jotai';
import clsx from 'clsx';
import { filterMGXFarms } from '@utils/farmMethods';
import FarmsList from './FarmsList';
import SearchInput from '@components/Library/SearchInput';
import useFilteredFarms from '@hooks/useFilteredFarms';
import { accountAtom } from '@store/accountAtoms';
import {
  account1Atom,
  isInitialisedAtom,
  turingAddressAtom,
  viewPositionsAtom,
  lpUpdatedAtom,
  taskUpdatedAtom,
} from '@store/commonAtoms';
import { IS_PRODUCTION } from '@utils/constants';

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [account] = useAtom(accountAtom);
  const [turingAddress] = useAtom(turingAddressAtom);
  const [viewPositions] = useAtom(viewPositionsAtom);
  const [account1] = useAtom(account1Atom);
  const [isInitialised] = useAtom(isInitialisedAtom);
  const [lpUpdated] = useAtom(lpUpdatedAtom);
  const [taskUpdated] = useAtom(taskUpdatedAtom);

  const [farmsResult, reexecuteQuery] = useQuery({
    query: FarmsQuery,
    variables: {
      chain: 'Mangata Kusama',
      protocol: 'Mangata X',
    },
  });
  const { data: farmsData, fetching: farmsFetching, error } = farmsResult;

  useEffect(() => {
    // Re-fetching farms when LP Balance is updated
    reexecuteQuery({ requestPolicy: 'network-only' });
  }, [lpUpdated]);

  const [xcmpTasksResult, reexecuteXcmpTasksQuery] = useQuery({
    query: XcmpTasksQuery,
    variables: {
      userAddress: turingAddress,
      chain: IS_PRODUCTION ? 'KUSAMA' : 'ROCOCO',
    },
    pause: turingAddress == null && !isInitialised,
  });
  const { data: xcmpTasksData, fetching: xcmpTasksFetching } = xcmpTasksResult;

  useEffect(() => {
    console.log('xcmpTasksData', xcmpTasksData?.xcmpTasks);
    reexecuteXcmpTasksQuery({ requestPolicy: 'network-only' });
  }, [account, account1, taskUpdated]);

  const [autocompoundEventsResult, reexecuteAutocompoundEventsQuery] = useQuery(
    {
      query: autocompoundEventsQuery,
      variables: {
        userAddress: turingAddress,
        chain: IS_PRODUCTION ? 'KUSAMA' : 'ROCOCO',
      },
      pause: turingAddress == null && !isInitialised,
    }
  );
  const { data: autocompoundEventsData, fetching: autocompoundEventsFetching } =
    autocompoundEventsResult;

  // Re-execute AutocompoundEventsQuery when any task is added or removed
  useEffect(() => {
    console.log('autocompoundEventsData', autocompoundEventsData);
    reexecuteAutocompoundEventsQuery({ requestPolicy: 'network-only' });
  }, [account1, taskUpdated]);

  const [filteredFarms, noFilteredFarms] = useFilteredFarms(
    filterMGXFarms(farmsData?.farms),
    searchTerm
  );

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
              ? farmsFetching ||
                xcmpTasksData?.xcmpTasks == undefined ||
                autocompoundEventsData?.autocompoundEvents == undefined ||
                xcmpTasksFetching ||
                autocompoundEventsFetching
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
