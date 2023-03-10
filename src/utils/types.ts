import { WalletAccount } from "@talismn/connect-wallets";

export interface FarmType {
  id: number;
  chef: string;
  chain: string;
  protocol: string;
  farmType: string;
  farmImpl: string;
  asset: {
    symbol: string;
    address: string;
    price: number;
    logos: string[];
  };
  tvl: number;
  rewards: {
    amount: number;
    asset: string;
    valueUSD: number;
    freq: string;
  }[];
  apr: {
    reward: number;
    base: number;
  };
  allocPoint: number;
  lastUpdatedAtUTC: string;
  safetyScore: number;
}

export interface TabProps {
  farm: FarmType;
  account: WalletAccount;
}
