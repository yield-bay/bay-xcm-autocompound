import { useState, Fragment, ReactNode, FC } from 'react';
import { Transition, Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  title?: ReactNode;
  open: boolean;
  setOpen: (value: boolean) => void;
  children: ReactNode | ReactNode[];
}

const ModalWrapper: FC<Props> = ({ title, open, setOpen, children }) => {
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
              <Dialog.Panel className="border border-baseGray w-full max-w-fit bg-baseGrayDark text-white text-base font-bold leading-5 transform overflow-hidden rounded-2xl px-3 py-6 sm:px-12 sm:py-[60px] text-left align-middle shadow-xl transition-all">
                <div className="absolute top-0 right-0 pt-[60px] pr-12">
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
                </div>
                {title && <Dialog.Title as="h3">{title}</Dialog.Title>}
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
