import { Fragment } from 'react';
import { Menu } from '@headlessui/react';
import { Transition } from '@headlessui/react';
import { Cog8ToothIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const SettingsMenu = () => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button>
        <Cog8ToothIcon className="w-8 h-8 ml-4" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="w-[161px] border border-[#2B2A2A] absolute right-0 mt-2 origin-top-right divide-y divide-[#314584] divide-opacity-40 rounded-xl bg-baseGrayMid focus:outline-none">
          <Menu.Item>
            {({ active }) => (
              <button
                className={clsx(
                  active ? 'text-gray-200' : 'text-primaryGreen',
                  'group flex p-5 w-full items-center font-medium text-base leading-5',
                  'rounded-t-md'
                )}
              >
                Standard Swap
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                className={clsx(
                  active ? 'text-gray-200' : 'text-white',
                  'group flex p-5 w-full items-center font-medium text-base leading-5',
                  'disabled:text-opacity-40 disabed: cursor-not-allowed'
                )}
                disabled
              >
                Stable Swap
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                className={clsx(
                  active ? 'text-gray-200' : 'text-white',
                  'group flex p-5 w-full items-center font-medium text-base leading-5',
                  'rounded-b-md disabled:text-opacity-40 disabed: cursor-not-allowed'
                )}
                disabled
              >
                Single Staking
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default SettingsMenu;
