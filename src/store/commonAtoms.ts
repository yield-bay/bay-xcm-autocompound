import { AutocompoundEventType, FarmType, XcmpTaskType } from '@utils/types';
import { atom } from 'jotai';
import Account from '@utils/xcm/common/account';

export const walletModalOpenAtom = atom<boolean>(false);

export const mainModalOpenAtom = atom<boolean>(false);

// Stop autocompounding Modal
export const stopCompModalOpenAtom = atom<boolean>(false);

// Add Liquidity Modal
export const addLiqModalOpenAtom = atom<boolean>(false);
export const addLiquidityConfigAtom = atom({
  firstTokenAmount: 0,
  secondTokenAmount: 0,
  lpAmount: 0,
  fees: 0,
});

// Remove Liquidity Modal
export const removeLiqModalOpenAtom = atom<boolean>(false);
export const removeLiquidityConfigAtom = atom({
  method: 0, // 0 = Percentage, 1 = Token Numbers
  percentage: '0',
  firstTokenNumber: 0,
  secondTokenNumber: 0,
  lpAmount: '0',
});

export const poolsAtom = atom<any | null>(null);

// Compound Modal
export const compoundModalOpenAtom = atom<boolean>(false);

export const compoundConfigAtom = atom({
  frequency: 0,
  duration: 0,
  percentage: 0,
  gasChoice: 1,
});

// Atom which hold a Hash map of balances of All LPs
export const lpBalancesAtom = atom(Object());
export const allLpBalancesAtom = atom(
  (get) => {
    return get(lpBalancesAtom);
  },
  (get, set, key: string, value: number) => {
    let prevObject = get(lpBalancesAtom);
    prevObject[key] = value;
    set(lpBalancesAtom, prevObject);
  }
);

export const selectedTabModalAtom = atom<number>(0);

export const selectedFarmAtom = atom<FarmType | null>(null);

export const selectedTaskAtom = atom<XcmpTaskType | undefined>(undefined);
export const selectedEventAtom = atom<AutocompoundEventType | undefined>(
  undefined
);

export const mangataHelperAtom = atom<any>(null);
export const turingHelperAtom = atom<any>(null);

export const isInitialisedAtom = atom<boolean>(false);

export const account1Atom = atom<Account | null>(null);
export const mangataAddressAtom = atom<string | null>(null);
export const turingAddressAtom = atom<string | null>(null);

export const viewPositionsAtom = atom<boolean>(false);
export const mgxBalanceAtom = atom<number>(0);

export const userHasProxyAtom = atom<boolean>(false);

export const lpUpdatedAtom = atom<number>(0);
