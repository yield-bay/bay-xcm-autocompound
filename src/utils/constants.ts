// STATE
export const IS_PRODUCTION = process.env.NEXT_PUBLIC_NODE_ENV === 'production';

// API URLS
export const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

// APPLICATION
export const SITE_NAME = ''; // TODO
export const APP_NAME = 'Yieldbay Auto-compounder';
export const DESCRIPTION =
  'Explore and auto-compound liquidity pools on MangataX';
export const DOMAIN = `https://${SITE_NAME}`;
export const IMAGE = `${DOMAIN}/twitter-cover.png`;
export const USERNAME = 'yield_bay';
export const YIELDBAY_LANDING = 'https://www.yieldbay.io';
export const YIELDBAY_LIST_LANDING = 'https://list.yieldbay.io/';

// COMMUNITY
export const YIELDBAY_TWITTER = 'https://twitter.com/yield_bay';
export const YIELDBAY_DISCORD = 'https://discord.gg/AKHuvbz7q4';
export const YIELDBAY_DOCS = 'https://docs.yieldbay.io/';
export const YIELDBAY_GITHUB = 'https://github.com/yield-bay/';

// RPCs
export const MAINNET = [
  'wss://mangata-x.api.onfinality.io/public-ws',
  'wss://prod-kusama-collator-01.mangatafinance.cloud',
];
export const TESTNET = 'wss://collator-01-ws-rococo.mangata.online';
