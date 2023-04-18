import Image from 'next/image';
import { useAtom } from 'jotai';
import { useEffect, useState, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import clsx from 'clsx';
import Button from '@components/Library/Button';
import {
  account1Atom,
  mainModalOpenAtom,
  mangataHelperAtom,
  allLpBalancesAtom,
  addLiqModalOpenAtom,
  addLiquidityConfigAtom,
} from '@store/commonAtoms';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';
import { TabProps } from '@utils/types';
import ToastWrapper from '@components/Library/ToastWrapper';

const AddLiquidityTab = ({ farm, account, pool }: TabProps) => {
  const [mangataHelper] = useAtom(mangataHelperAtom);
  const [account1] = useAtom(account1Atom);
  const [, setIsOpen] = useAtom(mainModalOpenAtom);
  const [allLpBalances] = useAtom(allLpBalancesAtom);
  const [, setIsModalOpen] = useAtom(addLiqModalOpenAtom);
  const [, setConfig] = useAtom(addLiquidityConfigAtom);

  const refFirstInput = useRef<HTMLInputElement>(null);
  const refSecondInput = useRef<HTMLInputElement>(null);

  // Amount States
  const [firstTokenAmount, setFirstTokenAmount] = useState('');
  const [secondTokenAmount, setSecondTokenAmount] = useState('');

  const [firstTokenBalance, setFirstTokenBalance] = useState<number | null>(
    null
  );
  const [secondTokenBalance, setSecondTokenBalance] = useState<number | null>(
    null
  );

  const MAX_SLIPPAGE = 0.08; // 8% slippage; can’t be too large
  const [fees, setFees] = useState<number | null>(null);
  const toast = useToast();

  const [token0, token1] = formatTokenSymbols(
    replaceTokenSymbols(farm?.asset.symbol)
  );

  const lpBalanceNum: number = allLpBalances[`${token0}-${token1}`];

  // Estimate of fees; no need to be accurate
  // Method to fetch trnx fees based on token Amounts
  const handleFees = async (firstTokenAmt: any, secondTokenAmt: any) => {
    console.log('Calculating fees...');
    console.log('first token in feemint: ', firstTokenAmt);
    console.log('second token in feemint: ', secondTokenAmt);

    try {
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
    } catch (error) {
      console.log('error in handleFees', error);
    }
  };

  useEffect(() => {
    console.log('activeElement', document.activeElement);
    console.log('firsteelement', refFirstInput.current);
    console.log('secondelement', refSecondInput.current);
    if (document.activeElement == refFirstInput.current) {
      console.log('firsttoken focused');
    } else if (document.activeElement == refSecondInput.current) {
      console.log('secondtoken focused');
    } else {
      console.log('nothing focused');
    }
  }, [document]);

  // Fetch Balances of both tokens on Mangata Chain
  useEffect(() => {
    (async () => {
      if (account1) {
        const token0Bal = await mangataHelper.mangata?.getTokenBalance(
          pool.firstTokenId,
          account1.address
        );
        const token1Bal = await mangataHelper.mangata?.getTokenBalance(
          pool.secondTokenId,
          account1.address
        );

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

  // Method to update second token amount based on first token amount
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

  // Method to update first token amount based on second token amount
  const updateFirstTokenAmount = (secondTokenAmount: number): string => {
    const poolRatio = pool.firstTokenAmountFloat / pool.secondTokenAmountFloat;
    console.log('poolRatio', poolRatio);

    // Calculate first token amount
    const expectedFirstTokenAmount =
      (secondTokenAmount / (1 + MAX_SLIPPAGE)) * poolRatio;

    console.log('Second Token Amount:', expectedFirstTokenAmount);
    const firstTokenAmount = isNaN(expectedFirstTokenAmount)
      ? '0'
      : expectedFirstTokenAmount.toFixed(5);

    setFirstTokenAmount(firstTokenAmount);
    return firstTokenAmount;
  };

  // Method to update token values and fetch fees based on firstToken Input
  const handleChangeFirstTokenAmount = async (e: any) => {
    setFirstTokenAmount(e.target.value);
    const firstTokenAmount = parseFloat(e.target.value);

    if (e.target.value == '') {
      setFees(null);
    }

    const expectedSecondTokenAmount = updateSecondTokenAmount(firstTokenAmount);

    await handleFees(firstTokenAmount, expectedSecondTokenAmount);
  };

  // Method to update token values and fetch fees based on secondToken Input
  const handleChangeSecondTokenAmount = async (e: any) => {
    setSecondTokenAmount(e.target.value);
    const secondTokenAmount = parseFloat(e.target.value);

    if (e.target.value == '') {
      setFees(null);
    }

    const expectedFirstTokenAmount = updateFirstTokenAmount(secondTokenAmount);

    await handleFees(secondTokenAmount, expectedFirstTokenAmount);
  };

  // Method to handle max button for first token
  const handleMaxFirstToken = () => {
    if ((firstTokenBalance as number) < 20) {
      toast({
        position: 'top',
        duration: 3000,
        render: () => (
          <ToastWrapper
            title="Insufficient balance to pay gas fees!"
            status="warning"
          />
        ),
      });
      return;
    }
    if (token0 == 'MGR') {
      setFirstTokenAmount(
        firstTokenBalance
          ? (firstTokenBalance - (fees ?? 0) - 20).toString()
          : ''
      );
    } else {
      setFirstTokenAmount(
        firstTokenBalance ? firstTokenBalance.toString() : ''
      );
    }
    updateSecondTokenAmount(firstTokenBalance as number);
  };

  // Method to handle max button for second token
  const handleMaxSecondToken = () => {
    // Checking if user has enough balance to pay gas fees
    if ((secondTokenBalance as number) < 20) {
      toast({
        position: 'top',
        duration: 3000,
        render: () => (
          <ToastWrapper
            title="Insufficient balance to pay gas fees!"
            status="warning"
          />
        ),
      });
      return;
    }
    if (token1 == 'MGR') {
      setSecondTokenAmount(
        secondTokenBalance
          ? (secondTokenBalance - (fees ?? 0) - 20).toString()
          : ''
      );
    } else {
      setSecondTokenAmount(
        secondTokenBalance ? secondTokenBalance.toString() : ''
      );
    }
    updateFirstTokenAmount(secondTokenBalance as number);
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
      <div
        className={clsx(
          'flex flex-row justify-between p-4 border border-[#727272] rounded-lg',
          document.activeElement === refFirstInput.current &&
            'border-primaryGreen'
        )}
      >
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
                <span>{`${firstTokenBalance.toFixed(6)} ${token0}`}</span>
              )}
            </p>
            <button
              onClick={handleMaxFirstToken}
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
              autoFocus
              ref={refFirstInput}
            />
          </div>
        </div>
      </div>
      <span className="text-center select-none">+</span>
      {/* TUR Container */}
      <div
        className={clsx(
          'flex flex-row justify-between p-4 border border-[#727272] rounded-lg',
          document.activeElement === refSecondInput.current &&
            'border-primaryGreen'
        )}
      >
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
                <span>{`${secondTokenBalance.toFixed(6)} ${token1}`}</span>
              )}
            </p>
            <button
              onClick={handleMaxSecondToken}
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
              onChange={handleChangeSecondTokenAmount}
              value={secondTokenAmount}
              ref={refFirstInput}
            />
          </div>
        </div>
      </div>
      {/* Fee */}
      <div className="flex flex-col gap-y-5 pr-[19px] text-sm leading-[19px]">
        {fees !== null ? (
          <div className="flex flex-row justify-between">
            <p className="inline-flex items-center">Fee</p>
            <p>{fees.toFixed(3)} MGR</p>
          </div>
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
            parseFloat(secondTokenAmount) > (secondTokenBalance as number)
          }
          text={
            parseFloat(firstTokenAmount) > (firstTokenBalance as number) ||
            parseFloat(secondTokenAmount) > (secondTokenBalance as number)
              ? 'Not enough funds'
              : 'Confirm'
          }
          onClick={() => {
            setConfig({
              firstTokenAmount: parseFloat(firstTokenAmount),
              secondTokenAmount: parseFloat(secondTokenAmount),
              fees: fees as number,
            });
            setIsOpen(false);
            setIsModalOpen(true);
          }}
        />
        <Button
          type="transparent"
          text="Go Back"
          onClick={() => {
            setIsOpen(false);
          }}
        />
      </div>
    </div>
  );
};

export default AddLiquidityTab;
