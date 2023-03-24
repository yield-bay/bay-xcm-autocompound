import { createClient, defaultExchanges, gql } from '@urql/core';
import { API_URL } from './constants';
import { FarmType, XcmpTaskType } from './types';

const client = createClient({
  url: API_URL,
  exchanges: defaultExchanges,
});

// FARM METHODS

export const FarmsQuery = gql`
  query getFarms($chain: String!, $protocol: String!) {
    farms(chain: $chain, protocol: $protocol) {
      id
      chef
      chain
      protocol
      farmType
      farmImpl
      asset {
        symbol
        address
        price
        logos
      }
      tvl
      rewards {
        amount
        asset
        valueUSD
        freq
      }
      apr {
        reward
        base
      }
      allocPoint
      lastUpdatedAtUTC
      safetyScore
    }
  }
`;

export const fetchFarms = async () => {
  const farmObj = await client
    .query(FarmsQuery, {
      chain: 'Mangata Kusama',
      protocol: 'Mangata X',
    })
    .toPromise();

  const farms: FarmType[] = farmObj?.data?.farms;
  return {
    farms,
  };
};

// XCMP TASKS METHODS

export const XcmpTasksQuery = gql`
  query getXcmpTasks($userAddress: String!, $chain: XCMPTaskChain!) {
    xcmpTasks(userAddress: $userAddress, chain: $chain) {
      taskId
      userAddress
      lpName
      chain
      status
    }
  }
`;

export const fetchXcmpTasks = async (userAddress: string) => {
  const xcmpTaskObj = await client
    .query(XcmpTasksQuery, {
      userAddress,
      chain: 'ROCOCO',
    })
    .toPromise();

  const xcmpTasks: XcmpTaskType[] = xcmpTaskObj?.data?.xcmpTasks;
  return {
    xcmpTasks,
  };
};

export const addXcmpTask = async (args: any) => {
  const xcmpTaskObj = await client.mutation(XcmpTasksQuery, {
    userAddress: args.userAddress,
  });
};
