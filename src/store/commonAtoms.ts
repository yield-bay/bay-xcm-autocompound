import { AutocompoundEventType, FarmType, XcmpTaskType } from '@utils/types';
import { atom } from 'jotai';
import Account from '@utils/xcm/common/account';
import { atomWithStorage } from 'jotai/utils';

export const walletModalOpenAtom = atom<boolean>(false);

export const trxnProcessAtom = atomWithStorage<boolean>(
  'jotai:trxn_process',
  false
);
export const modalOpenAtom = atomWithStorage<boolean>(
  'jotai:modal_open',
  false
);
export const mainModalOpenAtom = atom(
  (get) => {
    return get(trxnProcessAtom) || get(modalOpenAtom);
  },
  (get, set, update: boolean) => {
    const isInProcess = get(trxnProcessAtom);
    if (!isInProcess) {
      set(modalOpenAtom, update);
    }
  }
);

export const taskTrxnProcessAtom = atomWithStorage<boolean>(
  'jotai:trxn_process',
  false
);
export const tModalOpenAtom = atomWithStorage<boolean>(
  'jotai:modal_open',
  false
);
export const taskModalOpenAtom = atom(
  (get) => {
    return get(taskTrxnProcessAtom) || get(tModalOpenAtom);
  },
  (get, set, update: boolean) => {
    const isInProcess = get(taskTrxnProcessAtom);
    if (!isInProcess) {
      set(tModalOpenAtom, update);
    }
  }
);

export const lpBalancesAtom = atom(Object());
// export const allLpBalancesAtom = atom(Object());
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

// export const stopCompModalOpenAtom = atom<boolean>(false);

export const selectedTabModalAtom = atom<number>(0);

export const selectedFarmAtom = atom<FarmType | null>(null);
export const selectedTaskAtom = atom<XcmpTaskType | undefined>(undefined);
export const selectedEventAtom = atom<AutocompoundEventType | undefined>(
  undefined
);
export const poolsAtom = atom<any | null>(null);

export const mangataHelperAtom = atom<any>(null);
export const turingHelperAtom = atom<any>(null);

export const isInitialisedAtom = atom<boolean>(false);

export const account1Atom = atom<Account | null>(null);
export const mangataAddressAtom = atom<string | null>(null);
export const turingAddressAtom = atom<string | null>(null);

export const viewPositionsAtom = atom<boolean>(false);
export const mgxBalanceAtom = atom<number>(0);

export const userHasProxyAtom = atom<boolean>(false);
