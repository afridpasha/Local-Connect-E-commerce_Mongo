import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const homeImages = [
  {
    url: 'https://media.istockphoto.com/id/921346102/photo/plumber-fixing-sink-pipe-with-adjustable-wrench.jpg?s=2048x2048&w=is&k=20&c=wh-yvOsmJLXTguGTM9j6xijl6FwE2iPKPB4Yhv0PqHo=',
    title: 'Professional Plumbing Services',
    description: 'Our certified plumbers are ready to tackle any plumbing issue with prompt and reliable service.',
    link: '/workers/plumber'
  },
  {
    url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTCsNzTgq3hzLPu-L1Ra5-QlrpJGMjkLqDagw&s',
    title: 'Expert Mechanical Repairs',
    description: 'Trust our skilled mechanics to diagnose and fix your mechanical problems efficiently.',
    link: '/workers/mechanic'
  },
  {
    url: 'https://media.istockphoto.com/id/1437896577/photo/air-conditioner-technician-repairing-central-air-conditioning-system-with-outdoor-tools.jpg?s=2048x2048&w=is&k=20&c=u78JHE8xIxjLyCG_yV9Ffjuldr5MFzU_u_04f-JWfTs=',
    title: 'AC Repair & Maintenance',
    description: 'Stay cool with our comprehensive AC repair and maintenance services by certified technicians.',
    link: '/workers/ac'
  }
];

const eventImages = [
  {
    url: 'https://res.cloudinary.com/dwzmsvp7f/image/upload/f_auto,w_1280/c_crop%2Cg_custom%2Fv1739268842%2Fl6kp6tahpohlf1nyfpub.png',
    title: 'Live Concert Experiences',
    description: 'Get tickets to the hottest concerts and live music events in your area.',
    link: '/tickets/sellbuy/concert'
  },
  {
    url: 'https://res.cloudinary.com/dwzmsvp7f/image/upload/f_auto,w_1280/c_crop%2Cg_custom%2Fv1741690475%2Fyha6hmvw27vhxeq82d1f.jpg',
    title: 'Sports Events & Tournaments',
    description: 'Never miss a game with our exclusive access to sporting events and tournaments.',
    link: '/tickets/sellbuy/sports'
  },
  {
    url: 'https://marketplace.canva.com/EAF09lIgVUA/1/0/1600w/canva-red-and-black-modern-cinema-movie-ticket-YAVMiWiWrsk.jpg',
    title: 'Theater & Performing Arts',
    description: 'Experience the magic of live theater, musicals, and performing arts events.',
    link: '/tickets/sellbuy/theater'
  },
  {
    url: 'https://res.cloudinary.com/dwzmsvp7f/image/upload/f_auto,w_1280/c_crop%2Cg_custom%2Fv1741348519%2Fijapd4yfth0tva1pg4dk.jpg',
    title: 'Cultural Festivals',
    description: 'Immerse yourself in diverse cultural celebrations and festival events throughout the year.',
    link: '/tickets/sellbuy/festival'
  }  
];

const ImageSlider = () => {
  const location = useLocation();
  
  // Determine which set of images to display based on the current route
  const images = location.pathname === '/tickets' ? eventImages : homeImages;

  const slideshowWrapperStyle = {
    width: '400%',  // Updated to 400% for 4 slides
    overflow: 'hidden',
    animation: 'slide 24s infinite',  // Increased from 18s to 24s for 4 slides
    display: 'flex',
  };

  return (
    <div className="slider-container">
      <div className="slider-wrapper">
        {images.map((image, index) => (
          <div key={index} className="slider-item">
            <img src={image.url} alt={`Slide ${index}`} />
            <div className="slider-overlay"></div>
            <div className="slider-content">
              <h2>{image.title}</h2>
              <p>{image.description}</p>
              <Link to={image.link} className="slider-btn">Explore</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;
