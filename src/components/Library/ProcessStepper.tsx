import type { FC } from 'react';
import { Stepper } from 'react-form-stepper';

interface Props {
  activeStep: number;
  steps: { label: string }[];
}

const ProcessStepper: FC<Props> = ({ activeStep, steps }) => {
  return (
    <Stepper
      activeStep={activeStep}
      className="text-white"
      connectorStateColors
      connectorStyleConfig={{
        size: 1.5,
        activeColor: '#A2A2A2',
        completedColor: '#FFFFFF',
        disabledColor: '#A2A2A2',
        style: 'solid',
      }}
      styleConfig={{
        activeBgColor: '#242424',
        completedBgColor: '#96E7D7',
        disabledBgColor: '#8A8A8A',
        activeTextColor: '#FFFFFF',
        completedTextColor: '#96E7D7',
        inactiveTextColor: '#A2A2A2',
        disabledTextColor: '#A2A2A2',
        inactiveBgColor: '#e0e0e0',
        fontWeight: 'normal',
        size: '1.5em',
        circleFontSize: '0rem',
        labelFontSize: '0.875rem',
        borderRadius: '50%',
      }}
      steps={steps}
    >
    </Stepper>
  );
};

export default ProcessStepper;
