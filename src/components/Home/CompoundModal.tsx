import { FC, useState } from 'react';
import ModalWrapper from '../Library/ModalWrapper';
import { useAtom } from 'jotai';
import { compoundModalOpenAtom } from '@store/commonAtoms';
import clsx from 'clsx';
import Image from 'next/image';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import Button from '@components/Library/Button';
import AmountInput from '@components/Library/AmountInput';
import Tooltip from '@components/Library/Tooltip';
import Loader from '@components/Library/Loader';
import ProcessStepper from '@components/Library/ProcessStepper';

const tabs = [
  { name: 'Compound', id: 0 },
  { name: 'Add Liquidity', id: 1 },
  { name: 'Remove Liquidity', id: 2 },
];

interface Props {
  //
}

const CompoundTab = () => {
  return (
    <div className="w-full border">
      <p>Hello Let's compound together</p>
    </div>
  );
};

const AddLiquidityTab = () => {
  const [, setOpen] = useAtom(compoundModalOpenAtom);
  // Amount States
  const [mgxAmount, setMgxAmount] = useState('');
  const [turAmount, setTurAmount] = useState('');
  // Process States
  const [isInProcess, setIsInProcess] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const mgxBalance = 0.3345; // temperory amount
  const turBalance = 0.3345; // temperory amount
  const inSufficientBalance =
    mgxBalance < parseFloat(mgxAmount) || turBalance < parseFloat(turAmount);

  return (
    <div className="w-full flex flex-col gap-y-10 mt-10">
      {/* MGX Container */}
      <div className="flex flex-row justify-between p-4 border border-primaryGreen rounded-lg">
        <div className="flex flex-row gap-x-5 items-center">
          <Image src="/image/mgx.svg" alt="MGX Token" height={32} width={32} />
          <span>MGX</span>
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
          <Image src="/image/tur.png" alt="TUR Token" height={32} width={32} />
          <span>TUR</span>
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
          <p>{'15.8083'} MGX</p>
        </div>
        <div className="flex flex-row justify-between">
          <p className="inline-flex items-center">Expected Share of Pool</p>
          <p>&lt;0.001%</p>
        </div>
      </div>
      {/* Buttons */}
      <div className="flex flex-col gap-y-2">
        {inSufficientBalance ? (
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
          {(isSigning || !isSuccess) && <Loader />}
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

const RemoveLiquidityTab = () => {
  const [percentage, setPercentage] = useState<string>('');
  const [isVerify, setIsVerify] = useState<boolean>(false);
  const [, setOpen] = useAtom(compoundModalOpenAtom);

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
                  src={'/image/mgx.svg'}
                  alt="MGX Token"
                  height={32}
                  width={32}
                />
                <span className="ml-5">MGX</span>
              </p>
              <p className="text-base leading-[21.6px]">{'0.1'} MGX</p>
            </div>
            <div className="inline-flex w-full justify-between items-center">
              <p className="inline-flex items-center">
                <Image
                  src={'/image/tur.png'}
                  alt="TUR Token"
                  height={32}
                  width={32}
                />
                <span className="ml-5">TUR</span>
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
          <div className="inline-flex gap-x-2">
            <Button
              type="primary"
              text={`Yes, Remove ${percentage}%`}
              className="w-2/3 bg-warningRed hover:bg-[#e53c3c] text-white"
            />
            <Button
              type="secondary"
              text="Go Back"
              className="w-1/3"
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

const TabContent = ({ currentTab }: { currentTab: number }) => {
  switch (currentTab) {
    case 0:
      return <CompoundTab />;
    case 1:
      return <AddLiquidityTab />;
    case 2:
      return <RemoveLiquidityTab />;
    default:
      return <CompoundTab />;
  }
};

const CompoundModal: FC<Props> = () => {
  const [open, setOpen] = useAtom(compoundModalOpenAtom);
  const [currentTab, setCurrentTab] = useState(1);

  return (
    <ModalWrapper open={open} setOpen={setOpen}>
      {/* DESKTOP */}
      <div className="hidden sm:block">
        <nav className="inline-flex justify-between w-full" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setCurrentTab(tab.id)}
              className={clsx(
                tab.id == currentTab
                  ? 'ring-1 ring-primaryGreen  px-4'
                  : 'opacity-40',
                'rounded-md px-4 py-[10px] transition duration-300 ease-in-out'
              )}
              aria-current={tab.id ? 'page' : undefined}
            >
              {tab.name}
            </button>
          ))}
        </nav>
        <TabContent currentTab={currentTab} />
      </div>
    </ModalWrapper>
  );
};

export default CompoundModal;
