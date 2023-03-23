import Head from 'next/head';
import {
  SITE_NAME,
  APP_NAME,
  DESCRIPTION,
  DOMAIN,
  IMAGE,
  USERNAME,
} from '@utils/constants';

export default function SEOTags({
  title = APP_NAME,
  description = DESCRIPTION,
  image = IMAGE,
  url = DOMAIN,
  username = USERNAME,
}) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta
        name="keywords"
        content="auto-compounder, defi, polkadot, dotsama, polkadot defi, mangata, mangatax, turing, kusama"
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:site" content={APP_NAME} />
      <meta name="twitter:image" content={image} />
      <meta property="twitter:creator" content={username} />
    </Head>
  );
}
