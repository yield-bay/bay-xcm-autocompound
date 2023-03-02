import { NextPage } from 'next';
import { FarmType } from '@utils/types';
import { useEffect, useState } from 'react';
import { fetchFarms } from '@utils/api';
import { filterMGXFarms } from '@utils/farmMethods';
import FarmCard from '@components/Home/FarmCard';

const TeamPage: NextPage = () => {
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
    <div className="flex flex-col gap-y-[25px] bg-baseGrayMid items-center py-24 font-bold">
      {farms.length > 0 ? (
        farms.map((farm, index) => <FarmCard farm={farm} key={index} />)
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default TeamPage;
