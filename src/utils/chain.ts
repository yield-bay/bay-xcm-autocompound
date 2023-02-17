export type polkadotChainId = 'mangata' | 'karura' | 'turing';

interface BaseChain {
  name: string;
  icon: string;
  kind: 'polkadot';
  isTest?: boolean;
  nativeAsset?: AssetId;
  explorerURL?: string;
}

export interface PolkadotChain extends BaseChain {}
