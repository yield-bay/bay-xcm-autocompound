import { FC, useState } from 'react';
import { TabProps } from '@utils/types';
import { useAtom } from 'jotai';
import { mainModalOpenAtom } from '@store/commonAtoms';
import Tooltip from '@components/Library/Tooltip';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import RadioButton from '@components/Library/RadioButton';
import Button from '@components/Library/Button';

const CompoundTab: FC<TabProps> = ({ farm, account }) => {
  const [, setOpen] = useAtom(mainModalOpenAtom);

  const [frequency, setFrequency] = useState<number>(1);
  const [duration, setDuration] = useState<number>(7);
  const [percentage, setPercentage] = useState<number>(10);

  return (
    <div className="w-full flex flex-col gap-y-10 mt-10 text-xl leading-[27px]">
      <div>
        <p className="inline-flex items-center mb-8">
          Frequency
          <Tooltip content={<span>Frequency of auto-compounding</span>}>
            <QuestionMarkCircleIcon className="h-5 w-5 opacity-50 ml-3" />
          </Tooltip>
        </p>
        <div className="flex flex-row gap-x-8">
          <RadioButton
            changed={setFrequency}
            isSelected={frequency === 1}
            label="Day"
            value={1}
          />
          <RadioButton
            changed={setFrequency}
            isSelected={frequency === 7}
            label="Week"
            value={7}
          />
          <RadioButton
            changed={setFrequency}
            isSelected={frequency === 30}
            label="Month"
            value={30}
          />
        </div>
      </div>
      <div>
        <p className="inline-flex items-center mb-8">
          Duration
          <Tooltip content={<span>Duration of auto-compounding</span>}>
            <QuestionMarkCircleIcon className="h-5 w-5 opacity-50 ml-3" />
          </Tooltip>
        </p>
        <div className="flex flex-row gap-x-8">
          <RadioButton
            changed={setDuration}
            isSelected={duration === 7}
            label="1 Week"
            value={7}
          />
          <RadioButton
            changed={setDuration}
            isSelected={duration === 30}
            label="1 Month"
            value={30}
          />
        </div>
      </div>
      <div>
        <p className="inline-flex items-center mb-8">
          Percentage
          <Tooltip
            content={<span>Percentage of liquidity to auto-compound</span>}
          >
            <QuestionMarkCircleIcon className="h-5 w-5 opacity-50 ml-3" />
          </Tooltip>
        </p>
        <div className="flex flex-row gap-x-8">
          <RadioButton
            changed={setPercentage}
            isSelected={percentage === 10}
            label="10%"
            value={10}
          />
          <RadioButton
            changed={setPercentage}
            isSelected={percentage === 25}
            label="25%"
            value={25}
          />
          <RadioButton
            changed={setPercentage}
            isSelected={percentage === 35}
            label="35%"
            value={35}
          />
          <RadioButton
            changed={setPercentage}
            isSelected={percentage === 45}
            label="45%"
            value={45}
          />
        </div>
      </div>
      {/* Card box to show current and effective APY */}
      <div className="inline-flex justify-between w-full rounded-lg bg-[#1C1C1C] py-6 px-9">
        <div className="flex flex-col items-center gap-y-3">
          <p className="text-xl font-medium opacity-60">Current APY</p>
          <p className="text-2xl">45%</p>
        </div>
        <div className="flex flex-col items-center gap-y-3">
          <p className="text-xl font-medium opacity-60">Effective APY</p>
          <p className="text-2xl">45%</p>
        </div>
      </div>
      <p className="text-base leading-[21.6px] font-medium text-center text-[#B9B9B9]">
        Costs <span className="text-white">$45</span> including Gas Fees + 0.5%
        Comission
      </p>
      <div className="flex flex-col gap-y-2">
        <Button text="Autocompound" type="primary" />
        <Button
          text="Cancel"
          type="secondary"
          onClick={() => {
            setOpen(false);
          }}
        />
      </div>
    </div>
  );
};

export default CompoundTab;
