import { useAtom } from 'jotai';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import Button from '@components/Library/Button';
import ProcessStepper from '@components/Library/ProcessStepper';
import Tooltip from '@components/Library/Tooltip';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import {
  account1Atom,
  mainModalOpenAtom,
  mangataHelperAtom,
  turingAddressAtom,
  turingHelperAtom,
} from '@store/commonAtoms';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';
import { TabProps, TokenType } from '@utils/types';
import Loader from '@components/Library/Loader';
import ToastWrapper from '@components/Library/ToastWrapper';
import { createLiquidityEventMutation } from '@utils/api';
import { useMutation } from 'urql';
import moment from 'moment';

const AddLiquidityTab = ({ farm, account, pool }: TabProps) => {
  const [mangataHelper] = useAtom(mangataHelperAtom);
  const [turingAddress] = useAtom(turingAddressAtom);
  const signer = account?.wallet?.signer;
  const [account1] = useAtom(account1Atom);
  const [, setOpen] = useAtom(mainModalOpenAtom);

  // Amount States
  const [firstTokenAmount, setFirstTokenAmount] = useState('');
  const [secondTokenAmount, setSecondTokenAmount] = useState('');

  // Process States
  const [isInProcess, setIsInProcess] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [firstTokenBalance, setFirstTokenBalance] = useState<number | null>(
    null
  ); // temperory amount
  const [secondTokenBalance, setSecondTokenBalance] = useState<number | null>(
    null
  ); // temperory amount
  const [lpBalance, setLpBalance] = useState<any>(null);
  const [lpBalanceNum, setLpBalanceNum] = useState<number | null>(null);

  const MAX_SLIPPAGE = 0.08; // 8% slippage; can’t be too large
  const [fees, setFees] = useState<number | null>(null);
  const toast = useToast();

  const [token0, token1] = formatTokenSymbols(
    replaceTokenSymbols(farm?.asset.symbol)
  );

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
    gasFees: number,
    eventType: string
  ) => {
    const variables = {
      userAddress,
      chain,
      token0,
      token1,
      lp,
      timestamp,
      gasFees,
      eventType,
    };
    console.log('Updating the createLiquidityEvent...');
    createLiquidityEvent(variables).then((result) => {
      console.log('createLiquidityEvent Result', result);
    });
  };

  // Estimate of fees; no need to be accurate
  // Method to fetch trnx fees based on token Amounts
  const handleFees = async (firstTokenAmt: any, secondTokenAmt: any) => {
    console.log('Calculating fees...');
    console.log('first token in feemint: ', firstTokenAmt);
    console.log('second token in feemint: ', secondTokenAmt);

    // Estimate of fees; no need to be accurate
    const fees = await mangataHelper.getMintLiquidityFee({
      pair: account1?.address,
      firstTokenId: pool.firstTokenId,
      firstTokenAmount: firstTokenAmt,
      secondTokenId: pool.secondTokenId,
      secondTokenAmount: secondTokenAmt, // expectedSecondTokenAmount
    });

    console.log('fees:', fees, parseFloat(fees));
    setFees(parseFloat(fees));
  };

  // Fetch LP balance from mangataHelper
  useEffect(() => {
    (async () => {
      const lpBalance = await mangataHelper.mangata.getTokenBalance(
        pool.liquidityTokenId,
        account?.address
      );
      setLpBalance(lpBalance);
      const decimal = mangataHelper.getDecimalsBySymbol(`${token0}-${token1}`);

      const lpBalanceNum =
        parseFloat(BigInt(lpBalance.reserved).toString(10)) / 10 ** decimal +
        parseFloat(BigInt(lpBalance.free).toString(10)) / 10 ** decimal;
      setLpBalanceNum(lpBalanceNum);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (account1) {
        // Balance of both tokens on Mangata Chain
        const token0Bal = await mangataHelper.mangata?.getTokenBalance(
          pool.firstTokenId,
          account1.address
        );
        const token1Bal = await mangataHelper.mangata?.getTokenBalance(
          pool.secondTokenId,
          account1.address
        );
        const allAssets = await mangataHelper.mangata.getAssetsInfo();

        const token0Decimal = mangataHelper.getDecimalsBySymbol(token0);
        const token1Decimal = mangataHelper.getDecimalsBySymbol(token1);

        const token0BalanceFree =
          parseFloat(BigInt(token0Bal.free).toString(10)) / 10 ** token0Decimal;
        const token1BalanceFree =
          parseFloat(BigInt(token1Bal.free).toString(10)) / 10 ** token1Decimal;

        setFirstTokenBalance(token0BalanceFree);

        setSecondTokenBalance(token1BalanceFree);
      } else {
        toast({
          position: 'top',
          duration: 3000,
          render: () => (
            <ToastWrapper title="Please connect wallet!" status="error" />
          ),
        });
        console.log('Account1 is empty');
      }
    })();
  }, [account1, pool]);

  const updateSecondTokenAmount = (firstTokenAmount: number): string => {
    const poolRatio = pool.firstTokenAmountFloat / pool.secondTokenAmountFloat;
    console.log('poolRatio', poolRatio);

    // Calculate second token amount
    const expectedSecondTokenAmount =
      (firstTokenAmount / poolRatio) * (1 + MAX_SLIPPAGE);
    console.log('Second Token Amount:', expectedSecondTokenAmount);
    const secondTokenAmount = isNaN(expectedSecondTokenAmount)
      ? '0'
      : expectedSecondTokenAmount.toFixed(5);

    setSecondTokenAmount(secondTokenAmount);
    return secondTokenAmount;
  };

  // Method to update token values and fetch fees based on firstToken Inpout
  const handleChangeFirstTokenAmount = async (e: any) => {
    setFirstTokenAmount(e.target.value);
    const firstTokenAmount = parseFloat(e.target.value);

    if (e.target.value == '') {
      setFees(null);
    }

    const expectedSecondTokenAmount = updateSecondTokenAmount(firstTokenAmount);

    await handleFees(firstTokenAmount, expectedSecondTokenAmount);
  };

  // Method to call to Add Liquidity confirmation
  const handleAddLiquidity = async () => {
    setIsInProcess(true);

    console.log(
      'pool.firstTokenAmountFloat',
      pool.firstTokenAmountFloat,
      'pool.secondTokenAmountFloat',
      pool.secondTokenAmountFloat,
      'firstTokenAmount',
      firstTokenAmount,
      'expectedSecondTokenAmount',
      secondTokenAmount // expectedSecondTokenAmount
    );

    // Method to Add Liquidity
    const mintLiquidityTxn = await mangataHelper.mintLiquidityTx(
      pool.firstTokenId,
      pool.secondTokenId,
      parseFloat(firstTokenAmount),
      parseFloat(secondTokenAmount) // expectedSecondTokenAmount
    );

    setIsSigning(true);

    await mintLiquidityTxn
      .signAndSend(account1?.address, { signer: signer }, ({ status }: any) => {
        if (status.isInBlock) {
          console.log(
            `Mint liquidity trxn is in Block with hash ${status.asInBlock.toHex()}`
          );
          // unsub();
        } else if (status.isFinalized) {
          setIsSuccess(true);
          setIsInProcess(false);
          setIsSigning(false);
          console.log('Mint liquidity trxn finalised.');
          toast({
            position: 'top',
            duration: 3000,
            render: () => (
              <ToastWrapper
                title={`Adding liquidity to ${pool.firstTokenId}-${pool.secondTokenId}} in successful.`}
                status="info"
              />
            ),
          });
          // unsub();
          // Calling the ADD_LIQUIDITY tracker in isFinalised status
          createLiquidityEventHandler(
            turingAddress as string,
            'ROCOCO',
            { symbol: token0, amount: parseFloat(firstTokenAmount) },
            { symbol: token1, amount: parseFloat(secondTokenAmount) },
            { symbol: `${token0}-${token1}`, amount: 0 },
            moment().valueOf().toString(),
            fees as number,
            'ADD_LIQUIDITY'
          );
        } else {
          console.log('Status:', status.type);
          setIsSigning(false);
          setFirstTokenAmount('');
          setSecondTokenAmount('');
        }
      })
      .catch((err: any) => {
        console.log('Error while minting liquidity: ', err);
        setIsInProcess(false);
        setIsSigning(false);
        setIsSuccess(false);
        toast({
          position: 'top',
          duration: 3000,
          render: () => (
            <ToastWrapper
              title="Error while minting Liquidity!"
              status="error"
            />
          ),
        });
      });
  };

  return (
    <div className="w-full flex flex-col gap-y-10 mt-10">
      <div className="w-full text-[#C5C5C5] py-3 text-base leading-[21.6px] text-center rounded-lg border border-black bg-[#0C0C0C]">
        {lpBalanceNum == null ? (
          <p>fetching your LP balance...</p>
        ) : (
          <p>
            You Hold {lpBalanceNum.toFixed(2)} {token0}-{token1} LP tokens
          </p>
        )}
      </div>
      {/* MGX Container */}
      <div className="flex flex-row justify-between p-4 border border-primaryGreen rounded-lg">
        <div className="flex flex-row gap-x-5 items-center">
          <Image
            src={farm?.asset.logos[0]}
            alt={token0}
            height={32}
            width={32}
            className="rounded-full"
          />
          <span>{token0}</span>
        </div>
        <div className="flex flex-col gap-y-3">
          <div className="flex flex-row justify-end items-center gap-x-3">
            <p className="flex flex-col items-end text-sm leading-[19px] opacity-50">
              <span>Balance</span>
              {firstTokenBalance == null ? (
                <span>loading...</span>
              ) : (
                <span>{`${firstTokenBalance.toFixed(2)} ${token0}`}</span>
              )}
            </p>
            <button
              onClick={() => {
                setFirstTokenAmount(
                  firstTokenBalance ? firstTokenBalance.toString() : ''
                );
                updateSecondTokenAmount(firstTokenBalance as number);
              }}
              disabled={firstTokenBalance == null}
              className="p-[10px] rounded-lg bg-baseGray text-base leading-5"
            >
              MAX
            </button>
          </div>
          <div className="text-right">
            <input
              placeholder="0"
              className="text-xl leading-[27px] bg-transparent text-right focus:outline-none"
              min={0}
              onChange={handleChangeFirstTokenAmount}
              value={firstTokenAmount}
            />
          </div>
        </div>
      </div>
      <span className="text-center select-none">+</span>
      {/* TUR Container */}
      <div className="flex flex-row justify-between p-4 border border-[#727272] rounded-lg">
        <div className="flex flex-row gap-x-5 items-center">
          <Image
            src={farm?.asset.logos[1]}
            alt={token1}
            height={32}
            width={32}
            className="rounded-full"
          />
          <span>{token1}</span>
        </div>
        <div className="flex flex-col gap-y-3">
          <div className="flex flex-row justify-end items-center gap-x-3">
            <p className="flex flex-col items-end text-sm leading-[19px] opacity-50">
              <span>Balance</span>
              {secondTokenBalance == null ? (
                <span>loading...</span>
              ) : (
                <span>{`${secondTokenBalance.toFixed(2)} ${token1}`}</span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p>{secondTokenAmount}</p>
          </div>
        </div>
      </div>
      {/* Fee and Share */}
      <div className="flex flex-col gap-y-5 pr-[19px] text-sm leading-[19px]">
        {fees !== null ? (
          <>
            <div className="flex flex-row justify-between">
              <p className="inline-flex items-center">Fee</p>
              <p>{fees.toFixed(3)} MGR</p>
            </div>
            {/* <div className="flex flex-row justify-between">
              <p className="inline-flex items-center">Expected Share of Pool</p>
              <p>&lt;0.001%</p>
            </div> */}
          </>
        ) : firstTokenAmount.length > 0 && secondTokenAmount.length > 0 ? (
          <div className="text-center font-medium tracking-wide">
            <p>fetching best price...</p>
          </div>
        ) : null}
      </div>
      {/* Buttons */}
      <div className="flex flex-col gap-y-2">
        <Button
          type="primary"
          disabled={
            firstTokenAmount == '' ||
            secondTokenAmount == '' ||
            parseFloat(firstTokenAmount) <= 0 ||
            parseFloat(secondTokenAmount) <= 0 ||
            parseFloat(firstTokenAmount) > (firstTokenBalance as number) ||
            parseFloat(secondTokenAmount) > (secondTokenBalance as number) ||
            isInProcess
          }
          text="Confirm"
          onClick={handleAddLiquidity}
        />
        <Button
          type="secondary"
          text="Go Back"
          disabled={isInProcess}
          onClick={() => {
            setOpen(false);
          }}
        />
      </div>
      {/* Stepper */}
      {isInProcess ||
        (isSuccess && (
          <ProcessStepper
            activeStep={isSuccess ? 3 : isSigning ? 2 : 1}
            steps={[
              { label: 'Confirm' },
              { label: 'Sign' },
              { label: 'Complete' },
            ]}
          />
        ))}
      {isInProcess && (
        <div className="flex flex-row px-4 items-center justify-center text-base leading-[21.6px] bg-baseGray rounded-lg py-10 text-center">
          {(isSigning || !isSuccess) && <Loader size="md" />}
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
            Liquidity Added: {firstTokenAmount} {token0} with{' '}
            {secondTokenAmount} {token1} successfully.
          </p>
          <p className="opacity-60">
            Go back and refresh to see updated Balance.
          </p>
        </div>
      )}
    </div>
  );
};

export default AddLiquidityTab;
