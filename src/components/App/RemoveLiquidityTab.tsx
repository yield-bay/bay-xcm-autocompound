import { FC, useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import clsx from 'clsx';
import Button from '@components/Library/Button';
import {
  mainModalOpenAtom,
  removeLiqModalOpenAtom,
  mangataHelperAtom,
  removeLiquidityConfigAtom,
} from '@store/commonAtoms';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';
import { TabProps } from '@utils/types';
import { accountAtom } from '@store/accountAtoms';
import { IS_PRODUCTION } from '@utils/constants';

const RemoveLiquidityTab = ({ farm, pool }: TabProps) => {
  const [account] = useAtom(accountAtom);
  const [mangataHelper] = useAtom(mangataHelperAtom);
  const [, setIsModalOpen] = useAtom(removeLiqModalOpenAtom);
  const [, setOpen] = useAtom(mainModalOpenAtom);
  const [, setConfig] = useAtom(removeLiquidityConfigAtom);

  const [lpBalanceNum, setLpBalanceNum] = useState<number | null>(null);
  const [percentage, setPercentage] = useState<string>('');
  const [lpTokens, setLpTokens] = useState<string>('');
  const [methodId, setMethodId] = useState<number>(0);

  const [token0, token1] = formatTokenSymbols(
    IS_PRODUCTION
      ? farm?.asset.symbol!
      : replaceTokenSymbols(farm?.asset.symbol!)
  );

  const handlePercChange = (event: any) => {
    event.preventDefault();
    // let percFloat = parseFloat(event.target.value);
    // if ((percFloat > 0 && percFloat <= 100) || event.target.value === '') {
    setPercentage(event.target.value);
    // } else {
    //   alert('Percentage should be between 0 and 100!');
    // }
  };

  const handleLpTokensChange = (event: any) => {
    event.preventDefault();
    // const lpTokensFloat = parseFloat(event.target.value);
    // if (lpTokensFloat > 0 || event.target.value === '') {
    setLpTokens(event.target.value);
    // } else {
    //   toast({
    //     position: 'top',
    //     duration: 3000,
    //     render: () => (
    //       <ToastWrapper title="LP tokens can not be negative!" status="error" />
    //     ),
    //   });
    // }
  };

  // Fetch LP balance from mangataHelper
  useEffect(() => {
    (async () => {
      const lpBalance = await mangataHelper.mangata.getTokenBalance(
        pool.liquidityTokenId,
        account?.address
      );
      const decimal = mangataHelper.getDecimalsBySymbol(`${token0}-${token1}`);
      const lpBalanceNum =
        parseFloat(BigInt(lpBalance.reserved).toString(10)) / 10 ** decimal +
        parseFloat(BigInt(lpBalance.free).toString(10)) / 10 ** decimal;
      console.log('LP Balance lpBalanceNum: ', lpBalanceNum);
      setLpBalanceNum(lpBalanceNum);
    })();
  }, []);

  // ChosenMethod returns the type of input field
  const ChosenMethod: FC<{ methodId: number }> = ({ methodId }) => {
    return methodId === 0 ? (
      <div className="relative flex flex-col gap-y-5">
        <input
          className="text-2xl bg-transparent text-left pb-12 focus:outline-none w-full border-0 ring-1 ring-[#727272] focus:ring-primaryGreen rounded-lg p-4 number-input"
          autoFocus={true}
          min={0}
          max={100}
          value={percentage}
          placeholder={'0'}
          onChange={handlePercChange}
          type="number"
        />
        <div className="absolute bottom-4 left-4">
          <span className="text-base text-[#898989] leading-[21.6px]">
            {parseFloat(percentage) > 0
              ? (
                  (parseFloat(percentage) * (lpBalanceNum as number)) /
                  100
                ).toFixed(2)
              : '0'}{' '}
            Tokens
          </span>
        </div>
        <div className="absolute right-4 top-[21px] bottom-0 text-base leading-[21.6px] text-[#727272]">
          %
        </div>
      </div>
    ) : (
      <div className="relative flex flex-col gap-y-5">
        <input
          className="text-2xl bg-transparent text-left pb-12 focus:outline-none w-full border-0 ring-1 ring-[#727272] focus:ring-primaryGreen rounded-lg p-4 number-input"
          autoFocus={true}
          value={lpTokens}
          placeholder={'0'}
          onChange={handleLpTokensChange}
          type="number"
        />
        <div className="absolute bottom-4 left-4">
          <span className="text-base text-[#898989] leading-[21.6px]">
            {parseFloat(lpTokens) > 0
              ? (
                  (parseFloat(lpTokens) * 100) /
                  (lpBalanceNum as number)
                ).toFixed(2)
              : 0}
            %
          </span>
        </div>
        <div className="absolute right-4 top-[21px] bottom-0 text-base leading-[21.6px] text-[#727272]">
          Tokens
        </div>
      </div>
    );
  };

  const lpTokensDisabled =
    parseFloat(lpTokens) > (lpBalanceNum as number) ||
    parseFloat(lpTokens) <= 0;
  const percentageDisabled =
    parseFloat(percentage) <= 0 || parseFloat(percentage) > 100;

  return (
    <div className="w-full">
      <div className="w-full flex flex-col gap-y-10 mt-10">
        <div className="w-full text-[#C5C5C5] py-3 text-base leading-[21.6px] text-center rounded-lg border border-black bg-[#0C0C0C]">
          {lpBalanceNum == null ? (
            <p>fetching your LP balance...</p>
          ) : (
            <p>
              You Hold: {lpBalanceNum.toFixed(2)} {token0}-{token1} LP token
            </p>
          )}
        </div>
        <div className="flex flex-col gap-y-5">
          <ChosenMethod methodId={methodId} />
          <div className="inline-flex gap-6 items-center justify-start">
            {['Percentage', 'LP Tokens'].map((method, index) => (
              <button
                key={index}
                className={clsx(
                  'text-white text-base leading-[21.6px]',
                  methodId !== index && 'opacity-50'
                )}
                onClick={() => setMethodId(index)}
              >
                {method}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-y-2">
          <Button
            type="primary"
            text="Confirm"
            disabled={lpTokensDisabled || percentageDisabled}
            onClick={() => {
              console.log('Remove Liquidity setting:');
              setConfig({
                method: methodId,
                percentage: percentage,
                firstTokenNumber: 0,
                secondTokenNumber: 0,
                lpAmount: lpTokens,
              });
              setOpen(false);
              setIsModalOpen(true);
            }}
          />
          <Button
            type="transparent"
            text="Go Back"
            onClick={() => {
              setOpen(false);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default RemoveLiquidityTab;
