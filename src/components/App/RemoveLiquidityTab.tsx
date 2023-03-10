import { useAtom } from 'jotai';
import Image from 'next/image';
import { useState } from 'react';
import Button from '@components/Library/Button';
import { mainModalOpenAtom } from '@store/commonAtoms';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';
import { TabProps } from '@utils/types';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

const RemoveLiquidityTab = ({ farm, account }: TabProps) => {
  const [percentage, setPercentage] = useState<string>('');
  const [isVerify, setIsVerify] = useState<boolean>(false);
  const [, setOpen] = useAtom(mainModalOpenAtom);

  const tokenNames = formatTokenSymbols(
    replaceTokenSymbols(farm?.asset.symbol)
  );

  const handlePercChange = (event: any) => {
    event.preventDefault();
    let percFloat = parseFloat(event.target.value);
    if ((percFloat > 0 && percFloat <= 100) || event.target.value === '') {
      setPercentage(event.target.value);
    } else {
      alert('Percentage should be between 0 and 100!');
    }
  };

  return (
    <div className="w-full">
      {!isVerify ? (
        <div className="w-full flex flex-col gap-y-10 mt-10">
          <div className="relative">
            <input
              className="text-2xl bg-transparent text-left focus:outline-none w-full border-0 ring-1 ring-[#727272] focus:ring-primaryGreen rounded-lg p-4 number-input"
              autoFocus={true}
              min={0}
              max={100}
              value={percentage}
              placeholder={'0'}
              onChange={handlePercChange}
              type="number"
            />
            <div className="absolute right-4 top-[21px] bottom-0 text-base leading-[21.6px] text-[#727272]">
              Percentage
            </div>
          </div>
          <div className="flex flex-col gap-y-5 text-xl leading-[27px]">
            <div className="inline-flex w-full justify-between items-center">
              <p className="inline-flex items-center">
                <Image
                  src={farm?.asset.logos[0]}
                  alt={tokenNames[0]}
                  height={32}
                  width={32}
                />
                <span className="ml-5">{tokenNames[0]}</span>
              </p>
              <p className="text-base leading-[21.6px]">{'0.1'} MGX</p>
            </div>
            <div className="inline-flex w-full justify-between items-center">
              <p className="inline-flex items-center">
                <Image
                  src={farm?.asset.logos[1]}
                  alt={tokenNames[1]}
                  height={32}
                  width={32}
                />
                <span className="ml-5">{tokenNames[1]}</span>
              </p>
              <p className="text-base leading-[21.6px]">{'0.1'} TUR</p>
            </div>
            <div className="inline-flex items-center justify-between text-[14px] leading-[18.9px]">
              <p className="inline-flex items-end">
                Fee
                <QuestionMarkCircleIcon className="h-5 w-5 opacity-50 ml-2" />
              </p>
              <span>{'15.8083'} MGX</span>
            </div>
          </div>
          <div className="flex flex-col gap-y-2">
            <Button
              type="primary"
              text="Confirm"
              onClick={() => {
                if (percentage === '') {
                  alert('Please enter a valid percentage');
                  return;
                } else {
                  setIsVerify(true);
                }
              }}
            />
            <Button
              type="secondary"
              text="Go Back"
              onClick={() => {
                setOpen(false);
              }}
            />
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-y-14 mt-10">
          <p className="text-base leading-[21.6px] text-[#B9B9B9] text-center w-full px-24">
            {parseFloat(percentage) == 100
              ? 'Removing 100% of Liquidity also stops Autocompounding. Are you sure you want to go ahead?'
              : `Are you sure you want to remove ${percentage}% of Liquidity?`}
          </p>
          <div className="inline-flex gap-x-2 w-full">
            <Button
              type="warning"
              text={`Yes, Remove ${percentage}%`}
              className="w-3/5"
            />
            <Button
              type="secondary"
              text="Go Back"
              className="w-2/5"
              onClick={() => {
                setPercentage('');
                setIsVerify(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RemoveLiquidityTab;
