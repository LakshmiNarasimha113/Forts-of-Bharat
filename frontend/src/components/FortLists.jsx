import { Link } from 'react-router-dom';

function FortList({ forts }) {
  return (
    <div className="fort-list">
      {forts.map((fort) => (
        <div key={fort._id} className="fort-card">
          <h3>
          <Link to={`/forts/${fort._id}`}>View Details</Link>


          </h3>
          <p>{fort.description}</p>
        </div>
      ))}
    </div>
  );
}

export default FortList;
