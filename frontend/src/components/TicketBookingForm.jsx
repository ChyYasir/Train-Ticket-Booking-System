import { useState } from "react";

const TicketBookingForm = ({ selectedTrain }) => {
  const [passengerName, setPassengerName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle booking logic here (e.g., make API call)
    alert(`Booking ticket for ${passengerName} on ${selectedTrain.name}`);
  };

  return (
    <form className="p-4" onSubmit={handleSubmit}>
      <h2 className="text-lg">Booking Form for {selectedTrain.name}</h2>
      <input
        type="text"
        placeholder="Enter your name"
        value={passengerName}
        onChange={(e) => setPassengerName(e.target.value)}
        className="border p-2 w-full mt-2"
        required
      />
      <button type="submit" className="bg-blue-600 text-white p-2 mt-2">
        Book Ticket
      </button>
    </form>
  );
};

export default TicketBookingForm;
