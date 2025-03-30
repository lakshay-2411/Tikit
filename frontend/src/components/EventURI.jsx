import React from 'react';
import { useContractRead, useReadContract } from 'wagmi';
import EventTicketABI from '../constants/EventTicketAbi.json';
import { eventTicketAddress as contractAddress } from '../constants/constant.jsx';

const EventURIComponent = ({ eventId }) => {
  const { data: eventURI, error, isLoading } = useReadContract({
    address: contractAddress,
    abi: EventTicketABI,
    functionName: 'getEventURI',
    args: [eventId],  // Ensure eventId is passed correctly
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <p>Event URI: <a href={eventURI} target="_blank" rel="noopener noreferrer">{eventURI}</a></p>
      {eventURI ? (
        <img src={eventURI} alt="Event Image" style={{ maxWidth: '100%' }} />
      ) : (
        <p>No image found for this event.</p>
      )}
    </div>
  );
};

export default EventURIComponent;
