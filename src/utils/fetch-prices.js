import { BN, Mangata } from '@mangata-finance/sdk';
import {
  fetchKSMPrice,
  calculatePriceInTarget,
  decimalsToAmount,
} from './mangata-helpers';
import { MAINNET } from './constants';
import Tokens from './tokens.json';

export async function fetchTokenPrices() {
  const mangata = Mangata.getInstance(MAINNET);

  const tokenPrices = new Map();
  tokenPrices.set('ksm', await fetchKSMPrice());

  for (let token of Tokens) {
    const sources = token.priceSource;
    let price = 1;
    for (let i = 0; i < sources.length; i++) {
      // Source for liquidity pool is structured: liquidity-<poolID>-<targetTokenID>
      if (sources[i].includes('liquidity')) {
        const sourceSplit = sources[i].split('-');
        const targetTokenID = sourceSplit[2];
        const targetDecimals = Tokens.find(
          (t) => t.id === targetTokenID
        )?.decimals;
        if (targetDecimals == undefined) process.exit(1);

        const poolID = sourceSplit[1];
        const priceInTarget = await calculatePriceInTarget(
          token.id,
          token.decimals,
          targetTokenID,
          targetDecimals,
          poolID,
          mangata
        );

        const targetOne = decimalsToAmount(1, targetDecimals);

        let priceInTargetNormalised;

        if (priceInTarget.gte(new BN(Number.MAX_SAFE_INTEGER.toString()))) {
          priceInTargetNormalised = priceInTarget
            .div(new BN(targetOne.toString()))
            .toNumber();
        } else {
          priceInTargetNormalised = priceInTarget.toNumber() / targetOne;
        }

        price *= priceInTargetNormalised;
      } else if (sources[i].includes('usd')) {
        const token = sources[i].split('-')[1];
        price *= tokenPrices?.get(token) || 0;
      }
    }
    tokenPrices.set(token.symbol.toLowerCase(), price);
  }

  const tokens = Array.from(tokenPrices.keys()).map((symbol) => {
    const T = Tokens.find((t) => t.symbol.toLowerCase() === symbol);
    return {
      symbol: T.symbol,
      name: T.name,
      price: tokenPrices.get(symbol),
    };
  });

  return tokens;
}
