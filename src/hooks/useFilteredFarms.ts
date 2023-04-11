import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';
import { FarmType } from '@utils/types';

/**
 *
 * @param farms - Farms list
 * @param search - Search term
 * @returns Filtered farms list according to search term
 */
export default function useFilteredFarms(
  farms: FarmType[],
  search: string
): [FarmType[], boolean] {
  if (!farms) return [[], true];
  if (search === '') return [farms, false];
  const searchTerm = search.trim().toUpperCase();
  const filtered = farms.filter((farm: any) => {
    let matchTerm = '';
    const tokenNames = formatTokenSymbols(
      replaceTokenSymbols(farm?.asset.symbol)
    );

    tokenNames.forEach((tokenName) => {
      matchTerm += tokenName + '_';
    });

    matchTerm = matchTerm
      .concat(farm?.protocol, '_', farm?.chain)
      .toUpperCase();

    if (matchTerm.indexOf(searchTerm) >= 0) return true;
    return false;
  });
  const noResult = filtered.length === 0;
  return [filtered, noResult];
}
