import { createClient, defaultExchanges, gql } from '@urql/core';
import { API_URL } from './constants';
import { FarmType, XcmpTaskType } from './types';

const client = createClient({
  url: API_URL,
  exchanges: defaultExchanges,
});

export const fetchFarms = async () => {
  const farmObj = await client
    .query(
      gql`
        query Farms {
          farms(chain: "Mangata Kusama", protocol: "Mangata X") {
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
      {} // variables
    )
    .toPromise();

  const farms: FarmType[] = farmObj?.data?.farms;
  return {
    farms,
  };
};

export const fetchXcmpTasks = async (userAddress: string) => {
  console.log('Passed address', userAddress);
  const xcmpTaskObj = await client
    .query(
      gql`
        query XcmpTasks {
          xcmpTasks(userAddress: "${userAddress}") {
            taskId
            userAddress
            lpName
            chain
            status
          }
        }
      `,
      {} // variables
    )
    .toPromise();

  const xcmpTasks: XcmpTaskType[] = xcmpTaskObj?.data?.farms;
  return {
    xcmpTasks,
  };
};
