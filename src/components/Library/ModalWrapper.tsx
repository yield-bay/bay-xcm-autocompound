import { Fragment, ReactNode, FC } from 'react';
import { Transition, Dialog } from '@headlessui/react';
import { satoshiFont } from '@utils/localFont';
import clsx from 'clsx';
// import { XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  open: boolean;
  setOpen: (value: boolean) => void;
  children: ReactNode | ReactNode[];
}

const ModalWrapper: FC<Props> = ({ open, setOpen, children }) => {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => setOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-opacity-25" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={clsx(
                  'flex flex-col gap-y-8 w-full max-w-[600px] font-sans font-bold tracking-wide text-xl leading-[27px] border border-baseGray bg-baseGrayMid text-white transform overflow-hidden rounded-lg p-6 sm:p-12 text-left align-middle shadow-xl transition-all',
                  satoshiFont.variable
                )}
              >
                {/* <div className="absolute top-0 right-0 pt-[60px] pr-12">
                  <div className="flex items-center group rounded-full p-1 hover:bg-neutral-700">
                    <button
                      type="button"
                      className="text-neutral-400 group-hover:text-white focus:outline-none"
                      onClick={() => setOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div> */}
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalWrapper;
