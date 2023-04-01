import { useEffect, useState } from 'react';
import _ from 'lodash';
import MetaTags from '@components/Common/metaTags/MetaTags';
import {
  autocompoundEventsQuery,
  FarmsQuery,
  XcmpTasksQuery,
  createLiquidityEventMutation,
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
import Button from '@components/Library/Button';
import { TokenType } from '@utils/types';
import moment from 'moment';

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

  const [createLiquidityEventResult, createLiquidityEvent] = useMutation(
    createLiquidityEventMutation
  );
  const createLiquidityEventHandler = async (
    userAddress: string,
    chain: string,
    token0: TokenType,
    token1: TokenType,
    lp: TokenType,
    timestamp: string,
    gasFees: number,
    eventType: string
  ) => {
    const variables = {
      userAddress,
      chain,
      token0,
      token1,
      lp,
      timestamp,
      gasFees,
      eventType,
    };
    console.log('Updating the createLiquidityEvent...');
    createLiquidityEvent(variables).then((result) => {
      console.log('createLiquidityEvent Result', result);
    });
  };

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
      {/* <Button
        type="primary"
        text="Testing"
        onClick={() => {
          createLiquidityEventHandler(
            turingAddress as string,
            'ROCOCO',
            { symbol: 'ROC', amount: 0.24 },
            { symbol: 'MGR', amount: 521.27009 },
            { symbol: 'ROC-MGR', amount: 0.24 },
            moment().valueOf().toString(),
            0.35,
            'ADD_LIQUIDITY'
          );
        }}
        className="px-10 ml-36 mb-5"
      /> */}
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
