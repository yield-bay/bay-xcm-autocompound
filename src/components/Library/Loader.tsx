import { Spinner } from '@chakra-ui/react';

interface Props {
  size: 'sm' | 'md' | 'lg' | 'xl' | 'xs';
}

const Loader = ({ size = 'md' }: Props) => {
  return (
    <Spinner
      aria-hidden="true"
      size={size}
      color="white"
      thickness="2px"
      emptyColor="#242424"
      speed="0.65s"
    />
  );
};

export default Loader;
