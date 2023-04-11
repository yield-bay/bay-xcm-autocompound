import { FC } from 'react';
import BasicTags from './Tags/BasicTags';
import SEOTags from './Tags/SEOTags';

interface Props {
  title?: string | undefined;
  description?: string | undefined;
  image?: string | undefined;
  url?: string | undefined;
  username?: string | undefined;
}

const MetaTags: FC<Props> = (props) => {
  return (
    <>
      <BasicTags />
      <SEOTags {...props} />
    </>
  );
};

export default MetaTags;
