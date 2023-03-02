import { useEffect, useState } from 'react';
import _ from 'lodash';
import Header from '@components/Common/Header';
import { fetchFarms } from '@utils/api';
import { filterMGXFarms } from '@utils/farmMethods';
import { FarmType } from '@utils/types';
import FarmsList from './FarmsList';

const Home = () => {
  const [farms, setFarms] = useState<FarmType[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { farms } = await fetchFarms();
        const filteredFarms = filterMGXFarms(farms);
        setFarms(filteredFarms);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen w-full">
      <Header />
      <main className="min-w-full bg-baseGrayMid rounded-t-3xl">
        <FarmsList farms={farms} />
      </main>
    </div>
  );
};

export default Home;
