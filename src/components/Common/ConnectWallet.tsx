import { Fragment, type FC } from 'react';
import { Menu, Transition } from '@headlessui/react';
import Image from 'next/image';
import clsx from 'clsx';
import { useAtom } from 'jotai';
import { accountAtom, walletAccountsAtom } from '@store/accountAtoms';
import { walletModalOpenAtom } from '@store/commonAtoms';
import { walletAtom } from '@store/walletAtoms';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface SelectAccountMenuProps {
  children: React.ReactNode;
}

const SelectAccountMenu: FC<SelectAccountMenuProps> = ({ children }) => {
  const [walletAccounts] = useAtom(walletAccountsAtom); // connected accounts in selected wallet
  const [account, setAccount] = useAtom(accountAtom); // selected account
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button>{children}</Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute w-[200px] right-0 top-14 origin-top-right px-4 rounded-b-xl pt-5 bg-white text-[#030303] focus:outline-none">
          {walletAccounts?.map((walletAccount, index) => {
            const active = walletAccount.address === account?.address;
            return (
              <Menu.Item key={index}>
                <button
                  className={clsx(
                    active && 'bg-[#D3D3D3] pointer-events-none',
                    'group flex flex-col gap-y-2 items-start p-3 w-full text-base leading-5 mb-4 rounded-lg overflow-hidden',
                    'hover:bg-[#EFEFEF]'
                  )}
                  onClick={() => setAccount(walletAccount)}
                >
                  <span>{walletAccount.name}</span>
                  <span className="text-[#969696]">
                    {walletAccount.address.slice(0, 5)}...
                    {walletAccount.address.slice(-5)}
                  </span>
                </button>
              </Menu.Item>
            );
          })}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

const ConnectWalletButton: FC = () => {
  const [, setIsOpen] = useAtom(walletModalOpenAtom);
  const [, setWallet] = useAtom(walletAtom); // selected wallet
  const [, setWalletAccounts] = useAtom(walletAccountsAtom); // connected accounts in selected wallet
  const [account, setAccount] = useAtom(accountAtom); // selected account

  // COPY ADDRESS LOGIC
  // const [isCopied, setIsCopied] = useState(false); // copied address to clipboard
  // const timerRef = useRef<null | ReturnType<typeof setTimeout>>(null);

  // useEffect(() => {
  //   // Clear timeout when component unmounts
  //   return () => {
  //     clearTimeout(timerRef.current as ReturnType<typeof setTimeout>);
  //   };
  // }, []);

  return (
    <button
      onClick={account == null ? () => setIsOpen(true) : () => {}}
      className={clsx(
        'flex flex-row h-fit items-center w-[200px] justify-center text-base leading-[22px] bg-white text-black py-6 rounded-lg transition duration-200',
        account == null ? 'hover:bg-offWhite' : 'cursor-default'
      )}
    >
      {account == null ? (
        <span>Connect Wallet</span>
      ) : (
        <div className="inline-flex">
          <span>
            {account.name && account?.name.length > 10
              ? `${account.name.slice(0, 10)}...`
              : account.name}
          </span>
          {/* <div
              className="ml-6 cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(account?.address);
                setIsCopied(true);
                timerRef.current = setTimeout(() => {
                  setIsCopied(false);
                }, 500);
              }}
            >
              {isCopied ? (
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              ) : (
                <Image
                  src="/icons/Copy.svg"
                  alt="copy address"
                  width={24}
                  height={24}
                />
              )}
            </div> */}
          <div className="ml-6">
            <ChevronDownIcon className="w-6 h-6 text-[#797979]" />
          </div>
          <div
            className="ml-3 cursor-pointer"
            onClick={() => {
              // Clear all states to disconnect wallet
              setWallet(null);
              setWalletAccounts(null);
              setAccount(null);
            }}
          >
            <Image
              src="/icons/XCircle.svg"
              alt="disconnect wallet"
              width={24}
              height={24}
            />
          </div>
        </div>
      )}
    </button>
  );
};

const ConnectWallet: FC = () => {
  const [account] = useAtom(accountAtom);
  return (
    <>
      {account == null ? (
        <ConnectWalletButton />
      ) : (
        <SelectAccountMenu>
          <ConnectWalletButton />
        </SelectAccountMenu>
      )}
    </>
  );
};

export default ConnectWallet;
