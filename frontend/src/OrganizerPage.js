import React, { useState } from 'react';
import './Organizer.css';

const OrganizerPage = ({ onBack }) => {
  const [events, setEvents] = useState([]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  const handleAddEvent = () => {
    setIsAddingEvent(true);
    // Here you would typically open a modal or navigate to an event creation form
    console.log('Opening add event form...');
    
    // Simulate adding an event
    setTimeout(() => {
      const newEvent = {
        id: Date.now(),
        title: `Event ${events.length + 1}`,
        date: new Date().toLocaleDateString(),
        status: 'Draft'
      };
      setEvents(prev => [...prev, newEvent]);
      setIsAddingEvent(false);
    }, 1000);
  };

  return (
    <div className="organizer-page">
      <div className="organizer-container">
        <div className="organizer-header">
          <h1>Event Organizer Dashboard</h1>
          <p>Manage your campus judging events</p>
        </div>
        
        <div className="organizer-content">
          <div className="events-section">
            <div className="section-header">
              <h2>My Events</h2>
              <button 
                className="add-event-btn"
                onClick={handleAddEvent}
                disabled={isAddingEvent}
              >
                {isAddingEvent ? 'Adding...' : '+ Add Event'}
              </button>
            </div>
            
            <div className="events-list">
              {events.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h3>No events yet</h3>
                  <p>Click "Add Event" to create your first campus judging event</p>
                </div>
              ) : (
                events.map(event => (
                  <div key={event.id} className="event-card">
                    <div className="event-info">
                      <h3>{event.title}</h3>
                      <p className="event-date">{event.date}</p>
                      <span className={`event-status ${event.status.toLowerCase()}`}>
                        {event.status}
                      </span>
                    </div>
                    <div className="event-actions">
                      <button className="action-btn edit">Edit</button>
                      <button className="action-btn delete">Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="organizer-footer">
          <button className="back-btn" onClick={onBack}>
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrganizerPage;
