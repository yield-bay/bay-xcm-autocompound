import { FC } from 'react';
import Image from 'next/image';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import FarmAssets from '@components/Library/FarmAssets';
import toDollarUnits, {
  formatFarmType,
  formatTokenSymbols,
  replaceTokenSymbols,
} from '@utils/farmMethods';
import { FarmType } from '@utils/types';

interface Props {
  farms: FarmType[];
  noFarms: boolean;
}

const FarmsList: FC<Props> = ({ farms, noFarms }) => {
  return (
    <div className="flex flex-col items-center gap-y-[25px] py-16">
      {!noFarms ? (
        farms.map((farm, index) => {
          const tokenNames = formatTokenSymbols(
            replaceTokenSymbols(farm?.asset.symbol)
          );
          return (
            <div className="flex flex-row group w-full bg-baseGrayDark hover:ring-[1px] transition duration-20 ring-primaryGreen rounded-lg">
              {/* LEFT */}
              <div className="flex flex-row items-center justify-between px-6 py-14 w-full max-w-[400px] rounded-l-lg bg-card-gradient">
                {/* Assets and Farm Type */}
                <div className="flex flex-col gap-y-[10px]">
                  <div className="flex flex-row gap-x-3">
                    <FarmAssets logos={farm?.asset.logos} />
                    <div className="py-[9px] select-none px-4 bg-white text-[10px] leading-[13.5px] text-black rounded-full">
                      {formatFarmType(farm?.farmType)}
                    </div>
                  </div>
                  <p className="text-2xl text-offWhite">
                    {tokenNames.map((tokenName, index) => (
                      <span key={index} className="mr-[3px]">
                        {tokenName}
                        {index !== tokenNames.length - 1 && ' •'}
                      </span>
                    ))}
                  </p>
                </div>
                <button className="rounded-full scale-0 group-hover:scale-100 bg-white p-[10px] h-fit hover:bg-offWhite text-black transition-all duration-200">
                  <Image
                    height={28}
                    width={28}
                    src="/icons/ArrowRight.svg"
                    alt="Right Arrow"
                  />
                </button>
              </div>
              {/* RIGHT SIDE */}
              <div className="flex flex-row pl-8 pr-7 py-6 justify-between w-full rounded-r-lg">
                {/* Right Left */}
                <div className="flex flex-col justify-between">
                  <div className="flex flex-col">
                    <p className="font-medium text-base leading-5 opacity-50">
                      TVL
                    </p>
                    <p className="text-2xl">{toDollarUnits(farm?.tvl)}</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="font-medium text-base leading-5 opacity-50">
                      APR
                    </p>
                    <div className="flex flex-row items-center gap-x-4">
                      <p className="text-2xl">
                        {(farm?.apr.reward + farm?.apr.base).toFixed(2)}%
                      </p>
                      <QuestionMarkCircleIcon className="w-5 h-5 opacity-50" />
                    </div>
                  </div>
                </div>
                {/* Right Right */}
                <div className="flex flex-col justify-between">
                  <button className="bg-baseGray py-4 px-5 text-white text-base leading-5 hover:ring-1 ring-baseGrayLow rounded-lg transition duration-200">
                    <p>Add/Remove</p>
                    <p>Liquidity</p>
                  </button>
                  <button className="px-4 py-3 rounded-lg bg-white hover:bg-offWhite text-black transition duration-200">
                    Autocompound
                  </button>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="flex items-center justify-center">
          <p>No Results. Try searching for something else.</p>
        </div>
      )}
    </div>
  );
};

export default FarmsList;
