import { useParams } from 'react-router-dom';  // For getting the fort ID from the URL
import { useState, useEffect } from 'react';    // For handling state and side effects
import { getFortById } from '../api/forts';     // Import the function to fetch fort data

const FortDetailPage = () => {
  const { id } = useParams();  // Get the ID of the fort from the URL
  const [fortData, setFortData] = useState(null);  // State to store the fort data
  const [isLoading, setIsLoading] = useState(true);  // Loading state to show loading message

  useEffect(() => {
    getFortById(id)  // Call the function to fetch fort data by ID
      .then((data) => {
        setFortData(data);  // Store the fort data
        setIsLoading(false);  // Set loading to false after data is fetched
      })
      .catch((error) => {
        console.error('Error fetching fort data:', error);  // Handle any errors
        setIsLoading(false);  // Stop loading even if there's an error
      });
  }, [id]);  // Only run this effect when the 'id' changes

  if (isLoading) return <div>Loading...</div>;  // Display loading until the data is fetched
  if (!fortData) return <div>Fort not found</div>;  // If no data found, show an error message

  return (
    <div>
      <h1>{fortData.name}</h1>
      <p><strong>History:</strong> {fortData.history}</p>
      <img
          src="frontend/src/assets/golkonda.png"/>

      
      
    </div>
  );
};

export default FortDetailPage;
