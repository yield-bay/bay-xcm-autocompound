import { FarmType } from './types';

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

// Filter farms with MGX token and return them
export const filterMGXFarms = (farms: FarmType[]): FarmType[] => {
  const filteredFarms = farms.filter((farm) => {
    const tokens = formatTokenSymbols(farm.asset.symbol);
    return tokens.includes('MGX');
  });
  return filteredFarms;
};

// Replace KSM with ROC in farm name
export const replaceKSMWithMGX = (farmName: string): string => {
  return farmName.replace('KSM', 'ROC');
}

// Replace MGX with MGR in farm name
export const replaceMGXWithMGR = (farmName: string): string => {
  return farmName.replace('MGX', 'MGR');
}
