import React from 'react';

const BookingConfirmation = ({ booking }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Booking Confirmation</h2>
      <p>Booking ID: {booking.booking_id}</p>
      <p>Train ID: {booking.train_id}</p>
      <p>Seat ID: {booking.seat_id}</p>
      <p>Status: {booking.booking_status}</p>
    </div>
  );
};

export default BookingConfirmation;
