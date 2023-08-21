import BN from 'bn.js';

const PARA_ID = 2110;
const NATIVE_TOKEN = 'MGR';
const WEIGHT_REF_TIME = new BN(150000000);
const WEIGHT_PROOF_SIZE = new BN(0);

const assets = [
  {
    id: '0',
    chainId: 0,
    decimals: 18,
    name: 'Mangata',
    symbol: NATIVE_TOKEN,
    address: '',
    location: { parents: 1, interior: { X1: { Parachain: PARA_ID } } },
  },
  {
    id: '4',
    chainId: 0,
    decimals: 12,
    name: 'Rococo  Native',
    symbol: 'ROC',
    address: '',
  },
  {
    id: '5',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'ROC-MGR',
    address: '',
  },
  {
    id: '7',
    chainId: 0,
    decimals: 10,
    name: 'Turing native token',
    symbol: 'TUR',
    address: '',
    feePerSecond: new BN('871400000000'),
  },
  {
    id: '8',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'MGR-TUR',
    address: '',
  },
  {
    id: '9',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'MGR-TUR',
    address: '',
  },
  {
    id: '10',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'MGR-TUR',
    address: '',
  },
  {
    id: '11',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'ROC-TUR',
    address: '',
  },
  {
    id: '12',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'KAR-TUR',
    address: '',
  },
  {
    id: '13',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'KAR-MGR',
    address: '',
  },
  {
    id: '14',
    chainId: 0,
    decimals: 12,
    name: 'Imbue',
    symbol: 'IMBU',
    address: '',
  },
  {
    id: '15',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'MGR-IMBU',
    address: '',
  },
  {
    id: '16',
    chainId: 0,
    decimals: 12,
    name: 'Bifrost',
    symbol: 'BNC',
    address: '',
  },
  {
    id: '17',
    chainId: 0,
    decimals: 12,
    name: 'v K S M',
    symbol: 'vKSM',
    address: '',
  },
  {
    id: '18',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'MGR-IMBU',
    address: '',
  },
  {
    id: '19',
    chainId: 0,
    decimals: 12,
    name: 'I M B R',
    symbol: 'IMBR',
    address: '',
  },
  {
    id: '20',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'MGR-IMBU',
    address: '',
  },
  {
    id: '21',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'MGR-IMBU',
    address: '',
  },
  {
    id: '22',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'TUR-IMBU',
    address: '',
  },
  {
    id: '23',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'MGR-BNC',
    address: '',
  },
  {
    id: '24',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'BNC-IMBU',
    address: '',
  },
  {
    id: '25',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'IMBR-MGR',
    address: '',
  },
  {
    id: '27',
    chainId: 0,
    decimals: 12,
    name: 'T S T',
    symbol: 'TST',
    address: '',
  },
  {
    id: '28',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'TST-IMBR',
    address: '',
  },
  {
    id: '29',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'ROC-IMBU',
    address: '',
  },
  {
    id: '30',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'ROC-IMBU',
    address: '',
  },
  {
    id: '31',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'ROC-IMBU',
    address: '',
  },
  {
    id: '32',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'ROC-IMBU',
    address: '',
  },
  {
    id: '33',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'ROC-IMBU',
    address: '',
  },
  {
    id: '34',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'MGR-IMBR',
    address: '',
  },
];

const pools = [];

const Config = {
  name: 'Mangata Rococo',
  key: 'mangata-rococo',
  endpoint: 'wss://collator-01-ws-rococo.mangata.online',
  relayChain: 'rococo',
  paraId: PARA_ID,
  ss58: 42,
  assets,
  pools,
  instructionWeight: { refTime: WEIGHT_REF_TIME, proofSize: WEIGHT_PROOF_SIZE },
  symbol: NATIVE_TOKEN,
};

export default Config;
