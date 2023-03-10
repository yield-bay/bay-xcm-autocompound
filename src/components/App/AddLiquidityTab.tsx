import { useAtom } from 'jotai';
import Image from 'next/image';
import { useState } from 'react';
import AmountInput from '@components/Library/AmountInput';
import Button from '@components/Library/Button';
import ProcessStepper from '@components/Library/ProcessStepper';
import Tooltip from '@components/Library/Tooltip';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { mainModalOpenAtom } from '@store/commonAtoms';
import { formatTokenSymbols, replaceTokenSymbols } from '@utils/farmMethods';
import { TabProps } from '@utils/types';
import CircleLoader from '@components/Library/Loader';

const AddLiquidityTab = ({ farm, account }: TabProps) => {
  const [, setOpen] = useAtom(mainModalOpenAtom);

  // Amount States
  const [mgxAmount, setMgxAmount] = useState('');
  const [turAmount, setTurAmount] = useState('');
  // Process States
  const [isInProcess, setIsInProcess] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const mgxBalance = 0.3345; // temperory amount
  const turBalance = 0.3345; // temperory amount
  const isInsufficientBalance =
    mgxBalance < parseFloat(mgxAmount) || turBalance < parseFloat(turAmount);

  const [fees, setFees] = useState<number>(15.8083);

  const tokenNames = formatTokenSymbols(
    replaceTokenSymbols(farm?.asset.symbol)
  );

  return (
    <div className="w-full flex flex-col gap-y-10 mt-10">
      {/* MGX Container */}
      <div className="flex flex-row justify-between p-4 border border-primaryGreen rounded-lg">
        <div className="flex flex-row gap-x-5 items-center">
          <Image
            src={farm?.asset.logos[0]}
            alt={tokenNames[0]}
            height={32}
            width={32}
          />
          <span>{tokenNames[0]}</span>
        </div>
        <div className="flex flex-col gap-y-3">
          <div className="flex flex-row justify-end items-center gap-x-3">
            <p className="flex flex-col items-end text-sm leading-[19px] opacity-50">
              <span>Balance</span>
              <span>{mgxBalance}</span>
            </p>
            <button className="p-[10px] rounded-lg bg-baseGray text-base leading-5">
              MAX
            </button>
          </div>
          <div className="text-right">
            <AmountInput value={mgxAmount} onChange={setMgxAmount} />
          </div>
        </div>
      </div>
      <span className="text-center">+</span>
      {/* TUR Container */}
      <div className="flex flex-row justify-between p-4 border border-[#727272] rounded-lg">
        <div className="flex flex-row gap-x-5 items-center">
          <Image
            src={farm?.asset.logos[1]}
            alt={tokenNames[1]}
            height={32}
            width={32}
          />
          <span>{tokenNames[1]}</span>
        </div>
        <div className="flex flex-col gap-y-3">
          <div className="flex flex-row justify-end items-center gap-x-3">
            <p className="flex flex-col items-end text-sm leading-[19px] opacity-50">
              <span>Balance</span>
              <span>{turBalance}</span>
            </p>
            <button className="p-[10px] rounded-lg bg-baseGray text-base leading-5">
              MAX
            </button>
          </div>
          <div className="text-right">
            <AmountInput value={turAmount} onChange={setTurAmount} />
          </div>
        </div>
      </div>
      {/* Fee and Share */}
      <div className="flex flex-col gap-y-5 pr-[19px] text-sm leading-[19px]">
        <div className="flex flex-row justify-between">
          <p className="inline-flex items-center">
            Fee
            <Tooltip content={<span>This is it</span>}>
              <QuestionMarkCircleIcon className="ml-2 h-5 w-5 opacity-50" />
            </Tooltip>
          </p>
          <p>{fees} MGX</p>
        </div>
        <div className="flex flex-row justify-between">
          <p className="inline-flex items-center">Expected Share of Pool</p>
          <p>&lt;0.001%</p>
        </div>
      </div>
      {/* Buttons */}
      <div className="flex flex-col gap-y-2">
        {isInsufficientBalance ? (
          <Button type="disabled" text="Insufficient Balance" />
        ) : (
          <Button type="primary" text="Confirm" onClick={() => {}} />
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
          activeStep={2}
          steps={[
            { label: 'Confirm' },
            { label: 'Sign' },
            { label: 'Complete' },
          ]}
        />
      )}
      {isInProcess && (
        <div className="flex flex-row px-4 items-center justify-center text-base leading-[21.6px] bg-baseGray rounded-lg py-10 text-center">
          {(isSigning || !isSuccess) && <CircleLoader />}
          {isSigning && (
            <span className="ml-6">
              Please sign the transaction in your wallet.
            </span>
          )}
          {isSuccess && (
            <p>
              Liquidity Added: {mgxAmount} MGX with {turAmount} TUR. Check your
              hash{' '}
              <a href="#" className="underline underline-offset-4">
                here
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AddLiquidityTab;
