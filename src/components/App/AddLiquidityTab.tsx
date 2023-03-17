import { useAtom } from 'jotai';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import Button from '@components/Library/Button';
import ProcessStepper from '@components/Library/ProcessStepper';
import Tooltip from '@components/Library/Tooltip';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { accountAtom } from '@store/accountAtoms';
import {
  account1Atom,
  mainModalOpenAtom,
  mangataHelperAtom,
  turingHelperAtom,
} from '@store/commonAtoms';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';
import { TabProps } from '@utils/types';
import Loader from '@components/Library/Loader';
import { BN } from 'bn.js';
import ToastWrapper from '@components/Library/ToastWrapper';
import { getAssets, getDecimalById } from '@utils/mangata-helpers';
import { getDecimalBN } from '@utils/xcm/common/utils';

const AddLiquidityTab = ({ farm, account, pool }: TabProps) => {
  const [mangataHelper] = useAtom(mangataHelperAtom);
  const [turingHelper] = useAtom(turingHelperAtom);
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
  const isInsufficientBalance = false; // firstTokenBalance < parseFloat(firstTokenAmount);

  const MAX_SLIPPAGE = 0.08; // 4% slippage; can’t be too large
  const [fees, setFees] = useState<number | null>(null);
  const toast = useToast();

  const [token0, token1] = formatTokenSymbols(
    replaceTokenSymbols(farm?.asset.symbol)
  );

  // Estimate of fees; no need to be accurate
  // Method to fetch trnx fees based on token Amounts
  const handleFees = async (firstTokenAmt: any, secondTokenAmt: any) => {
    console.log('Calculating fees...');
    console.log('first token in feemint: ', firstTokenAmt);
    console.log('second token in feemint: ', secondTokenAmt);

    // Estimate of fees; no need to be accurate
    const fees = await mangataHelper.getMintLiquidityFee({
      pair: account1.address,
      firstTokenId: pool.firstTokenId,
      firstTokenAmount: firstTokenAmt,
      secondTokenId: pool.secondTokenId,
      secondTokenAmount: secondTokenAmt, // expectedSecondTokenAmount
    });

    console.log('fees:', fees, parseFloat(fees));
    setFees(parseFloat(fees));
  };

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

        const token0Decimal = await getDecimalById(
          allAssets,
          pool.firstTokenId
        );
        const token1Decimal = await getDecimalById(
          allAssets,
          pool.secondTokenId
        );

        // Converting Token balances to human readable format and setting to state
        const token0BalanceFree = token0Bal.free
          .div(getDecimalBN(token0Decimal))
          .toNumber();
        setFirstTokenBalance(token0BalanceFree);

        const token1BalanceFree = token1Bal.free
          .div(getDecimalBN(token1Decimal))
          .toNumber();
        setSecondTokenBalance(token1BalanceFree);

        // const bal1 = new BN(mgxBal.free).toString(10) / 10 ** (assetsInfo['0']['decimals']);
        // const bal2 = BigInt(mgxBal.free).toString(10) / 10 ** (assetsInfo[‘0’][‘decimals’]);
        // console.log('freebal1', token1Bal.free.toNumber());
        // console.log('freebal2', token2Bal.free.toNumber());
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

    // this should go in add liquidity modal
    // if (liquidityBalance.reserved.toNumber() === 0) {
    // console.log(
    //   'Reserved pool token is zero; minting liquidity to generate rewards...'
    // );

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
            `Mint liquidity trxn successful with hash ${status.asInBlock.toHex()}`
          );
        } else if (status.isFinalised) {
          console.log('Mint liquidity trxn finalised.');
          setIsInProcess(false);
          setIsSigning(false);
          setIsSuccess(true);
        } else {
          console.log('Status:', status.type);
        }
      })
      .catch((err: any) => {
        console.log('Error while minting liquidity: ', err);
      });
    setIsSigning(false);
    setIsSuccess(true);

    // TODO: activate liquidity mining
    // figure out lp token amount
    // await mangataHelper.activateLiquidityV2({
    //     tokenId: liquidityTokenId,
    //     amount:
    // })
    // }
  };

  return (
    <div className="w-full flex flex-col gap-y-10 mt-10">
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
                <span>{`${firstTokenBalance} ${token0}`}</span>
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
                <span>{`${secondTokenBalance} ${token1}`}</span>
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
              <p className="inline-flex items-center">
                Fee
                <Tooltip label={<span>This is it</span>}>
                  <QuestionMarkCircleIcon className="ml-2 h-5 w-5 opacity-50" />
                </Tooltip>
              </p>
              <p>{fees.toFixed(3)} MGX</p>
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
        {isInsufficientBalance ? (
          <Button type="disabled" text="Insufficient Balance" />
        ) : (
          <Button
            type={
              firstTokenAmount == null ||
              secondTokenAmount == null ||
              parseFloat(firstTokenAmount) <= 0 ||
              parseFloat(secondTokenAmount) <= 0 ||
              parseFloat(firstTokenAmount) > (firstTokenBalance as number) ||
              parseFloat(secondTokenAmount) > (secondTokenBalance as number)
                ? 'disabled'
                : 'primary'
            }
            text="Confirm"
            onClick={handleAddLiquidity}
          />
        )}
        <Button
          type="secondary"
          text="Go Back"
          onClick={() => {
            setOpen(false);
          }}
        />
      </div>
      {/* Stepper */}
      {isInProcess && (
        <ProcessStepper
          activeStep={isSuccess ? 3 : isSigning ? 2 : 1}
          steps={[
            { label: 'Confirm' },
            { label: 'Sign' },
            { label: 'Complete' },
          ]}
        />
      )}
      {isInProcess && (
        <div className="flex flex-row px-4 items-center justify-center text-base leading-[21.6px] bg-baseGray rounded-lg py-10 text-center">
          {(isSigning || !isSuccess) && <Loader size="md" />}
          {isSigning && (
            <span className="ml-6">
              Please sign the transaction in your wallet.
            </span>
          )}
          {isSuccess && (
            <p>
              Liquidity Added: {firstTokenAmount} MGX with {secondTokenAmount}{' '}
              TUR successfully.
              {/* Check your hash{' '}
              <a href="#" className="underline underline-offset-4">
                here
              </a> */}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AddLiquidityTab;
