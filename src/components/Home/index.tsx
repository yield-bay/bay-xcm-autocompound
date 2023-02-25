import { createRef, useState } from 'react';
import _ from 'lodash';
import Header from '@components/Header';
import LiquidityToken from '@components/Library/LiquidityToken';

const Home = () => {
  const [selectedToken, setSelectedToken] = useState('MGX-TUR');
  const [tokenAmount, setTokenAmount] = useState(0);

  const onTokenSelectChange = (value: any) => {
    const selected = value.target.value;
    setSelectedToken(selected);
  };

  const handleTokenAmount = (value: any) => {
    const amount = value.target.value;
    setTokenAmount(amount);
  }

  return (
    <div className="min-h-screen w-full">
      <Header />
      <main>
        <div className="max-w-sm m-10">
          <label
            htmlFor="pool"
            className="block text-sm font-medium text-gray-700"
          >
            Select a Liquidity Pool
          </label>
          <select
            id="pool"
            name="pool"
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            onChange={onTokenSelectChange}
            placeholder="Select a Liquidity Pool"
          >
            <option value="MGX-TUR">
              <LiquidityToken firstTokenSymbol="MGX" secondTokenSymbol="TUR" />
            </option>
            <option value="TUR-KSM">
              <LiquidityToken firstTokenSymbol="TUR" secondTokenSymbol="KSM" />
            </option>
            <option value="MGX-KSM">
              <LiquidityToken firstTokenSymbol="MGX" secondTokenSymbol="KSM" />
            </option>
          </select>
          <label htmlFor="amount">Enter a token amount</label>
          <input
            type="number"
            onChange={handleTokenAmount}
            name="amount"
            id="amount"
            className="block w-full rounded-md border py-2 px-4 border-gray-300 pr-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="0"
          />
        </div>
        <button onClick={() => {
          console.log('selectedToken', selectedToken);
          console.log('tokenAmount', tokenAmount);
        }}>submit</button>
      </main>
    </div>
  );
};

export default Home;
