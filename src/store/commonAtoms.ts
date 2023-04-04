import { AutocompoundEventType, FarmType, XcmpTaskType } from '@utils/types';
import { atom } from 'jotai';

export const walletModalOpenAtom = atom<boolean>(false);

export const mainModalOpenAtom = atom<boolean>(false);
export const stopCompModalOpenAtom = atom<boolean>(false);

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

export const account1Atom = atom<any>(null);
export const mangataAddressAtom = atom<string | null>(null);
export const turingAddressAtom = atom<string | null>(null);

export const viewPositionsAtom = atom<boolean>(false);
export const mgxBalanceAtom = atom<number>(0);
