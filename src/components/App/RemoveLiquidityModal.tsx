import { FC, useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import Button from '@components/Library/Button';
import Loader from '@components/Library/Loader';
import ModalWrapper from '@components/Library/ModalWrapper';
import Stepper from '@components/Library/Stepper';
import {
  mainModalOpenAtom,
  removeLiqModalOpenAtom,
  selectedFarmAtom,
  mangataHelperAtom,
  turingAddressAtom,
  account1Atom,
  poolsAtom,
  removeLiquidityConfigAtom,
  isInitialisedAtom,
  lpUpdatedAtom,
} from '@store/commonAtoms';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';
import { accountAtom } from '@store/accountAtoms';
import _ from 'lodash';
import { useToast } from '@chakra-ui/react';
import ToastWrapper from '@components/Library/ToastWrapper';
import { TokenType } from '@utils/types';
import { useMutation } from 'urql';
import { createLiquidityEventMutation } from '@utils/api';
import getTimestamp from '@utils/getTimestamp';

const RemoveLiquidityModal: FC = () => {
  const [, setOpenMainModal] = useAtom(mainModalOpenAtom);
  const [account] = useAtom(accountAtom);
  const [account1] = useAtom(account1Atom);
  const [isModalOpen, setIsModalOpen] = useAtom(removeLiqModalOpenAtom);
  const [farm] = useAtom(selectedFarmAtom);
  const [mangataHelper] = useAtom(mangataHelperAtom);
  const [turingAddress] = useAtom(turingAddressAtom);
  const [pools] = useAtom(poolsAtom);
  const [config] = useAtom(removeLiquidityConfigAtom);
  const [isInitialised] = useAtom(isInitialisedAtom);
  const [lpUpdated, setLpUpdated] = useAtom(lpUpdatedAtom);

  const [lpBalance, setLpBalance] = useState<any>(null);
  const [lpBalanceNum, setLpBalanceNum] = useState<number | null>(null);

  const { method, percentage, firstTokenNumber, secondTokenNumber, lpAmount } =
    config;

  const toast = useToast();

  // Process states
  const [isInProcess, setIsInProcess] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [token0, token1] = formatTokenSymbols(
    replaceTokenSymbols(farm?.asset.symbol ?? 'MGR-TUR LP')
  );

  useEffect(() => {
    // Resetting all states to default on open/close
    setIsInProcess(false);
    setIsSigning(false);
    setIsSuccess(false);
  }, [isModalOpen]);

  // Fetch LP balance from mangataHelper
  useEffect(() => {
    if (!isInitialised) return;
    (async () => {
      const pool = _.find(pools, {
        firstTokenId: mangataHelper.getTokenIdBySymbol(token0),
        secondTokenId: mangataHelper.getTokenIdBySymbol(token1),
      });
      const lpBalance = await mangataHelper.mangata.getTokenBalance(
        pool.liquidityTokenId,
        account?.address
      );
      setLpBalance(lpBalance);
      console.log('LP Balance: ', lpBalance);
      const decimal = mangataHelper.getDecimalsBySymbol(`${token0}-${token1}`);
      const lpBalanceNum =
        parseFloat(BigInt(lpBalance.reserved).toString(10)) / 10 ** decimal +
        parseFloat(BigInt(lpBalance.free).toString(10)) / 10 ** decimal;
      console.log('lpBalanceNum: ', lpBalanceNum);
      setLpBalanceNum(lpBalanceNum);
    })();
  }, [isModalOpen]);

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

    const pool = _.find(pools, {
      firstTokenId: mangataHelper.getTokenIdBySymbol(token0),
      secondTokenId: mangataHelper.getTokenIdBySymbol(token1),
    });

    let perc = percentage;
    if (percentage == '') {
      console.log('perccase');
      perc = '100';
    }

    try {
      const signer = account?.wallet?.signer;
      setIsSigning(true);
      const lpBalReserved =
        parseFloat(BigInt(lpBalance.reserved).toString(10)) / 10 ** 18;
      const lpBalFree =
        parseFloat(BigInt(lpBalance.free).toString(10)) / 10 ** 18;

      console.log(
        'amamamam',
        lpAmount,
        'lpBalance.reserved',
        lpBalance.reserved,
        lpBalReserved,
        'percentage',
        percentage,
        'heroo'
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
      // console.log(
      //   'res',
      //   lpBalReserved,
      //   BigInt(lpBalance.reserved),
      //   'free',
      //   BigInt(lpBalance.free),
      //   BigInt(lpBalance.free).toString(10),
      //   parseInt(BigInt(lpBalance.free).toString(10)),
      //   lpBalFree,
      //   'free+res',
      //   lpBalReserved + lpBalFree,
      //   'thiss',
      //   parseFloat(BigInt(lpBalance.free).toString(10)) +
      //     parseFloat(BigInt(lpBalance.reserved).toString(10)),
      //   BigInt(lpBalance.free) + BigInt(lpBalance.reserved),
      //   // BigInt(parseInt(percentage, 10) / 100) *
      //   BigInt((lpBalance.free * parseInt(percentage, 10)) / 100) +
      //     BigInt((lpBalance.reserved * parseInt(percentage, 10)) / 100)
      // );
      console.log(
        'blstuff',
        lpBalance,
        perc
        // BigInt(
        //   (parseInt(percentage, 10) / 100) *
        //     parseFloat(BigInt(lpBalance.free).toString(10))
        // ).toString(10),
        // 'onlyres',
        // BigInt(lpBalReserved * 10 ** 18).toString(10)
      );
      // console.log(
      //   'myval',
      //   perc,
      //   BigInt((lpBalance.free * parseInt(perc, 10)) / 100),
      //   BigInt(lpBalance.reserved) * BigInt(parseInt(perc, 10) / 100),
      //   BigInt((lpBalance.reserved * parseFloat(perc)) / 100)
      //   // parseInt((parseFloat(lpAmount) * 10 ** 18, 10).toString()),
      //   // lpAmount
      // );
      if (
        // BigInt(parseInt(percentage, 10) / 100) *
        //   (BigInt(lpBalance.free) + BigInt(lpBalance.reserved)) ==
        // BigInt(0)
        (BigInt(lpBalance.free) * BigInt(parseInt(perc, 10))) / BigInt(100) +
          (BigInt(lpBalance.reserved) * BigInt(parseInt(perc, 10))) /
            BigInt(100) ==
        BigInt(0)
      ) {
        console.log('totalburnbal is zero');
      } else {
        let bltx;
        if (method == 0) {
          bltx = await mangataHelper.burnLiquidityTx(
            pool.firstTokenId,
            pool.secondTokenId,
            // BigInt(parseInt(percentage, 10) / 100) *
            //   (BigInt(lpBalance.free) + BigInt(lpBalance.reserved)),
            (BigInt(lpBalance.free) * BigInt(parseInt(perc, 10))) /
              BigInt(100) +
              (BigInt(lpBalance.reserved) * BigInt(parseInt(perc, 10))) /
                BigInt(100),
            parseInt(config.percentage, 10)
          );
        } else if (method == 1) {
          bltx = await mangataHelper.burnLiquidityTx(
            pool.firstTokenId,
            pool.secondTokenId,
            BigInt(parseInt((parseFloat(lpAmount) * 10 ** 18).toString(), 10)),
            parseInt(perc, 10) // Not used in burnLiquidityTx
          );
        }
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
              setLpUpdated(lpUpdated + 1);
              console.log(
                `Liquidity Successfully removed from ${token0}-${token1} with hash ${status.asFinalized.toHex()}`
              );
              toast({
                position: 'top',
                duration: 3000,
                render: () => (
                  <ToastWrapper
                    title={`Liquidity successfully removed from ${token0}-${token1} pool.`}
                    status="success"
                  />
                ),
              });
              // unsub();
              // resolve();
              createLiquidityEventHandler(
                turingAddress as string,
                'ROCOCO',
                { symbol: token0, amount: firstTokenNumber },
                { symbol: token1, amount: secondTokenNumber },
                {
                  symbol: `${token0}-${token1}`,
                  amount:
                    method == 0
                      ? ((lpBalanceNum as number) * parseFloat(percentage)) /
                        100
                      : parseFloat(lpAmount),
                }, // Amount of Liquidity burnt
                getTimestamp(),
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
                title="Error while removing Liquidity. Please try again later."
                status="error"
              />
            ),
          });
        });
    } catch (error) {
      let errorString = `${error}`;
      console.log('error while handling remove liquidity:', errorString);
      toast({
        position: 'top',
        duration: 3000,
        render: () => <ToastWrapper title={errorString} status="error" />,
      });
      setIsInProcess(false);
      setIsSigning(false);
    }
  };

  return (
    <ModalWrapper
      open={isModalOpen || isInProcess}
      setOpen={isInProcess ? () => {} : setIsModalOpen}
    >
      {!isInProcess && !isSuccess && (
        <div className="w-full flex flex-col gap-y-12">
          <p className="text-left w-full">
            Removing{' '}
            {method == 0
              ? (
                  ((lpBalanceNum as number) * parseFloat(percentage)) /
                  100
                ).toFixed(2)
              : lpAmount}{' '}
            LP Tokens from {token0}-{token1} Pool.
          </p>
          <div className="inline-flex gap-x-2 w-full">
            <Button
              type="secondary"
              text="Confirm"
              onClick={handleRemoveLiquidity}
              className="w-1/2"
            />
            <Button
              type="warning"
              text="Cancel"
              className="w-1/2"
              onClick={() => {
                setOpenMainModal(true);
                setIsModalOpen(false);
              }}
            />
          </div>
        </div>
      )}
      {isInProcess && (
        <div className="flex flex-row gap-x-6 py-14 items-center justify-center text-xl leading-[27px] bg-baseGray rounded-lg select-none">
          {!isSuccess && <Loader size="md" />}
          {isSigning ? (
            <span className="text-center max-w-[272px]">
              Please Sign the Transaction in your wallet.
            </span>
          ) : (
            <div className="text-left max-w-[280px]">
              <p>Completing Transaction..</p>
              <p>This may take a few seconds</p>
            </div>
          )}
        </div>
      )}
      {isSuccess && (
        <div className="flex flex-col gap-y-12">
          <div className="py-14 text-center text-xl leading-[27px] bg-baseGray rounded-lg">
            {method == 0
              ? ((lpBalanceNum as number) * parseFloat(percentage)) / 100
              : parseFloat(lpAmount)}{' '}
            LP Tokens removed successfully!
          </div>
          <button
            className="w-full py-[13px] text-base leading-[21.6px] rounded-lg border border-[#7D7D7D]"
            onClick={() => {
              setIsModalOpen(false);
            }}
          >
            Go Home
          </button>
        </div>
      )}
      {!isSuccess && (
        <Stepper
          activeStep={!isInProcess ? 0 : isSigning ? 1 : 2}
          steps={[
            { label: 'Confirm' },
            { label: 'Sign' },
            { label: 'Complete' },
          ]}
        />
      )}
    </ModalWrapper>
  );
};

const TokenLabels = ({
  symbol,
  amount,
}: {
  symbol: string;
  amount: number;
}) => (
  <div className="flex flex-col gap-y-[2px]">
    <p className="text-[#969595]">{symbol}</p>
    <p>{amount.toFixed(3)}</p>
  </div>
);

export default RemoveLiquidityModal;
