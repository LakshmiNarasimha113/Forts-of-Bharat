import axios from 'axios';

// Fetch forts by state

// Fetch fort by slug
export const getFortBySlug = async (slug) => {
  const res = await axios.get(`http://localhost:5000/api/forts/${slug}`);
  return res.data;
};
