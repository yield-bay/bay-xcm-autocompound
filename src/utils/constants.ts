// STATE
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// API URLS
export const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

// APPLICATION
export const SITE_NAME = ''; // TODO
export const APP_NAME = 'yieldbay';
export const DESCRIPTION = '';
export const DOMAIN = '';
export const IMAGE = '';
export const USERNAME = 'yield_bay';
export const YIELDBAY_LANDING = 'https://yieldbay.io';

// MANGATA
export const MAINNET = [
  'wss://mangata-x.api.onfinality.io/public-ws',
  'wss://prod-kusama-collator-01.mangatafinance.cloud',
];
export const TESTNET = 'wss://roccoco-testnet-collator-01.mangatafinance.cloud';
