import { Spinner } from '@chakra-ui/react';

const Loader = () => {
  return (
    <Spinner
      aria-hidden="true"
      size="md"
      color="white"
      thickness="2px"
      emptyColor="#242424"
      speed="0.65s"
    />
  );
};

export default Loader;
