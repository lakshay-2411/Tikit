import React from "react";

export default function TicketCard({ event }) {
  return (
    <div className="border rounded-lg p-4 shadow-lg">
      <img src={event.image} alt={event.name} className="w-full h-40 object-cover rounded-md" />
      <h2 className="text-xl font-bold mt-2">{event.name}</h2>
      <p className="text-gray-600">{event.description}</p>
      <p className="mt-1">Price: {event.basePrice} ETH</p>
      <p>Max Participants: {event.maxParticipants}</p>
      <p>Current Supply: {event.currentSupply}</p>
    </div>
  );
}
