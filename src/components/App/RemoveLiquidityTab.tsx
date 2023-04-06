import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { useMutation } from 'urql';
import moment from 'moment';
import Button from '@components/Library/Button';
import { mainModalOpenAtom } from '@store/commonAtoms';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';
import { TabProps, TokenType } from '@utils/types';
import { useToast } from '@chakra-ui/react';
import { accountAtom } from '@store/accountAtoms';
import ToastWrapper from '@components/Library/ToastWrapper';
import {
  mangataHelperAtom,
  turingAddressAtom,
  account1Atom,
} from '@store/commonAtoms';
import { createLiquidityEventMutation } from '@utils/api';
import Loader from '@components/Library/Loader';

const RemoveLiquidityTab = ({ farm, pool }: TabProps) => {
  const [account] = useAtom(accountAtom);
  const [mangataHelper] = useAtom(mangataHelperAtom);
  const [turingAddress] = useAtom(turingAddressAtom);

  const [isInProcess, setIsInProcess] = useState<boolean>(false);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const [lpBalance, setLpBalance] = useState<any>(null);
  const [lpBalanceNum, setLpBalanceNum] = useState<number | null>(null);
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

      const lpBalanceNum =
        parseFloat(BigInt(lpBalance.reserved).toString(10)) / 10 ** decimal +
        parseFloat(BigInt(lpBalance.free).toString(10)) / 10 ** decimal;
      console.log('LP Balance lpBalanceNum: ', lpBalanceNum);
      setLpBalanceNum(lpBalanceNum);
    })();
  }, []);

  // Mutation to add config as a createLiquidityEvent
  const [createLiquidityEventResult, createLiquidityEvent] = useMutation(
    createLiquidityEventMutation
  );
  const createLiquidityEventHandler = async (
    userAddress: string,
    chain: string,
    token0: TokenType,
    token1: TokenType,
    lp: TokenType,
    timestamp: string,
    gasFee: number,
    eventType: string
  ) => {
    const variables = {
      userAddress,
      chain,
      token0,
      token1,
      lp,
      timestamp,
      gasFee,
      eventType,
    };
    console.log('Updating the createLiquidityEvent...');
    createLiquidityEvent(variables).then((result) => {
      console.log('createLiquidityEvent Result', result);
    });
  };

  const handleRemoveLiquidity = async () => {
    setIsInProcess(true);

    const signer = account?.wallet?.signer;
    setIsSigning(true);
    const lpBalReserved =
      parseFloat(BigInt(lpBalance.reserved).toString(10)) / 10 ** 18;
    const lpBalFree =
      parseFloat(BigInt(lpBalance.free).toString(10)) / 10 ** 18;

    console.log(
      'lpBalance.reserved',
      lpBalance.reserved,
      lpBalReserved,
      'percentage',
      percentage
    );

    let txns = [];
    console.log(
      'res',
      lpBalReserved,
      'free',
      lpBalFree,
      'free+res',
      lpBalReserved + lpBalFree
    );
    if (BigInt(lpBalance.reserved) == BigInt(0)) {
      console.log('resbal is zero');
    } else {
      const deactx = await mangataHelper.deactivateLiquidityV2(
        pool.liquidityTokenId,
        BigInt(lpBalance.reserved)
      );
      txns.push(deactx);
    }
    console.log(
      'res',
      lpBalReserved,
      BigInt(lpBalance.reserved),
      'free',
      BigInt(lpBalance.free),
      BigInt(lpBalance.free).toString(10),
      parseInt(BigInt(lpBalance.free).toString(10)),
      lpBalFree,
      'free+res',
      lpBalReserved + lpBalFree,
      'thiss',
      parseFloat(BigInt(lpBalance.free).toString(10)) +
        parseFloat(BigInt(lpBalance.reserved).toString(10)),
      BigInt(lpBalance.free) + BigInt(lpBalance.reserved),
      BigInt(parseInt(percentage, 10) / 100) *
        (BigInt(lpBalance.free) + BigInt(lpBalance.reserved))
    );
    console.log(
      'blstuff',
      BigInt(
        (parseInt(percentage, 10) / 100) *
          parseFloat(BigInt(lpBalance.free).toString(10))
      ).toString(10),
      'onlyres',
      BigInt(lpBalReserved * 10 ** 18).toString(10)
    );
    if (
      BigInt(parseInt(percentage, 10) / 100) *
        (BigInt(lpBalance.free) + BigInt(lpBalance.reserved)) ==
      BigInt(0)
    ) {
      console.log('totalburnbal is zero');
    } else {
      const bltx = await mangataHelper.burnLiquidityTx(
        pool.firstTokenId,
        pool.secondTokenId,
        BigInt(parseInt(percentage, 10) / 100) *
          (BigInt(lpBalance.free) + BigInt(lpBalance.reserved)),
        parseInt(percentage, 10)
      );
      txns.push(bltx);
    }

    const removeLiqBatchTx = mangataHelper.api.tx.utility.batchAll(txns);

    await removeLiqBatchTx
      .signAndSend(
        account1?.address,
        { signer: signer },
        async ({ status }: any) => {
          if (status.isInBlock) {
            console.log('Burn Liquidity in block now!');
            // unsub();
            // resolve();
          } else if (status.isFinalized) {
            setIsSuccess(true);
            setIsInProcess(false);
            setIsSigning(false);
            console.log(
              `Liquidity Successfully removed for ${pool.firstTokenId}-${
                pool.secondTokenId
              } with hash ${status.asFinalized.toHex()}`
            );
            toast({
              position: 'top',
              duration: 3000,
              render: () => (
                <ToastWrapper
                  title={`Liquidity Successfully removed from ${pool.firstTokenId}-${pool.secondTokenId}`}
                  status="success"
                />
              ),
            });
            // unsub();
            // resolve();
            createLiquidityEventHandler(
              turingAddress as string,
              'ROCOCO',
              { symbol: token0, amount: 0.0 },
              { symbol: token1, amount: 0.0 },
              {
                symbol: `${token0}-${token1}`,
                amount:
                  ((lpBalReserved + lpBalFree) * parseFloat(percentage)) / 100,
              }, // Amount of Liquidity burnt
              moment().valueOf().toString(),
              0.0,
              'REMOVE_LIQUIDITY'
            );
          } else {
            setIsSigning(false);
            console.log(`Status: ${status.type}`);
          }
        }
      )
      .catch((e: any) => {
        console.log('Error in burnLiquidityTx', e);
        setIsInProcess(false);
        setIsSigning(false);
        setIsSuccess(false);
        toast({
          position: 'top',
          duration: 3000,
          render: () => (
            <ToastWrapper
              title="Error while removing Liquidity!"
              status="error"
            />
          ),
        });
      });
  };

  return (
    <div className="w-full">
      {!isVerify ? (
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
              disabled={isInProcess || isSuccess}
              className="w-3/5"
              onClick={handleRemoveLiquidity}
            />
            <Button
              type="secondary"
              text="Go Back"
              className="w-2/5"
              disabled={isInProcess}
              onClick={() => {
                setPercentage('');
                setIsVerify(false);
              }}
            />
          </div>
          {isInProcess && (
            <div className="flex flex-row px-4 items-center justify-center text-base leading-[21.6px] bg-baseGray rounded-lg py-10 text-center">
              {!isSuccess && <Loader size="md" />}
              {isSigning && (
                <span className="ml-6">
                  Please sign the transaction in your wallet.
                </span>
              )}
            </div>
          )}
          {isSuccess && (
            <div className="flex flex-col gap-2 px-4 items-center justify-center text-base leading-[21.6px] bg-baseGray rounded-lg py-10 text-center">
              <p>
                Successfully removed {percentage}% Liquidity from {token0}-
                {token1}! 🎉
              </p>
              <p>Close modal & Refresh to update.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RemoveLiquidityTab;
