import React from 'react';

const SeatSelection = ({ seats, onSelectSeat }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Select a Seat</h2>
      <div className="grid grid-cols-4 gap-4">
        {seats.map((seat) => (
          <button
            key={seat.seat_id}
            className={`p-2 border rounded ${seat.status === 'available' ? 'bg-green-200' : 'bg-red-200 cursor-not-allowed'}`}
            onClick={() => seat.status === 'available' && onSelectSeat(seat)}
            disabled={seat.status !== 'available'}
          >
            {seat.seat_id}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SeatSelection;
