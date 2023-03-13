import { FarmType } from '@utils/types';
import { atom } from 'jotai';

export const walletModalOpenAtom = atom<boolean>(false);

export const mainModalOpenAtom = atom<boolean>(false);
export const selectedTabModalAtom = atom<number>(0);

export const selectedFarmAtom = atom<FarmType | null>(null);
export const promotedPools = atom<any | null>(null);

export const mangataHelperAtom = atom<any>(null);
export const turingHelperAtom = atom<any>(null);

export const account1Atom = atom<any>(null);
