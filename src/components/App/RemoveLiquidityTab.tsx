import { useAtom } from 'jotai';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Button from '@components/Library/Button';
import { mainModalOpenAtom } from '@store/commonAtoms';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';
import { TabProps } from '@utils/types';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { useToast } from '@chakra-ui/react';
import Tooltip from '@components/Library/Tooltip';
import { accountAtom } from '@store/accountAtoms';
import ToastWrapper from '@components/Library/ToastWrapper';
import {
  mangataHelperAtom,
  turingHelperAtom,
  account1Atom,
} from '@store/commonAtoms';

const RemoveLiquidityTab = ({ farm, pool }: TabProps) => {
  const [account] = useAtom(accountAtom);
  const [mangataHelper] = useAtom(mangataHelperAtom);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const [lpBalance, setLpBalance] = useState<any>(null);
  const [lpBalanceRes, setLpBalanceRes] = useState<number | null>(null);
  const [percentage, setPercentage] = useState<string>('');
  const [isVerify, setIsVerify] = useState<boolean>(false);
  const [, setOpen] = useAtom(mainModalOpenAtom);
  const [account1] = useAtom(account1Atom);

  const toast = useToast();

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
      setLpBalance(lpBalance);
      console.log('LP Balance: ', lpBalance);
      const decimal = mangataHelper.getDecimalsBySymbol(`${token0}-${token1}`);
      console.log('decimal', decimal);

      const lpBalanceReserved =
        BigInt(lpBalance.reserved).toString(10) / 10 ** decimal;
      console.log('LP Balance Reserved: ', lpBalanceReserved);
      setLpBalanceRes(lpBalanceReserved);
    })();
  }, []);

  const handleRemoveLiquidity = async () => {
    setIsProcessing(true);

    const signer = account?.wallet?.signer;
    setIsSigning(true);

    const bltx = await mangataHelper.burnLiquidityTx(
      pool.firstTokenId,
      pool.secondTokenId,
      lpBalance.reserved,
      percentage
    );
    await bltx
      .signAndSend(
        account1?.address,
        { signer: signer },
        async ({ status }: any) => {
          if (status.isInBlock) {
            setIsSigning(false);
            console.log(
              `Burn Liquidity in block for ${pool.firstTokenId} & ${
                pool.secondTokenId
              } with hash ${status.asInBlock.toHex()}`
            );
            toast({
              position: 'top',
              duration: 3000,
              render: () => (
                <ToastWrapper
                  title={`Burn Liquidity in block for ${pool.firstTokenId}-${pool.secondTokenId}}`}
                  status="info"
                />
              ),
            });
            // unsub();
            // resolve();
          } else if (status.isFinalized) {
            console.log(
              `Burn Liquidity Successfully for Pool ${pool.firstTokenId}-${
                pool.secondTokenId
              } with hash ${status.asFinalized.toHex()}`
            );

            toast({
              position: 'top',
              duration: 3000,
              render: () => (
                <ToastWrapper
                  title={`Burn Liquidity Successfully for Pool ${pool.firstTokenId}-${pool.secondTokenId}`}
                  status="success"
                />
              ),
            });
            setIsProcessing(false);
            setIsSigning(false);
            setIsSuccess(true);
            // unsub();
            // resolve();
          } else {
            console.log(`Status: ${status.type}`);
          }
        }
      )
      .catch((e: any) => {
        console.log('Error in burnLiquidityTx', e);
        setIsProcessing(false);
        setIsSigning(false);
        setIsSuccess(false);
        toast({
          position: 'top',
          duration: 3000,
          render: () => (
            <ToastWrapper title={`Error in burnLiquidityTx`} status="error" />
          ),
        });
      });
  };

  return (
    <div className="w-full">
      {!isVerify ? (
        <div className="w-full flex flex-col gap-y-10 mt-10">
          <div className="w-full text-[#C5C5C5] py-3 text-base leading-[21.6px] text-center rounded-lg border border-black bg-[#0C0C0C]">
            {lpBalanceRes == null ? (
              <p>fetching your LP balance...</p>
            ) : (
              <p>You Hold: {lpBalanceRes.toFixed(2)} LP token</p>
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
            <div className="inline-flex justify-start gap-x-6">
              <button className="text-left text-base leading-[21.6px]">
                Percentage
              </button>
              <button
                className="text-left text-base leading-[21.6px] opacity-50 cursor-not-allowed"
                disabled
              >
                LP Tokens
              </button>
              <button
                className="text-left text-base leading-[21.6px] opacity-50 cursor-not-allowed"
                disabled
              >
                USD
              </button>
            </div>
            <div className="absolute right-4 top-[21px] bottom-0 text-base leading-[21.6px] text-[#727272]">
              %
            </div>
          </div>
          <div className="flex flex-col gap-y-5 text-xl leading-[27px]">
            <div className="inline-flex w-full justify-between items-center">
              <p className="inline-flex items-center">
                <Image
                  src={farm?.asset.logos[0]}
                  alt={token0}
                  height={32}
                  width={32}
                />
                <span className="ml-5">{token0}</span>
              </p>
              <p className="text-base leading-[21.6px]">{'0.1'} MGX</p>
            </div>
            <div className="inline-flex w-full justify-between items-center">
              <p className="inline-flex items-center">
                <Image
                  src={farm?.asset.logos[1]}
                  alt={token1}
                  height={32}
                  width={32}
                />
                <span className="ml-5">{token1}</span>
              </p>
              <p className="text-base leading-[21.6px]">{'0.1'} TUR</p>
            </div>
            <div className="inline-flex items-center justify-between text-[14px] leading-[18.9px]">
              <p className="inline-flex items-end">
                Fee
                <Tooltip label="Fees to remove liquidity.">
                  <QuestionMarkCircleIcon className="h-5 w-5 opacity-50 ml-2" />
                </Tooltip>
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
              onClick={handleRemoveLiquidity}
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
