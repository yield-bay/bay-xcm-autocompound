import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
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

const RemoveLiquidityTab = ({ farm, pool }: TabProps) => {
  const [account] = useAtom(accountAtom);
  const [mangataHelper] = useAtom(mangataHelperAtom);
  const [, setIsModalOpen] = useAtom(removeLiqModalOpenAtom);
  const [, setOpen] = useAtom(mainModalOpenAtom);
  const [, setConfig] = useAtom(removeLiquidityConfigAtom);

  const [lpBalanceNum, setLpBalanceNum] = useState<number | null>(null);
  const [percentage, setPercentage] = useState<string>('');

  const [token0, token1] = formatTokenSymbols(
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
        <div className="flex relative flex-col gap-y-5">
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
            %
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
                console.log('Remove Liq setting');
                setConfig({
                  method: 0,
                  percentage: percentage,
                  firstTokenNumber: 0,
                  secondTokenNumber: 0,
                });
                setOpen(false);
                setIsModalOpen(true);
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
    </div>
  );
};

export default RemoveLiquidityTab;
