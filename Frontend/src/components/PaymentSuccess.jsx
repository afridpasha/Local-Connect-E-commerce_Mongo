import React, { useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from './CartContext';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const { clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  
  // Clear the cart once payment is successful
  useEffect(() => {
    clearCart();
    
    // Add a confetti animation effect when the component mounts
    const createConfetti = () => {
      for (let i = 0; i < 150; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 80%, 60%)`;
        document.querySelector('.payment-success-container').appendChild(confetti);
      }
    };
    
    createConfetti();
    
    // Clean up confetti after animation
    return () => {
      const confettiElements = document.querySelectorAll('.confetti');
      confettiElements.forEach(el => el.remove());
    };
  }, [clearCart]);
  
  const handleReturnHome = () => {
    navigate('/workers');
  };

  return (
    <div className="payment-success-container">
      <div className="success-card">
        <div className="success-icon animate-checkmark" style={{ width: '60px', height: '60px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h1 className="animate-fade-in">Payment Successful!</h1>
        <p className="animate-fade-in animate-delay-1">Your order has been placed successfully.</p>
        <p className="animate-fade-in animate-delay-2">Thank you for your purchase.</p>
        <div className="order-details animate-fade-in animate-delay-3">
          <p>We've sent the order confirmation and details to your email.</p>
          <p>You will receive updates about your order status shortly.</p>
        </div>
        <div className="success-buttons">
          <button onClick={handleReturnHome} className="go-home-btn animate-fade-in animate-delay-4">
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess; 
