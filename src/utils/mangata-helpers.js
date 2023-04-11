import { BN } from '@mangata-finance/sdk';
import axios from 'axios';
import _ from 'lodash';

/* GENERAL HELPERS */
export async function fetchKSMPrice() {
  const resp = await axios.get(
    'https://api.coingecko.com/api/v3/simple/price?ids=kusama&vs_currencies=usd'
  );

  return resp.data.kusama.usd;
}

export function decimalsToAmount(amount, decimals) {
  return amount * 10 ** decimals;
}

/* MANGATA HELPERS */
export async function calculatePriceInTarget(
  tokenIdToPrice,
  tokenToPriceDecimals,
  targetTokenID,
  targetDecimals,
  poolID,
  mangata
) {
  const pool = (await mangata.getLiquidityPool(poolID)).map((tokenID) =>
    tokenID.toString(10)
  );

  const targetPoolPosition = pool[0] === targetTokenID ? 0 : 1;
  const tokenPoolPosition = pool[0] === targetTokenID ? 1 : 0;

  const amountOfTokenInPoolArgs = ['0', '0'];
  amountOfTokenInPoolArgs[targetPoolPosition] = targetTokenID;
  amountOfTokenInPoolArgs[tokenPoolPosition] = tokenIdToPrice;
  const amountsInPool = await mangata.getAmountOfTokenIdInPool(
    amountOfTokenInPoolArgs[0],
    amountOfTokenInPoolArgs[1]
  );

  const tokenToPriceReserve = amountsInPool[tokenPoolPosition];
  const targetTokenReserve = amountsInPool[targetPoolPosition];
  const buyPriceArgs = [
    targetTokenReserve,
    tokenToPriceReserve,
    new BN(decimalsToAmount(1, tokenToPriceDecimals).toString()),
  ]; // inputReserve, outputReserve, inputAmountOne

  const buyPrice = await mangata.calculateBuyPrice(
    buyPriceArgs[0],
    buyPriceArgs[1],
    buyPriceArgs[2]
  );
  return buyPrice;
}

export async function getAssets(mangata) {
  const allAssets = await mangata.getAssetsInfo();

  const tokens = [];
  const liquidity = [];

  Object.keys(allAssets).forEach((ID) => {
    if (allAssets[ID].name.includes('Liquidity')) {
      liquidity.push(allAssets[ID]);
    } else {
      tokens.push(allAssets[ID]);
    }
  });

  return {
    tokens,
    liquidity,
  };
}

export const getDecimalById = async (allAssets, id) => {
  const token = _.find(allAssets, (token) => token.id === id);
  return token.decimals;
};
