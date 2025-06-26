import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getFortsByState } from '../api/forts'; // ✅ You’ll define this next
import { Link } from 'react-router-dom';

const StatePage = () => {
  const { stateName } = useParams();
  const [forts, setForts] = useState([]);

  useEffect(() => {
    const fetchForts = async () => {
      try {
        const data = await getFortsByState(stateName);
        setForts(data);
      } catch (err) {
        console.error('Error fetching forts:', err);
      }
    };
    fetchForts();
  }, [stateName]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Forts in {stateName}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forts.map(fort => (
          <div key={fort._id} className="p-4 border rounded-lg shadow">
            <h2 className="text-xl font-semibold">
              <Link to={`/fort/${fort._id}`} className="text-blue-600 hover:underline">
                {fort.name}
              </Link>
            </h2>
            <p className="text-gray-700">{fort.description?.slice(0, 100)}...</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatePage;
