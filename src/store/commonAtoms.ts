import { atom } from "jotai";

export const walletModalOpenAtom = atom<boolean>(false);

export const compoundModalOpenAtom = atom<boolean>(false);
export const selectedTabModalAtom = atom<number>(0);