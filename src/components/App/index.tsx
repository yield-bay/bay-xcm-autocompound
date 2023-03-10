import { useEffect, useState } from 'react';
import _ from 'lodash';
import { fetchFarms } from '@utils/api';
import { filterMGXFarms } from '@utils/farmMethods';
import { FarmType } from '@utils/types';
import FarmsList from './FarmsList';
import SearchInput from '@components/Library/SearchInput';
import useFilteredFarms from '@hooks/useFilteredFarms';

const App = () => {
  const [farms, setFarms] = useState<FarmType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [filteredFarms, noFilteredFarms] = useFilteredFarms(farms, searchTerm);

  useEffect(() => {
    (async () => {
      try {
        const { farms } = await fetchFarms();
        const filteredFarms = filterMGXFarms(farms); // Filter farms with MGX token
        setFarms(filteredFarms);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  return (
    <main className="min-w-full bg-baseGrayMid rounded-t-3xl py-14">
      <div className="max-w-[1138px] mx-auto">
        <div className="items-center w-full justify-center sm:justify-end lg:justify-center">
          <SearchInput term={searchTerm} setTerm={setSearchTerm} />
        </div>
        <FarmsList farms={filteredFarms} noFarms={noFilteredFarms} />
      </div>
    </main>
  );
};

export default App;
