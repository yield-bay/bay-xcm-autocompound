import { createClient, defaultExchanges, gql } from '@urql/core';
import { API_URL } from './constants';
import { FarmType } from './types';

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
      {}
    )
    .toPromise();

  const farms: FarmType[] = farmObj?.data?.farms;
  return {
    farms,
  };
};
