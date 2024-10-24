import React, { useState } from 'react';

const TrainSearch = ({ onSearch }) => {
  const [route, setRoute] = useState('');
  const [date, setDate] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // Call your search API here
    onSearch({ route, date });
  };

  return (
    <form className="flex flex-col p-4" onSubmit={handleSearch}>
      <h2 className="text-xl mb-4">Search Trains</h2>
      <input
        type="text"
        placeholder="Route"
        value={route}
        onChange={(e) => setRoute(e.target.value)}
        className="border p-2 mb-4"
        required
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="border p-2 mb-4"
        required
      />
      <button type="submit" className="bg-blue-500 text-white p-2 rounded">
        Search
      </button>
    </form>
  );
};

export default TrainSearch;
