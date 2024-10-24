import { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import TrainList from "./components/TrainList";
import TicketBookingForm from "./components/TicketBookingForm";

const App = () => {
  const [trains] = useState([
    { id: 1, name: "Train A", route: "City A to City B" },
    { id: 2, name: "Train B", route: "City C to City D" },
  ]);
  const [selectedTrain, setSelectedTrain] = useState(null);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <TrainList trains={trains} onSelectTrain={setSelectedTrain} />
        {selectedTrain && <TicketBookingForm selectedTrain={selectedTrain} />}
      </main>
      <Footer />
    </div>
  );
};

export default App;
