import React, { useState } from 'react';
import Login from './Login';
import TrainSearch from './TrainSearch';
import SeatSelection from './SeatSelection';
import BookingConfirmation from './BookingConfirmation';

const Home = () => {
    const [user, setUser] = useState(null);
    const [trains, setTrains] = useState([]);
    const [selectedTrain, setSelectedTrain] = useState(null);
    const [seats, setSeats] = useState([]);
    const [booking, setBooking] = useState(null);

    const handleLogin = (credentials) => {
        // Handle user login and set user state
        setUser({ name: credentials.email });
    };

    const handleSearch = (searchParams) => {
        // Mock API call to get trains based on route and date
        setTrains([{ train_id: 1, name: 'Express Train', route: searchParams.route, schedule: '10:00 AM', number_of_seats: 100 }]);
    };

    const handleSelectTrain = (train) => {
        // Mock API call to get seats for selected train
        setSelectedTrain(train);
        setSeats([
            { seat_id: 'A1', train_id: train.train_id, coach_number: 1, status: 'available' },
            { seat_id: 'A2', train_id: train.train_id, coach_number: 1, status: 'reserved' },
            // ... more seats
        ]);
    };

    const handleSelectSeat = (seat) => {
        // Mock booking logic
        const bookingDetails = {
            booking_id: '12345',
            user_id: user._id,
            train_id: selectedTrain.train_id,
            seat_id: seat.seat_id,
            booking_status: 'confirmed',
        };
        setBooking(bookingDetails);
    };

    return (
        <div className='flex flex-col justify-center items-center h-screen'>
            <TrainSearch onSearch={handleSearch} />
            {trains.length > 0 && (
                <div>
                    <h2 className="text-xl mb-4">Trains</h2>
                    {trains.map((train) => (
                        <button key={train.train_id} onClick={() => handleSelectTrain(train)} className="block p-2 border mb-2">
                            {train.name} - {train.schedule}
                        </button>
                    ))}
                </div>
            )}
            {selectedTrain && <SeatSelection seats={seats} onSelectSeat={handleSelectSeat} />}
            {booking && <BookingConfirmation booking={booking} />}
        </div>
    );
};


export default Home;