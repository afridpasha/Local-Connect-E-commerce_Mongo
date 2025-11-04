import React from 'react';
import { useParams } from 'react-router-dom';
import ConcertTicketList from './ConcertTicketList';
import SportsTicketList from './SportsTicketList';
import TheaterTicketList from './TheaterTicketList';
import FestivalsTicketList from './FestivalsTicketList';
import { API_BASE_URL } from '../config/api';

const TicketDetailsPage = () => {
  const { sectorId } = useParams();
  
  // Map sectorId to component
  const renderTicketList = () => {
    switch(sectorId) {
      case 'concert':
        return <ConcertTicketList />;
      case 'sports':
        return <SportsTicketList />;
      case 'theater':
        return <TheaterTicketList />;
      case 'festival':
        return <FestivalsTicketList />;
      default:
        return <div className="error-container">Invalid ticket type</div>;
    }
  };

  return (
    <div className="section-container">
      {renderTicketList()}
    </div>
  );
};

export default TicketDetailsPage;
