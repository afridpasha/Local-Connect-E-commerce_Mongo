import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './SellBuy.css';

const SellBuy = () => {
  const navigate = useNavigate();
  const { sectorId } = useParams();
  
  // Map event types to their form routes
  const formRoutes = {
    concert: '/tickets/concert/form',
    sports: '/tickets/sports/form',
    theater: '/tickets/theater/form',
    festival: '/tickets/festivals/form'
  };
  
  // Map event types to their display routes
  const displayRoutes = {
    concert: '/tickets/concert',
    sports: '/tickets/sports',
    theater: '/tickets/theater',
    festival: '/tickets/festival'
  };
  
  const handleSell = () => {
    // Navigate to the appropriate form route
    navigate(formRoutes[sectorId]);
  };
  
  const handleBuy = () => {
    // Navigate to the appropriate display route
    navigate(displayRoutes[sectorId]);
  };
  
  // Get the title based on sector ID
  const getTitle = () => {
    const titles = {
      concert: 'Concert Tickets',
      sports: 'Sports Tickets',
      theater: 'Theater Tickets',
      festival: 'Festival Tickets'
    };
    
    return titles[sectorId] || 'Event Tickets';
  };
  
  return (
    <div className="sellbuy-container">
      <h2>{getTitle()}</h2>
      <div className="options-container">
        <button 
          className="sellbuy-button sell-button" 
          onClick={handleSell}
        >
          <span className="button-icon">💰</span>
          <span>Sell</span>
        </button>
        
        <button 
          className="sellbuy-button buy-button" 
          onClick={handleBuy}
        >
          <span className="button-icon">🛒</span>
          <span>Buy</span>
        </button>
      </div>
    </div>
  );
};

export default SellBuy; 
