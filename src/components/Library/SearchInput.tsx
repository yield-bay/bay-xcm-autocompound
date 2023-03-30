import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { FC, useRef, useState } from 'react';
import useKeyPress from '@hooks/useKeyPress';
import clsx from 'clsx';

interface Props {
  term: string;
  setTerm(newTerm: string): void;
  disabled?: boolean;
}

const SearchInput: FC<Props> = ({ term, setTerm, disabled = false }) => {
  const [inputFocus, setInputFocus] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useKeyPress(['/'], (event: any) => {
    if (ref.current != null) {
      ref.current.focus();
    }
  });

  useKeyPress(['Escape'], (event: any) => {
    if (ref.current != null) {
      ref.current.blur();
    }
  });

  return (
    <div className="relative flex w-full text-white sm:rounded-lg ring-transparent">
      <div className="absolute pl-10 sm:pl-6 lg:pl-6 left-0 inset-y-0 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="w-3 sm:w-[18px]" aria-hidden="true" />
      </div>
      <input
        type="search"
        id="text"
        value={term}
        autoComplete="off"
        onChange={(event) => {
          setTerm(event.target.value == '/' ? '' : event.target.value);
        }}
        ref={ref}
        onFocus={() => setInputFocus(true)}
        onBlur={() => setInputFocus(false)}
        className={clsx(
          'block w-full pl-20 sm:pl-12 lg:pl-[84px] pr-4 py-6 sm:py-[14px] focus:outline-none focus:ring-primaryGreen focus:ring-[1px] ring-opacity-50 placeholder:text-white placeholder:focus:text-opacity-60 text-sm sm:text-base leading-[17px] sm:leading-5 font-semibold bg-bgBlack border-none text-center outline-none sm:rounded-lg transition duration-200',
          disabled ? 'opacity-50' : 'opacity-100'
        )}
        placeholder="Search by tokens"
        disabled={disabled}
      />
      <div className="absolute hidden md:flex items-center pr-10 right-0 inset-y-0 pointer-events-none">
        <div className="flex px-[9.5px] bg-[#252525] py-[4px] rounded-[4px] max-w-max">
          <span className="text-xs text-[#CECECE] font-medium leading-[14.5px]">
            {!inputFocus ? '/' : 'esc'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SearchInput;
