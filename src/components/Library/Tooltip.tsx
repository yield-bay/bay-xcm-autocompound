import { Tooltip as TooltipChakra } from '@chakra-ui/react';
import { FC } from 'react';

interface Props {
  label: string;
  children: JSX.Element;
}

/**
 * Tooltips display informative text when users hover, focus on, or tap an element.
 * @param label - The text to be displayed in the tooltip
 * @param children - The element to be wrapped by the tooltip
 */
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
