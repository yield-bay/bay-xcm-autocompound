import { FarmType } from './types';

// Format farm name to get token symbols
export function formatTokenSymbols(farmName: string): string[] {
  let tokenSymbols = farmName;
  if (farmName.includes('LP')) {
    tokenSymbols = tokenSymbols.replace('LP', '').trimEnd();
  }
  // not else-if but two separate conditions
  if (tokenSymbols.includes('-')) {
    let tokenNames = tokenSymbols.split('-');
    return tokenNames;
  }
  return [farmName];
}

export function formatFarmType(farmType: string): string {
  if (farmType === 'SingleStaking') return 'Single staking';
  else return farmType.slice(0, -3) + ' swap';
}

// Filter farms with MGX token and return them
export const filterMGXFarms = (farms: FarmType[]): FarmType[] => {
  const filteredFarms = farms.filter((farm) => {
    const tokens = formatTokenSymbols(farm.asset.symbol);
    return tokens.includes('MGX');
  });
  return filteredFarms;
};

// Replace KSM with ROC and MGX with MGR
export const replaceTokenSymbols = (farmName: string) => {
  let temp = farmName.replace('KSM', 'ROC');
  temp = temp.replace('MGX', 'MGR');
  return temp;
};

/**
 *
 * @param num - Number to convert into Dollar Notation
 * @returns - Converted amounts in Dollars
 */
export default function toDollarUnits(num: number): string {
  if (num >= 1000000) {
    return '$' + (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000 && num < 1000000) {
    return '$' + (num / 1000).toFixed(2) + 'K';
  }
  return '$' + num.toFixed(0);
}
