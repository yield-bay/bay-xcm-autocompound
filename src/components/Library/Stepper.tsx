import { FC } from 'react';
import clsx from 'clsx';

interface Props {
  activeStep: number;
  steps: {
    label: string;
  }[];
}

const Stepper: FC<Props> = ({ activeStep, steps }) => {
  return (
    <div className="inline-flex justify-between w-full text-xl leading-7 select-none">
      {steps.map((step, index) => (
        <div
          key={index}
          className={clsx(
            activeStep === index
              ? 'animate-pulse duration-100'
              : index < activeStep
              ? 'opacity-100'
              : 'opacity-30'
          )}
        >
          <span>{step.label}</span>
        </div>
      ))}
    </div>
  );
};

export default Stepper;
