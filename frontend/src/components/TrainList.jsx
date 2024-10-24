const TrainList = ({ trains, onSelectTrain }) => {
    return (
      <div className="p-4">
        <h2 className="text-lg">Available Trains</h2>
        <ul className="mt-2">
          {trains.map((train) => (
            <li key={train.id} className="border p-2 my-2 cursor-pointer" onClick={() => onSelectTrain(train)}>
              {train.name} - {train.route}
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  export default TrainList;
  