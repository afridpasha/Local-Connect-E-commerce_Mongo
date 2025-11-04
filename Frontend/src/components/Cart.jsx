// Cart.jsx
import React, { useContext, useState, useEffect, useRef } from 'react';
import { CartContext } from './CartContext';
//import OrderPageSection from './OrderPageSection';
import './Cart.css';
import { loadStripe } from '@stripe/stripe-js';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';
import { FaShoppingCart, FaTrashAlt, FaMapMarkerAlt, FaPlus, FaMinus, FaUser, FaPhone, FaEnvelope } from 'react-icons/fa';

// Your Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RBkJNPPVB7AxTVkj61Y1mqxRDes8mukjMTfKkqQRad7ycBldQQRe7QT7FmnOzDdmG0OsaFwTMpK2tbbHal5m3vP00VbSmzNhM';

// Initialize Stripe promise
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const Cart = () => {
  const { 
    cartItems, 
    workersBookings, 
    eventsBookings, 
    activeSection, 
    removeFromCart, 
    clearCart, 
    updateQuantity, 
    setActiveSection,
    notification 
  } = useContext(CartContext);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [showTimeSlots, setShowTimeSlots] = useState(true);
  const [mapUrl, setMapUrl] = useState('');
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryFee] = useState(35);
  const [platformFee] = useState(10);
  const [taxRate] = useState(0.13); // 13% tax
  const [promoCode, setPromoCode] = useState('');
  const [workersDiscount, setWorkersDiscount] = useState(0);
  const [eventsDiscount, setEventsDiscount] = useState(0);
  const discount = activeSection === 'workers' ? workersDiscount : eventsDiscount;
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [userInfo, setUserInfo] = useState({
    fullName: '',
    mobileNumber: '',
    email: ''
  });
  const [userInfoErrors, setUserInfoErrors] = useState({
    fullName: '',
    mobileNumber: '',
    email: ''
  });
  const [staticMapUrl, setStaticMapUrl] = useState('');
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [showCartItems, setShowCartItems] = useState(true);
  const [showOrderTotal, setShowOrderTotal] = useState(true);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Calculate total for active section only
  useEffect(() => {
    const activeItems = activeSection === 'workers' ? workersBookings : eventsBookings;
    const calculatedSubtotal = activeItems.reduce((total, item) => {
      if (item.itemType === 'ticket') {
        const itemPrice = item.price + (item.fees || 0);
        return total + (itemPrice * item.quantity);
      }
      return total + (item.price * item.quantity);
    }, 0);
    
    setSubtotal(calculatedSubtotal);
  }, [workersBookings, eventsBookings, activeSection]);

  // Initialize map if userCoordinates are set
  useEffect(() => {
    if (userCoordinates && window.L) {
      initializeMap();
    }
  }, [userCoordinates]);

  // Load OpenStreetMap resources
  useEffect(() => {
    // Check if Leaflet is already loaded
    if (!window.L) {
      // Load Leaflet CSS
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      linkElement.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      linkElement.crossOrigin = '';
      document.head.appendChild(linkElement);

      // Load Leaflet JS
      const scriptElement = document.createElement('script');
      scriptElement.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      scriptElement.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      scriptElement.crossOrigin = '';
      scriptElement.onload = () => {
        // If coordinates already exist, initialize map
        if (userCoordinates) {
          initializeMap();
        }
      };
      document.head.appendChild(scriptElement);
    }
  }, []);

  const initializeMap = () => {
    if (!window.L || !userCoordinates || !mapContainerRef.current) return;

    // If map already exists, remove it to recreate
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const { latitude, longitude } = userCoordinates;
    
    // Create map with higher zoom level for better accuracy
    const map = window.L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: 18, // Higher zoom for better precision
      zoomControl: true,
      attributionControl: true
    });
    
    // Use detailed map tiles for better visibility
    window.L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Create a prominent red marker for the user's location
    const redIcon = window.L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    
    // Add marker at the exact coordinates
    const marker = window.L.marker([latitude, longitude], {
      icon: redIcon,
      title: 'Your current location'
    }).addTo(map);
    
    // Add popup with location info
    if (location) {
      marker.bindPopup(`<b>Your Current Location:</b><br>${location}`).openPopup();
    }
    
    // Save references
    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Add a small accuracy circle (helpful for understanding location precision)
    window.L.circle([latitude, longitude], {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.15,
      radius: 25 // Small radius for precise location
    }).addTo(map);
    
    // Add scale to help with distances
    window.L.control.scale({
      metric: true,
      imperial: false,
      position: 'bottomleft'
    }).addTo(map);
  };

  const handleGetLocation = () => {
    setIsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          // Log accuracy for debugging
          console.log(`Location accuracy: ${accuracy} meters`);
          
          // Save coordinates for map initialization
          setUserCoordinates({ latitude, longitude });
          
          // Set Google Maps static map URL with improved marker and styling
          setStaticMapUrl(`https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=18&size=800x400&scale=2&maptype=roadmap&markers=color:red%7Csize:mid%7C${latitude},${longitude}&key=AIzaSyBVvrihS0LY0_AQd3ky5JsGaUsHzc-xVfo`);
          
          // Fetch and display the address from coordinates
          fetchAddressFromCoordinates(latitude, longitude);
          
          // Update existing map if it exists
          if (mapInstanceRef.current && window.L) {
            mapInstanceRef.current.setView([latitude, longitude], 18);
            if (markerRef.current) {
              markerRef.current.setLatLng([latitude, longitude]);
              // Update popup if it exists
              if (location) {
                markerRef.current.getPopup().setContent(`<b>Your Current Location:</b><br>${location}`);
              }
            }
          }
          
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage = 'Could not get your location. ';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Location permission was denied. Please enable location services in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'The request to get user location timed out.';
              break;
            default:
              errorMessage += 'Please enter your location manually.';
          }
          
          alert(errorMessage);
          setIsLoading(false);
        },
        { 
          enableHighAccuracy: true, // Request highest possible accuracy
          timeout: 10000, // 10 second timeout (shorter for faster response)
          maximumAge: 0 // Always get a fresh position
        }
      );
    } else {
      alert('Geolocation is not supported by your browser. Please enter your location manually.');
      setIsLoading(false);
    }
  };

  const fetchAddressFromCoordinates = async (latitude, longitude) => {
    try {
      setIsLoading(true);
      // Use detailed reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&namedetails=1&extratags=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        // Format the address in a more user-friendly way
        let formattedAddress = '';
        
        if (data.address) {
          const address = data.address;
          const components = [];
          
          // Add place name if available
          if (address.amenity) components.push(address.amenity);
          else if (address.building) components.push(address.building);
          
          // Add building/house number and road
          if (address.house_number) components.push(address.house_number);
          if (address.road) components.push(address.road);
          
          // Add neighborhood/suburb
          if (address.suburb) components.push(address.suburb);
          else if (address.neighbourhood) components.push(address.neighbourhood);
          
          // Add city/town
          if (address.city) components.push(address.city);
          else if (address.town) components.push(address.town);
          else if (address.village) components.push(address.village);
          
          // Add state and postcode
          if (address.state) components.push(address.state);
          if (address.postcode) components.push(address.postcode);
          
          formattedAddress = components.join(', ');
        }
        
        // If we couldn't format the address properly, use the display_name
        if (!formattedAddress) {
          formattedAddress = data.display_name;
        }
        
        setLocation(formattedAddress);
        
        // Update the popup content if map and marker exist
        if (markerRef.current) {
          markerRef.current.setPopupContent(`<b>Your Current Location:</b><br>${formattedAddress}`);
          if (!markerRef.current.isPopupOpen()) {
            markerRef.current.openPopup();
          }
        }
      } else {
        // Fallback to coordinate-based location string if address lookup fails
        const locationStr = `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setLocation(locationStr);
        
        // Update popup with coordinates
        if (markerRef.current) {
          markerRef.current.setPopupContent(`<b>Your Current Location:</b><br>${locationStr}`);
          if (!markerRef.current.isPopupOpen()) {
            markerRef.current.openPopup();
          }
        }
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      // Set coordinates as location in case of error
      const locationStr = `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      setLocation(locationStr);
      
      // Update popup with coordinates on error
      if (markerRef.current) {
        markerRef.current.setPopupContent(`<b>Your Current Location:</b><br>${locationStr}`);
        if (!markerRef.current.isPopupOpen()) {
          markerRef.current.openPopup();
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const tax = (subtotal - discount + deliveryFee + platformFee) * taxRate;
  const total = subtotal - discount + deliveryFee + platformFee + tax;

  const timeSlots = [
    '9:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 1:00 PM',
    '1:00 PM - 2:00 PM',
    '2:00 PM - 3:00 PM',
    '3:00 PM - 4:00 PM',
    '4:00 PM - 5:00 PM',
    '5:00 PM - 6:00 PM'
  ];

  // Handle multiple time slot selection
  const handleTimeSlotSelection = (slot) => {
    setSelectedTimeSlots(prev => {
      // If already selected, remove it
      if (prev.includes(slot)) {
        return prev.filter(s => s !== slot);
      } 
      // Otherwise add it
      return [...prev, slot];
    });
  };

  // Handle user info input changes
  const handleUserInfoChange = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (userInfoErrors[name]) {
      setUserInfoErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate user information
  const validateUserInfo = () => {
    const errors = {};
    let isValid = true;

    // Validate full name
    if (!userInfo.fullName.trim()) {
      errors.fullName = 'Full name is required';
      isValid = false;
    }

    // Validate mobile number
    if (!userInfo.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(userInfo.mobileNumber.trim())) {
      errors.mobileNumber = 'Please enter a valid 10-digit mobile number';
      isValid = false;
    }

    // Validate email
    if (!userInfo.email.trim()) {
      errors.email = 'Email address is required';
      isValid = false;
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(userInfo.email.trim())) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    setUserInfoErrors(errors);
    return isValid;
  };

  // Handle proceed to payment button click
  const handleProceedToPayment = () => {
    const activeItems = activeSection === 'workers' ? workersBookings : eventsBookings;
    
    if (activeItems.length === 0) {
      alert(`Your ${activeSection} booking cart is empty. Add some items before proceeding to payment.`);
      return;
    }
    
    // Check mandatory fields based on active section
    if (activeSection === 'workers') {
      if (!location || !date || selectedTimeSlots.length === 0) {
        alert('Please fill all mandatory fields: Location, Date, and Service Time for workers booking.');
        return;
      }
      setShowUserInfoModal(true);
    } else {
      if (!location || !date) {
        alert('Please fill all mandatory fields: Location and Date for events booking.');
        return;
      }
      processEventsPayment();
    }
  };

  // Handle user info form submission
  const handleUserInfoSubmit = (e) => {
    e.preventDefault();
    
    if (validateUserInfo()) {
      console.log('User info validated successfully:', userInfo);
      setShowUserInfoModal(false);
      processWorkersPayment();
    } else {
      console.log('User info validation failed:', userInfoErrors);
    }
  };

  // Workers Booking Payment
  const processWorkersPayment = async () => {
    if (selectedTimeSlots.length === 0 || !date || !location) {
      alert('Please fill all booking details before proceeding to payment.');
      return;
    }
    
    if (workersBookings.length === 0) {
      alert('Your workers cart is empty.');
      return;
    }
    
    try {
      setIsProcessingPayment(true);
      
      const lineItems = workersBookings.map(item => ({
        price_data: {
          currency: 'inr',
          product_data: {
            name: item.fullName || item.name || 'Worker',
            description: item.type || 'Service',
          },
          unit_amount: Math.round((item.price || 0) * 100),
        },
        quantity: item.quantity || 1,
      }));
      
      // Add additional fees as line items
      if (deliveryFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'inr',
            product_data: {
              name: 'Delivery Fee',
            },
            unit_amount: Math.round(deliveryFee * 100),
          },
          quantity: 1,
        });
      }
      
      if (platformFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'inr',
            product_data: {
              name: 'Platform Fee',
            },
            unit_amount: Math.round(platformFee * 100),
          },
          quantity: 1,
        });
      }
      
      // Add tax as a line item
      if (tax > 0) {
        lineItems.push({
          price_data: {
            currency: 'inr',
            product_data: {
              name: 'GST & Charges',
            },
            unit_amount: Math.round(tax * 100),
          },
          quantity: 1,
        });
      }
      
      const metadata = {
        delivery_address: location,
        delivery_date: date,
        time_slots: selectedTimeSlots.join(', '),
        promo_code: promoCode || 'None',
        full_name: userInfo.fullName,
        mobile_number: userInfo.mobileNumber,
        email: userInfo.email,
        booking_type: 'workers'
      };
      
      const orderData = {
        bookingType: 'workers',
        contactInfo: {
          fullName: userInfo.fullName,
          mobileNumber: userInfo.mobileNumber,
          email: userInfo.email
        },
        items: workersBookings.map(item => ({
          itemId: item._id,
          itemType: 'Worker',
          name: item.fullName || item.name || 'Worker',
          price: item.price,
          quantity: item.quantity,
          fees: item.fees || 0
        })),
        location: location,
        date: date,
        timeSlots: selectedTimeSlots,
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        platformFee: platformFee,
        discount: workersDiscount,
        tax: tax,
        total: total,
        promoCode: promoCode || ''
      };
      
      console.log('Sending payment request with line items:', lineItems);
      
      // Call backend server to create a Stripe checkout session
      console.log('Attempting to connect to payment server...');
      
      const serverUrl = `${API_BASE_URL}/api/create-checkout-session`;
      console.log('Sending request to:', serverUrl);
      
      // First ping the server to check if it's responsive
      try {
        await axios.get(`${API_BASE_URL}/`, { timeout: 5000 });
        console.log('Payment server is responsive');
      } catch (pingError) {
        console.warn('Could not ping payment server:', pingError);
        // Continue anyway as the POST request might still work
      }
      
      // First save the order to MongoDB
      const orderResponse = await axios.post(`${API_BASE_URL}/api/orders`, orderData, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      console.log('Order saved to database:', orderResponse.data);
      
      // Then create Stripe checkout session
      const response = await axios.post(serverUrl, {
        line_items: lineItems,
        metadata: metadata,
        order_id: orderResponse.data._id, // Include the MongoDB order ID
        success_url: `${window.location.origin}/payment-success?order_id=${orderResponse.data._id}`,
        cancel_url: `${window.location.origin}/cart`
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000, // 15 second timeout
        withCredentials: true
      });
      
      console.log('Checkout session created:', response.data);
      
      if (!response.data || !response.data.id) {
        throw new Error('Invalid response from payment server');
      }
      
      // Redirect to Stripe checkout
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId: response.data.id
      });
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Payment error:', error);
      
      // Enhanced error handling with more specific messages
      let errorMessage = 'An error occurred during payment processing. Please try again.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // outside the range of 2xx
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        errorMessage = error.response.data?.error || `Server returned error ${error.response.status}`;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        
        // Check if server is running on port 5000
        errorMessage = 'No response from payment server. Please make sure the server is running (npm run server).';
        
        // Attempt to show a more helpful message
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Payment server connection timed out. Please try again or check server status.';
        } else if (error.code === 'ECONNREFUSED') {
          errorMessage = 'Could not connect to payment server. Please start the server with "npm run server".';
        }
      } else {
        // Something happened in setting up the request
        console.error('Error message:', error.message);
        errorMessage = error.message || errorMessage;
      }
      
      alert(errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Events Booking Payment
  const processEventsPayment = async () => {
    if (!date || !location) {
      alert('Please fill all booking details before proceeding to payment.');
      return;
    }
    
    if (eventsBookings.length === 0) {
      alert('Your events cart is empty.');
      return;
    }
    
    try {
      setIsProcessingPayment(true);
      
      const lineItems = eventsBookings.map(item => ({
        price_data: {
          currency: 'inr',
          product_data: {
            name: item.performerName || item.eventName || item.festivalName || 'Event Ticket',
            description: 'Event Ticket',
          },
          unit_amount: Math.round(((item.price || 0) + (item.fees || 0)) * 100),
        },
        quantity: item.quantity || 1,
      }));
      
      if (deliveryFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'inr',
            product_data: { name: 'Delivery Fee' },
            unit_amount: Math.round(deliveryFee * 100),
          },
          quantity: 1,
        });
      }
      
      if (platformFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'inr',
            product_data: { name: 'Platform Fee' },
            unit_amount: Math.round(platformFee * 100),
          },
          quantity: 1,
        });
      }
      
      if (tax > 0) {
        lineItems.push({
          price_data: {
            currency: 'inr',
            product_data: { name: 'GST & Charges' },
            unit_amount: Math.round(tax * 100),
          },
          quantity: 1,
        });
      }
      
      const metadata = {
        delivery_address: location,
        delivery_date: date,
        promo_code: promoCode || 'None',
        booking_type: 'events'
      };
      
      const orderData = {
        bookingType: 'events',
        items: eventsBookings.map(item => ({
          itemId: item._id,
          itemType: item.concertName ? 'ConcertTicket' : 
                   item.theaterName ? 'TheaterTicket' : 
                   item.sportsName ? 'SportsTicket' : 
                   item.festivalName ? 'FestivalsTicket' : 'ConcertTicket',
          name: item.performerName || item.eventName || item.festivalName || 'Event Ticket',
          price: item.price,
          quantity: item.quantity,
          fees: item.fees || 0
        })),
        location: location,
        date: date,
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        platformFee: platformFee,
        discount: eventsDiscount,
        tax: tax,
        total: total,
        promoCode: promoCode || ''
      };
      
      console.log('Events Payment - Order Data:', orderData);
      
      const serverUrl = `${API_BASE_URL}/api/create-checkout-session`;
      
      const orderResponse = await axios.post(`${API_BASE_URL}/api/orders`, orderData, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });
      
      const response = await axios.post(serverUrl, {
        line_items: lineItems,
        metadata: metadata,
        order_id: orderResponse.data._id,
        success_url: `${window.location.origin}/payment-success?order_id=${orderResponse.data._id}`,
        cancel_url: `${window.location.origin}/cart`
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
        withCredentials: true
      });
      
      if (!response.data || !response.data.id) {
        throw new Error('Invalid response from payment server');
      }
      
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId: response.data.id
      });
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Payment error:', error);
      
      let errorMessage = 'An error occurred during payment processing. Please try again.';
      
      if (error.response) {
        errorMessage = error.response.data?.error || `Server returned error ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from payment server. Please make sure the server is running (npm run server).';
        
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Payment server connection timed out. Please try again or check server status.';
        } else if (error.code === 'ECONNREFUSED') {
          errorMessage = 'Could not connect to payment server. Please start the server with "npm run server".';
        }
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      alert(errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleApplyPromoCode = () => {
    if (!promoCode) {
      alert('Please enter a promo code.');
      return;
    }
    
    const offers = [
      { code: 'FIRST10', discountPercentage: 10 },
      { code: 'WELCOME20', discountPercentage: 20 },
      { code: 'super', discountPercentage: 10 }
    ];
    
    const matchingOffer = offers.find(offer => offer.code.toLowerCase() === promoCode.toLowerCase());
    
    if (matchingOffer) {
      const discountAmount = (subtotal * matchingOffer.discountPercentage) / 100;
      if (activeSection === 'workers') {
        setWorkersDiscount(discountAmount);
      } else {
        setEventsDiscount(discountAmount);
      }
      alert(`Promo code "${promoCode}" applied to ${activeSection} booking! You saved ₹${discountAmount.toFixed(2)}`);
    } else {
      if (activeSection === 'workers') {
        setWorkersDiscount(0);
      } else {
        setEventsDiscount(0);
      }
      alert('Invalid promo code. Please try again.');
    }
  };

  // Render workers booking section
  const renderWorkersBooking = () => {
    if (workersBookings.length === 0) {
      return <div className="empty-section">No workers booked</div>;
    }

    return (
      <div className="booking-items">
        <div className="section-info">
          <p>Location, Date, Service Time</p>
        </div>
        {workersBookings.map((item) => (
          <div key={item._id} className="cart-item worker-item">
            <div className="cart-item-image">
              {item.profileImage ? (
                <img src={item.profileImage} alt={item.name || 'Service'} />
              ) : (
                <div className="placeholder-image">{item.name?.charAt(0) || 'S'}</div>
              )}
            </div>
            <div className="cart-item-details">
              <h4>{item.fullName || item.name || 'Worker'}</h4>
              <p className="service-type">{item.type}</p>
            </div>
            <div className="cart-item-subtotal">
              ₹{calculateItemTotal(item).toFixed(2)}
            </div>
            <button 
              className="remove-item" 
              onClick={() => removeFromCart(item._id)}
            >
              <FaTrashAlt />
            </button>
          </div>
        ))}
      </div>
    );
  };

  // Render events booking section
  const renderEventsBooking = () => {
    if (eventsBookings.length === 0) {
      return <div className="empty-section">No events booked</div>;
    }

    return (
      <div className="booking-items">
        <div className="section-info">
          <p>Location, Date</p>
        </div>
        {eventsBookings.map((item) => (
          <div key={item._id} className="cart-item ticket-item">
            <div className="cart-item-image">
              {item.ticketImage && item.ticketImage.data ? (
                <img 
                  src={`data:${item.ticketImage.contentType};base64,${arrayBufferToBase64(item.ticketImage.data.data)}`} 
                  alt={item.performerName || 'Ticket'} 
                />
              ) : (
                <div className="placeholder-image">T</div>
              )}
            </div>
            <div className="cart-item-details">
              <h4>{item.performerName || item.eventName || item.festivalName || 'Event Ticket'}</h4>
              <div className="price-info">
                <p>
                  ₹{item.price.toFixed(2)}
                  {item.fees > 0 && ` + ₹${item.fees.toFixed(2)} fees`}
                </p>
                {item.availableTickets && (
                  <p className="tickets-available">
                    Available: {item.availableTickets} tickets
                  </p>
                )}
              </div>
            </div>
            <div className="cart-item-quantity">
              <button 
                className="quantity-btn decrease"
                onClick={() => updateQuantity(item._id, item.quantity - 1)}
              >
                <FaMinus />
              </button>
              <span className="quantity">{item.quantity}</span>
              <button 
                className="quantity-btn increase"
                onClick={() => updateQuantity(item._id, item.quantity + 1)}
                disabled={item.quantity >= item.availableTickets}
                style={{ 
                  opacity: item.quantity >= item.availableTickets ? 0.5 : 1,
                  cursor: item.quantity >= item.availableTickets ? 'not-allowed' : 'pointer'
                }}
              >
                <FaPlus />
              </button>
            </div>
            <div className="cart-item-subtotal">
              ₹{calculateItemTotal(item).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Calculate total for a single item including any fees
  const calculateItemTotal = (item) => {
    if (item.itemType === 'ticket') {
      return (item.price + (item.fees || 0)) * item.quantity;
    }
    return item.price * item.quantity;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to convert Buffer data to base64 for image display
  const arrayBufferToBase64 = (buffer) => {
    if (!buffer) return '';
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  return (
    <div className="cart-container">
      {/* Toast Notification */}
      {notification.show && (
        <div className={`toast-notification ${notification.type}`}>
          <span>{notification.message}</span>
        </div>
      )}
      
      <div className="cart-header">
        <h1>Your Cart</h1>
        {cartItems.length > 0 && (
          <button className="clear-cart-btn" onClick={clearCart}>
            Clear Cart
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty.</p>
        </div>
      ) : (
        <div className="cart-content">
          <div className="left-column">
            {/* Location Section */}
            <div className="location-section-container">
              <h2><FaMapMarkerAlt className="section-icon" /> Location</h2>
              <div className="map-container">
                {window.L && userCoordinates ? (
                  // OpenStreetMap with Leaflet
                  <div className="interactive-map">
                    <div 
                      id="osm-map" 
                      ref={mapContainerRef} 
                      className="leaflet-container"
                    ></div>
                    <div className="map-controls">
                      <button 
                        className="recenter-map-btn" 
                        onClick={handleGetLocation}
                        title="Get your exact location"
                      >
                        <span>Update Location</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // Default state or static map fallback
                  <div className="default-map-image">
                    {staticMapUrl ? (
                      <img 
                        src={staticMapUrl} 
                        alt="Your Location Map"
                        className="location-map" 
                      />
                    ) : (
                      <img 
                        src="/images/location-image.png" 
                        alt="Default Map Location"
                        className="default-map" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://maps.googleapis.com/maps/api/staticmap?center=17.385044,78.486671&zoom=13&size=600x350&maptype=roadmap&markers=color:red%7C17.385044,78.486671&key=AIzaSyBVvrihS0LY0_AQd3ky5JsGaUsHzc-xVfo";
                        }}
                      />
                    )}
                    <div className="map-placeholder-text">
                      Click "Get Location" to see your current location on the map
                    </div>
                  </div>
                )}
              </div>
              <div className="location-input">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter your address"
                  required
                  className="location-field"
                />
                <button 
                  className="get-location-btn" 
                  onClick={handleGetLocation}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="loading-spinner-container">
                      <div className="loading-spinner"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <>
                      <FaMapMarkerAlt /> Get Location
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Date Section */}
            <div className="date-section">
              <h2>Date</h2>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                required
                className="date-field"
              />
              <p className="date-hint">Please select a date starting from tomorrow</p>
            </div>

            {/* Service Time Section - Only show for workers booking mode */}
            {activeSection === 'workers' && (
              <div className="pickup-time">
                <h2>Service Time</h2>
                <div className="time-options">
                  <div 
                    className={`time-option ${!showTimeSlots ? 'selected' : ''}`}
                    onClick={() => setShowTimeSlots(false)}
                  >
                    <span>Standard Time</span>
                  </div>
                  <div 
                    className={`time-option ${showTimeSlots ? 'selected' : ''}`}
                    onClick={() => setShowTimeSlots(true)}
                  >
                    <span>Choose Time Slot</span>
                  </div>
                </div>

                {showTimeSlots && (
                  <div className="time-slots">
                    
                    <div className="slot-grid">
                      {timeSlots.map((slot, index) => (
                        <div 
                          key={index}
                          className={`time-slot ${selectedTimeSlots.includes(slot) ? 'selected' : ''}`}
                          onClick={() => handleTimeSlotSelection(slot)}
                        >
                          {slot}
                          {selectedTimeSlots.includes(slot) && (
                            <span className="checkmark">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {selectedTimeSlots.length > 0 && (
                      <div className="selected-time-slots">
                        <h4>Selected Slots:</h4>
                        <div className="selected-slots-chips">
                          {selectedTimeSlots.map((slot, index) => (
                            <div key={index} className="time-slot-chip">
                              <span>{slot}</span>
                              <button 
                                className="remove-slot-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTimeSlotSelection(slot);
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="right-column">
            {/* Cart Summary Section */}
            <div className="cart-summary">
              <div className="cart-summary-header">
                <h2>Cart Summary ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</h2>
                <button 
                  className="cart-toggle-btn" 
                  onClick={() => setShowCartItems(!showCartItems)}
                  aria-label={showCartItems ? "Collapse cart items" : "Expand cart items"}
                >
                  {showCartItems ? '▲' : '▼'}
                </button>
              </div>
              
              {showCartItems && (
                <div className="cart-content-wrapper">
                  {/* Toggle Buttons */}
                  <div className="booking-toggle">
                    <button 
                      className={`toggle-btn ${activeSection === 'workers' ? 'active' : ''}`}
                      onClick={() => setActiveSection('workers')}
                    >
                      Workers Booking
                      {workersBookings.length > 0 && (
                        <span className="item-count">{workersBookings.length}</span>
                      )}
                      {activeSection === 'events' && workersBookings.length > 0 && (
                        <span className="new-badge">•</span>
                      )}
                    </button>
                    <button 
                      className={`toggle-btn ${activeSection === 'events' ? 'active' : ''}`}
                      onClick={() => setActiveSection('events')}
                    >
                      Events Booking
                      {eventsBookings.length > 0 && (
                        <span className="item-count">{eventsBookings.length}</span>
                      )}
                      {activeSection === 'workers' && eventsBookings.length > 0 && (
                        <span className="new-badge">•</span>
                      )}
                    </button>
                  </div>
                  
                  {/* Active Section Content */}
                  <div className="active-booking-section">
                    {activeSection === 'workers' ? renderWorkersBooking() : renderEventsBooking()}
                  </div>
                </div>
              )}
            </div>

            {/* Promotion Section */}
            <div className="promotion-section">
              <h2>Promotion</h2>
              <div className="promo-input">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter promo code"
                  className="promo-field"
                />
                <button className="apply-btn" onClick={handleApplyPromoCode} >
                  Apply
                </button>
              </div>
              {discount > 0 && (
                <div className="applied-promo">
                  <span>Applied code: {promoCode}</span>
                  <span className="discount-amount">-₹{discount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Order Total Section */}
            <div className="cart-summary">
              <div className="cart-summary-header">
                <h2>Order Total</h2>
              </div>
              
              <div className="order-details">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="summary-row discount-row">
                    <span>Discount</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Delivery Fee</span>
                  <span>₹{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Platform Fee</span>
                  <span>₹{platformFee.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>GST & Charges</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="summary-row total-row">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button 
              className="payment-btn" 
              onClick={handleProceedToPayment}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? 'Processing...' : (
                <>
                  <FaShoppingCart size={20} />
              Proceed to Payment
                </>
              )}
            </button>
            
            {/* User Information Modal */}
            {showUserInfoModal && (
              <div className="user-info-modal-overlay">
                <div className="user-info-modal">
                  <h2>Contact Information</h2>
                  <p>Please provide your contact details to complete the order</p>
                  
                  <form onSubmit={handleUserInfoSubmit}>
                    <div className="form-group">
                      <label htmlFor="fullName">
                        <FaUser /> Full Name
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={userInfo.fullName}
                        onChange={handleUserInfoChange}
                        placeholder="Enter your full name"
                        className={userInfoErrors.fullName ? 'error' : ''}
                      />
                      {userInfoErrors.fullName && (
                        <span className="error-message">{userInfoErrors.fullName}</span>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="mobileNumber">
                        <FaPhone /> Mobile Number
                      </label>
                      <input
                        type="tel"
                        id="mobileNumber"
                        name="mobileNumber"
                        value={userInfo.mobileNumber}
                        onChange={handleUserInfoChange}
                        placeholder="Enter your 10-digit mobile number"
                        className={userInfoErrors.mobileNumber ? 'error' : ''}
                      />
                      {userInfoErrors.mobileNumber && (
                        <span className="error-message">{userInfoErrors.mobileNumber}</span>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="email">
                        <FaEnvelope /> Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={userInfo.email}
                        onChange={handleUserInfoChange}
                        placeholder="Enter your email address"
                        className={userInfoErrors.email ? 'error' : ''}
                      />
                      {userInfoErrors.email && (
                        <span className="error-message">{userInfoErrors.email}</span>
                      )}
                    </div>
                    
                    <div className="modal-buttons">
                      <button 
                        type="button" 
                        className="cancel-btn"
                        onClick={() => setShowUserInfoModal(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="submit-btn"
                        disabled={isProcessingPayment}
                      >
                        {isProcessingPayment ? 'Processing...' : 'Continue to Payment'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
