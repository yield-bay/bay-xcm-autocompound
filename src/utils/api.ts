import { createClient, defaultExchanges, gql } from '@urql/core';
import { API_URL } from './constants';
import { FarmType, XcmpTaskType } from './types';

const client = createClient({
  url: API_URL,
  exchanges: defaultExchanges,
});

export const fetchFarms = async () => {
  const chainName = 'Mangata Kusama';
  const protocolName = 'Mangata X';

  const farmObj = await client
    .query(
      gql`
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
      `,
      {
        chain: chainName,
        protocol: protocolName,
      }
    )
    .toPromise();

  const farms: FarmType[] = farmObj?.data?.farms;
  return {
    farms,
  };
};

export const fetchXcmpTasks = async (userAddress: string) => {
  const xcmpTaskObj = await client
    .query(
      gql`
        query getXcmpTasks($userAddress: String!) {
          xcmpTasks(userAddress: $userAddress, chain: ROCOCO) {
            taskId
            userAddress
            lpName
            chain
            status
          }
        }
      `,
      {
        userAddress,
      }
    )
    .toPromise();

  const xcmpTasks: XcmpTaskType[] = xcmpTaskObj?.data?.xcmpTasks;
  return {
    xcmpTasks,
  };
};
