import Image from 'next/image';
import { useEffect, useState } from 'react';

const DownSignal = () => {
  const [windowheight, setWindowHeight] = useState(0);
  useEffect(() => {
    setWindowHeight(window.innerHeight);
    console.log('windowheight', window.innerHeight);
  }, []);

  return (
    <div
      className={`fixed p-[10px] rounded-full shadow-lg -right-[90px] top-[calc(100vh-100px)] bg-white w-fit h-fit`}
    >
      <Image
        src="/icons/ArrowDown.svg"
        alt="Arrow Down"
        width={28}
        height={28}
        className="text-[#1C1C1C]"
      />
    </div>
  );
};
export default DownSignal;
