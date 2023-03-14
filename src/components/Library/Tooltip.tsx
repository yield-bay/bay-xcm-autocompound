import { Tooltip as TooltipChakra } from '@chakra-ui/react';
import { FC } from 'react';

interface Props {
  label: React.ReactNode;
  children: React.ReactNode;
}

const Tooltip: FC<Props> = ({ label, children }) => {
  return (
    <TooltipChakra
      label={label}
      aria-label={`${label} Info`}
      paddingY="12px"
      paddingX="16px"
      fontSize="16px"
      rounded="8px"
      lineHeight="21.6px"
      fontWeight="medium"
      hasArrow={true}
      placement="right"
      bg="#242424"
    >
      {children}
    </TooltipChakra>
  );
};

export default Tooltip;
