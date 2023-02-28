// STATE
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

// API URLS
export const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

// APPLICATION
export const SITE_NAME = ""; // TODO
export const APP_NAME = "Yieldbay Mangata";
export const DESCRIPTION = "";
export const DOMAIN = "";
export const IMAGE = "";
export const USERNAME = "yield_bay";


// MANGATA
export const MG_MAINNET_1="wss://mangata-x.api.onfinality.io/public-ws";
export const MG_MAINNET_2="wss://prod-kusama-collator-01.mangatafinance.cloud";
export const TESTNET="wss://roccoco-testnet-collator-01.mangatafinance.cloud";