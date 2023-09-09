import BN from 'bn.js';
const PARA_ID = 2110;
const NATIVE_TOKEN = 'MGR';

const WEIGHT_REF_TIME = new BN(150000000);
const WEIGHT_PROOF_SIZE = new BN(0);

const assets = [
  {
    id: '4',
    chainId: 0,
    decimals: 12,
    name: 'Kusama  Native',
    symbol: 'KSM',
    address: '',
  },
  {
    id: '5',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'KSM-MGX',
    address: '',
  },
  {
    id: '7',
    chainId: 0,
    decimals: 10,
    name: 'Turing native token',
    symbol: 'TUR',
    address: '',
  },
  {
    id: '8',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'MGX-TUR',
    address: '',
  },
  {
    id: '9',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'KSM-TUR',
    address: '',
  },
  {
    id: '10',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'TKN0x00000004-TKN0x00000000-MGX',
    address: '',
  },
  {
    id: '11',
    chainId: 0,
    decimals: 12,
    name: 'Imbue',
    symbol: 'IMBU',
    address: '',
  },
  {
    id: '12',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'MGX-IMBU',
    address: '',
  },
  {
    id: '13',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'IMBU-KSM',
    address: '',
  },
  {
    id: '14',
    chainId: 0,
    decimals: 12,
    name: 'Bifrost  Native  Token',
    symbol: 'BNC',
    address: '',
  },
  {
    id: '15',
    chainId: 0,
    decimals: 12,
    name: 'Voucher  K S M',
    symbol: 'vKSM',
    address: '',
  },
  {
    id: '16',
    chainId: 0,
    decimals: 12,
    name: 'Voucher  Slot  K S M',
    symbol: 'vsKSM',
    address: '',
  },
  {
    id: '17',
    chainId: 0,
    decimals: 18,
    name: 'Liquidity Pool Token',
    symbol: 'MGX-BNC',
    address: '',
  },
];

const pools = [
  {
    firstTokenId: '4',
    secondTokenId: '0',
    firstTokenAmount: '<BN: 20cf0da541e5ba>',
    secondTokenAmount: '<BN: fd788bc0039e3ec340e7bc>',
    liquidityTokenId: '5',
    firstTokenRatio: '<BN: 6b3731079e08a0dba6ff8d55>',
    secondTokenRatio: '<BN: 1cbdb4f>',
    isPromoted: true,
  },
  {
    firstTokenId: '0',
    secondTokenId: '7',
    firstTokenAmount: '<BN: 1cb3d08267acb2c7329c41>',
    secondTokenAmount: '<BN: ae524314e5e8bf>',
    liquidityTokenId: '8',
    firstTokenRatio: '<BN: 544912c1>',
    secondTokenRatio: '<BN: 248f659891e3ea31a08c411>',
    isPromoted: true,
  },
  {
    firstTokenId: '4',
    secondTokenId: '7',
    firstTokenAmount: '<BN: 47e3b2ca5fd>',
    secondTokenAmount: '<BN: d7f64f7d40d2>',
    liquidityTokenId: '9',
    firstTokenRatio: '<BN: 29b0a92e0fb8748f8>',
    secondTokenRatio: '<BN: 49ea07445896bf>',
    isPromoted: false,
  },
  {
    firstTokenId: '5',
    secondTokenId: '0',
    firstTokenAmount: '<BN: 3d2ed40789c04>',
    secondTokenAmount: '<BN: 12ef2c118d713f27ffc>',
    liquidityTokenId: '10',
    firstTokenRatio: '<BN: 44b75220c8e8657cc81c6>',
    secondTokenRatio: '<BN: 2cd8006b51>',
    isPromoted: false,
  },
  {
    firstTokenId: '0',
    secondTokenId: '11',
    firstTokenAmount: '<BN: 1cf129e3115ccb4fda2f34>',
    secondTokenAmount: '<BN: d386fc0e22cd3c5>',
    liquidityTokenId: '12',
    firstTokenRatio: '<BN: 656d8a8fc>',
    secondTokenRatio: '<BN: 1e618dbff4e646d723d143>',
    isPromoted: true,
  },
  {
    firstTokenId: '11',
    secondTokenId: '4',
    firstTokenAmount: '<BN: 6ed280d6c12df>',
    secondTokenAmount: '<BN: 1fb38508224>',
    liquidityTokenId: '13',
    firstTokenRatio: '<BN: 3f8455b87e2b5>',
    secondTokenRatio: '<BN: 3083b1ccac68b12027>',
    isPromoted: false,
  },
  {
    firstTokenId: '0',
    secondTokenId: '14',
    firstTokenAmount: '<BN: 98a8269abaf5d669882ae>',
    secondTokenAmount: '<BN: 11d2fcedbdeca4b>',
    liquidityTokenId: '17',
    firstTokenRatio: '<BN: 19ed05bf7>',
    secondTokenRatio: '<BN: 76db8f1584324d936aa70b>',
    isPromoted: false,
  },
];

const Config = {
  name: 'Mangata',
  key: 'mangata',
  endpoint: 'wss://kusama-rpc.mangata.online',
  relayChain: 'Kusama',
  paraId: PARA_ID,
  ss58: 42,
  assets,
  pools,
  instructionWeight: { refTime: WEIGHT_REF_TIME, proofSize: WEIGHT_PROOF_SIZE },
  symbol: NATIVE_TOKEN,
};

export default Config;
