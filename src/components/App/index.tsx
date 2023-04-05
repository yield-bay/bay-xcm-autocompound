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
  turingAddressAtom,
  viewPositionsAtom,
} from '@store/commonAtoms';

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [account] = useAtom(accountAtom);
  const [turingAddress] = useAtom(turingAddressAtom);
  const [viewPositions] = useAtom(viewPositionsAtom);
  const [account1] = useAtom(account1Atom);

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
    reexecuteXcmpTasksQuery({ requestPolicy: 'network-only' });
  }, [account, account1]);

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
