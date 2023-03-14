import { APP_NAME } from '@utils/constants';
import type { FC } from 'react';

type LinkProps = {
  title: string;
  link: string;
};

const Footer: FC = () => {
  const ecosystem: LinkProps[] = [
    {
      title: 'Home',
      link: 'https://www.yieldbay.io/',
    },
    {
      title: 'Farms List',
      link: 'https://list.yieldbay.io/',
    },
    {
      title: 'XCM Autocompounder',
      link: '#',
    },
  ];

  const community: LinkProps[] = [
    {
      title: 'Twitter',
      link: 'https://twitter.com/yield_bay',
    },
    {
      title: 'Discord',
      link: 'https://discord.gg/AKHuvbz7q4',
    },
    {
      title: 'Docs',
      link: 'https://docs.yieldbay.io/',
    },
    {
      title: 'Github',
      link: 'https://github.com/yield-bay/',
    },
  ];

  return (
    <footer className="text-white" aria-labelledby="footer-heading">
      <div className="max-w-6xl p-9 sm:py-12 sm:px-6 md:px-20 lg:py-14 lg:px-[121px]">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16">
          {/* LEFT SIDE */}
          <div className="sm:p-[10px] sm:pl-0">
            <div className="flex items-center justify-between">
              <span className="text-2xl sm:text-[32px] leading-[37.12px]">
                {APP_NAME}
              </span>
            </div>
            <div className="pt-8 pb-6 sm:py-9 text-xs sm:text-base leading-4 sm:leading-5 font-medium">
              <p>Yield Farming hub for the Polkadot &amp; Kusama Parachains.</p>
              <p className="mt-4">
                Discover yield farms, deposit liquidity and earn rewards in the
                interoperable, multi-chain paraverse of Polkadot and Kusama.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="grid grid-cols-2 md:gap-14 py-[15px]">
            <div className="mt-0 xl:mt-0">
              <p className="text-base leading-3 tracking-[0.115em] uppercase">
                Ecosystem
              </p>
              <ul role="list" className="mt-4 space-y-4 text-base leading-4">
                {ecosystem.map((ele, index) => (
                  <List key={index} title={ele.title} link={ele.link} />
                ))}
              </ul>
            </div>
            <div className="md:mt-0">
              <p className="text-base leading-3 tracking-[0.115em] uppercase">
                Community
              </p>
              <ul role="list" className="mt-4 space-y-4 text-base leading-4">
                {community.map((ele, index) => (
                  <List key={index} title={ele.title} link={ele.link} />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const List = ({ title, link }: LinkProps): any => {
  return (
    <li>
      <a
        href={link}
        className="inline-flex hover:text-primaryGreen"
        target="_blank"
        rel="noreferrer"
      >
        {title}
      </a>
    </li>
  );
};

export default Footer;
