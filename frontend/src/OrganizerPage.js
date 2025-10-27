import React, { useState, useEffect } from 'react';
import './Organizer.css';
import { eventService, authService, subEventService } from './services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faList, faFileAlt, faFolder, faPlus, faToggleOff, faToggleOn, faEdit, faTrash, faPrint, faStar, faCalendarAlt, faMapMarkerAlt, faCog } from '@fortawesome/free-solid-svg-icons';

const OrganizerPage = ({ onBack }) => {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSubEventModalOpen, setIsSubEventModalOpen] = useState(false);
  const [isSubEventEditModalOpen, setIsSubEventEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [currentEventToActivate, setCurrentEventToActivate] = useState(null);
  const [currentEventForSubEvent, setCurrentEventForSubEvent] = useState(null);
  const [currentEventToEdit, setCurrentEventToEdit] = useState(null);
  const [currentSubEventToEdit, setCurrentSubEventToEdit] = useState(null);
  const [currentSubEventForSettings, setCurrentSubEventForSettings] = useState(null);
  const [contestants, setContestants] = useState([]);
  const [judges, setJudges] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [isActivating, setIsActivating] = useState(true); // true for activate, false for deactivate
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('events');
  const [expandedYear, setExpandedYear] = useState(null);
  const [expandedSubEvents, setExpandedSubEvents] = useState({}); // {eventId: true/false}
  const [subEventsData, setSubEventsData] = useState({}); // {eventId: [subEvents]}
  const [formData, setFormData] = useState({
    eventName: '',
    eventYear: '',
    startDate: '',
    endDate: '',
    location: ''
  });
  const [subEventFormData, setSubEventFormData] = useState({
    subEventName: '',
    date: '',
    time: '',
    location: ''
  });

  // Fetch events from API on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const data = await eventService.getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      alert('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  // Group events by year
  const groupEventsByYear = () => {
    const grouped = {};
    events.forEach(event => {
      const year = event.year;
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(event);
    });
    return grouped;
  };

  const handleAddEvent = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEventToEdit(null);
    setFormData({
      eventName: '',
      eventYear: '',
      startDate: '',
      endDate: '',
      location: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.eventName || !formData.eventYear || !formData.startDate || !formData.endDate || !formData.location) {
      alert('Please fill in all fields');
      return;
    }

    try {
      // Create event data for API
      const eventData = {
        title: formData.eventName,
        year: parseInt(formData.eventYear),
        start_date: formData.startDate,
        end_date: formData.endDate,
        location: formData.location
      };
      
      if (currentEventToEdit) {
        // Update existing event
        await eventService.updateEvent(currentEventToEdit.id, {
          ...currentEventToEdit,
          ...eventData
        });
        alert('Event updated successfully!');
      } else {
        // Create new event
        eventData.status = 'deactivated';
        await eventService.createEvent(eventData);
        alert('Event created successfully!');
      }
      
      // Refresh events from API
      await fetchEvents();
      handleCloseEditModal();
    } catch (error) {
      console.error(`Error ${currentEventToEdit ? 'updating' : 'creating'} event:`, error);
      alert(`Failed to ${currentEventToEdit ? 'update' : 'create'} event`);
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventService.deleteEvent(eventId);
        await fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event');
      }
    }
  };

  const handleEditClick = (event) => {
    setCurrentEventToEdit(event);
    setFormData({
      eventName: event.title,
      eventYear: event.year.toString(),
      startDate: event.start_date,
      endDate: event.end_date,
      location: event.location
    });
    setIsModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsModalOpen(false);
    setCurrentEventToEdit(null);
    setFormData({
      eventName: '',
      eventYear: '',
      startDate: '',
      endDate: '',
      location: ''
    });
  };

  const toggleYear = (year) => {
    if (expandedYear === year) {
      setExpandedYear(null);
    } else {
      setExpandedYear(year);
    }
  };

  const handleActivateClick = (event) => {
    const activating = event.status !== 'activated';
    setIsActivating(activating);
    setCurrentEventToActivate(event);
    setIsPasswordModalOpen(true);
  };

  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setCurrentEventToActivate(null);
    setPassword('');
    setIsActivating(true);
  };

  const handleAddSubEventClick = (event) => {
    setCurrentEventForSubEvent(event);
    setIsSubEventModalOpen(true);
  };

  const handleCloseSubEventModal = () => {
    setIsSubEventModalOpen(false);
    setCurrentEventForSubEvent(null);
    setSubEventFormData({
      subEventName: '',
      date: '',
      time: '',
      location: ''
    });
  };

  const handleSubEventInputChange = (e) => {
    const { name, value } = e.target;
    setSubEventFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubEventSubmit = async (e) => {
    e.preventDefault();
    
    if (!subEventFormData.subEventName || !subEventFormData.date || !subEventFormData.time || !subEventFormData.location) {
      alert('Please fill in all fields');
      return;
    }

    try {
      if (currentSubEventToEdit) {
        // Update existing sub-event
        const subEventData = {
          ...currentSubEventToEdit,
          title: subEventFormData.subEventName,
          date: subEventFormData.date,
          time: subEventFormData.time,
          location: subEventFormData.location
        };
        
        await subEventService.updateSubEvent(currentSubEventToEdit.id, subEventData);
        
        handleCloseSubEventEditModal();
        alert('Sub-event updated successfully!');
        
        // Refresh sub-events if they're expanded
        if (expandedSubEvents[currentEventForSubEvent.id]) {
          await fetchSubEvents(currentEventForSubEvent.id);
        }
      } else {
        // Create new sub-event
        const subEventData = {
          event: currentEventForSubEvent.id,
          title: subEventFormData.subEventName,
          date: subEventFormData.date,
          time: subEventFormData.time,
          location: subEventFormData.location,
          status: 'deactivated'
        };
        
        await subEventService.createSubEvent(subEventData);
        
        handleCloseSubEventModal();
        alert('Sub-event created successfully!');
        
        // Refresh sub-events if they're expanded
        if (expandedSubEvents[currentEventForSubEvent.id]) {
          await fetchSubEvents(currentEventForSubEvent.id);
        }
      }
    } catch (error) {
      console.error(`Error ${currentSubEventToEdit ? 'updating' : 'creating'} sub-event:`, error);
      alert(`Failed to ${currentSubEventToEdit ? 'update' : 'create'} sub-event`);
    }
  };

  const fetchSubEvents = async (eventId) => {
    try {
      const allSubEvents = await subEventService.getSubEvents();
      const eventSubEvents = allSubEvents.filter(subEvent => subEvent.event === eventId);
      setSubEventsData(prev => ({
        ...prev,
        [eventId]: eventSubEvents
      }));
    } catch (error) {
      console.error('Error fetching sub-events:', error);
    }
  };

  const handleListButtonClick = async (event) => {
    const eventId = event.id;
    const isExpanded = expandedSubEvents[eventId];
    
    if (!isExpanded && !subEventsData[eventId]) {
      await fetchSubEvents(eventId);
    }
    
    setExpandedSubEvents(prev => ({
      ...prev,
      [eventId]: !isExpanded
    }));
  };

  const handleSubEventToggle = async (subEvent, parentEventId) => {
    try {
      const newStatus = subEvent.status === 'activated' ? 'deactivated' : 'activated';
      
      await subEventService.updateSubEvent(subEvent.id, {
        ...subEvent,
        status: newStatus
      });
      
      // Update local state
      setSubEventsData(prev => {
        const updated = [...(prev[parentEventId] || [])];
        const index = updated.findIndex(se => se.id === subEvent.id);
        if (index !== -1) {
          updated[index] = { ...updated[index], status: newStatus };
        }
        return {
          ...prev,
          [parentEventId]: updated
        };
      });
      
      alert(`Sub-event ${newStatus} successfully!`);
    } catch (error) {
      console.error('Error toggling sub-event:', error);
      alert('Failed to toggle sub-event');
    }
  };

  const handleSubEventDelete = async (subEventId, parentEventId) => {
    if (window.confirm('Are you sure you want to delete this sub-event?')) {
      try {
        await subEventService.deleteSubEvent(subEventId);
        
        // Update local state
        setSubEventsData(prev => {
          const updated = (prev[parentEventId] || []).filter(se => se.id !== subEventId);
          return {
            ...prev,
            [parentEventId]: updated
          };
        });
        
        alert('Sub-event deleted successfully!');
      } catch (error) {
        console.error('Error deleting sub-event:', error);
        alert('Failed to delete sub-event');
      }
    }
  };

  const handleSubEventEditClick = (subEvent, parentEvent) => {
    setCurrentSubEventToEdit(subEvent);
    setCurrentEventForSubEvent(parentEvent);
    setSubEventFormData({
      subEventName: subEvent.title,
      date: subEvent.date,
      time: subEvent.time,
      location: subEvent.location
    });
    setIsSubEventEditModalOpen(true);
  };

  const handleCloseSubEventEditModal = () => {
    setIsSubEventEditModalOpen(false);
    setCurrentSubEventToEdit(null);
    setSubEventFormData({
      subEventName: '',
      date: '',
      time: '',
      location: ''
    });
  };

  const handleSettingsClick = (subEvent) => {
    setCurrentSubEventForSettings(subEvent);
    // Initialize with 2 default empty fields
    setContestants([
      { id: Date.now(), name: '' },
      { id: Date.now() + 1, name: '' }
    ]);
    setJudges([
      { id: Date.now(), name: '', code: '', type: 'judge' },
      { id: Date.now() + 1, name: '', code: '', type: 'judge' }
    ]);
    setCriteria([
      { id: Date.now(), name: '', points: '' },
      { id: Date.now() + 1, name: '', points: '' }
    ]);
    setIsSettingsModalOpen(true);
  };

  const handleCloseSettingsModal = () => {
    setIsSettingsModalOpen(false);
    setCurrentSubEventForSettings(null);
  };

  const addContestant = () => {
    setContestants([...contestants, { id: Date.now(), name: '' }]);
  };

  const removeContestant = (id) => {
    setContestants(contestants.filter(c => c.id !== id));
  };

  const updateContestant = (id, name) => {
    setContestants(contestants.map(c => c.id === id ? { ...c, name } : c));
  };

  const addJudge = () => {
    setJudges([...judges, { id: Date.now(), name: '', code: '', type: 'judge' }]);
  };

  const removeJudge = (id) => {
    setJudges(judges.filter(j => j.id !== id));
  };

  const updateJudge = (id, field, value) => {
    setJudges(judges.map(j => j.id === id ? { ...j, [field]: value } : j));
  };

  const addCriteria = () => {
    setCriteria([...criteria, { id: Date.now(), name: '', points: '' }]);
  };

  const removeCriteria = (id) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const updateCriteria = (id, field, value) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      alert('Please enter password');
      return;
    }

    try {
      // Verify password with backend
      const result = await authService.verifyPassword(password);
      
      if (result.verified) {
        try {
          // Activate or Deactivate the event
          if (currentEventToActivate) {
            const newStatus = isActivating ? 'activated' : 'deactivated';
            await eventService.updateEvent(currentEventToActivate.id, {
              ...currentEventToActivate,
              status: newStatus
            });
            await fetchEvents();
          }
          handleClosePasswordModal();
          alert(`Event ${isActivating ? 'activated' : 'deactivated'} successfully!`);
        } catch (error) {
          console.error(`Error ${isActivating ? 'activating' : 'deactivating'} event:`, error);
          alert(`Failed to ${isActivating ? 'activate' : 'deactivate'} event`);
        }
      }
    } catch (error) {
      console.error('Password verification failed:', error);
      alert(error.response?.data?.error || 'Incorrect password');
      setPassword('');
    }
  };

  return (
    <div className="organizer-page">
      {/* Header */}
      <div className="main-header">
        <div className="header-left">
          <h1>Judging Management System</h1>
        </div>
        <button className="logout-btn" onClick={onBack}>
          Logout
          <FontAwesomeIcon icon={faSignOutAlt} className="logout-icon" />
        </button>
      </div>

      {/* Navigation Bar */}
      <div className="nav-bar">
        <button 
          className={`nav-btn ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <FontAwesomeIcon icon={faList} />
          <span>List of Events</span>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'scores' ? 'active' : ''}`}
          onClick={() => setActiveTab('scores')}
        >
          <FontAwesomeIcon icon={faFileAlt} />
          <span>Score Sheets</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="content-area">
        <div className="page-title">
          <h2>List of Events</h2>
        </div>
        
        <div className="breadcrumb-container">
          <button className="add-event-button" onClick={handleAddEvent}>
            <FontAwesomeIcon icon={faPlus} />
            <span>Event</span>
          </button>
        </div>

        <div className="events-section">
          <div className="events-list">
            {isLoading ? (
              <div className="empty-state">
                <div className="empty-icon">⏳</div>
                <h3>Loading events...</h3>
              </div>
            ) : events.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>No events yet</h3>
                <p>Click "Event" to create your first campus judging event</p>
              </div>
            ) : (
              Object.entries(groupEventsByYear()).map(([year, yearEvents]) => (
                <div key={year} className="year-group">
                  <div className="year-event-card" onClick={() => toggleYear(year)}>
                    <div className="year-left">
                      <FontAwesomeIcon icon={faFolder} className="folder-icon" />
                      <span className="year-text">{year}</span>
                    </div>
                    <div className="year-right">
                      {yearEvents.length} Event{yearEvents.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {expandedYear === year && (
                    <div className="events-under-year">
                      {yearEvents.map(event => (
                        <div key={event.id}>
                          <div className="event-detail-card">
                            <div className="event-detail-info">
                              <span className="event-title-inline">
                                <FontAwesomeIcon icon={faStar} className="info-icon" />
                                {event.title}
                              </span>
                              <span className="event-date-inline">
                                <FontAwesomeIcon icon={faCalendarAlt} className="info-icon" />
                                {event.start_date} {event.end_date && `- ${event.end_date}`}
                              </span>
                              {event.location && <span className="event-location-inline">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="info-icon" />
                                {event.location}
                              </span>}
                            </div>
                            <div className="event-icon-actions">
                              <button 
                                className="icon-btn list-btn"
                                disabled={event.status === 'deactivated'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleListButtonClick(event);
                                }}
                              >
                                <FontAwesomeIcon icon={faList} />
                              </button>
                              <button 
                                className="icon-btn toggle-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActivateClick(event);
                                }}
                              >
                                <FontAwesomeIcon icon={event.status === 'activated' ? faToggleOn : faToggleOff} />
                              </button>
                              <button 
                                className="icon-btn add-btn"
                                disabled={event.status === 'deactivated'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddSubEventClick(event);
                                }}
                              >
                                <FontAwesomeIcon icon={faPlus} />
                              </button>
                            <button 
                              className="icon-btn edit-btn"
                              disabled={event.status === 'deactivated'}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(event);
                              }}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                              <button 
                                className="icon-btn delete-btn"
                                disabled={event.status === 'deactivated'} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(event.id);
                                }}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                              <button 
                                className="icon-btn print-btn"
                                disabled={event.status === 'deactivated'}
                              >
                                <FontAwesomeIcon icon={faPrint} />
                              </button>
                            </div>
                          </div>
                          {expandedSubEvents[event.id] && subEventsData[event.id] && (
                            <div className="sub-events-list">
                              {subEventsData[event.id].map(subEvent => (
                                <div key={subEvent.id} className="sub-event-card">
                                  <div className="sub-event-info">
                                    <span className="sub-event-title">
                                      <FontAwesomeIcon icon={faStar} className="info-icon" />
                                      {subEvent.title}
                                    </span>
                                    <span className="sub-event-date">
                                      <FontAwesomeIcon icon={faCalendarAlt} className="info-icon" />
                                      {subEvent.date}
                                    </span>
                                    <span className="sub-event-time">{subEvent.time}</span>
                                    <span className="sub-event-location">
                                      <FontAwesomeIcon icon={faMapMarkerAlt} className="info-icon" />
                                      {subEvent.location}
                                    </span>
                                  </div>
                                  <div className="sub-event-icon-actions">
                                    <button 
                                      className="icon-btn toggle-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSubEventToggle(subEvent, event.id);
                                      }}
                                    >
                                      <FontAwesomeIcon icon={subEvent.status === 'activated' ? faToggleOn : faToggleOff} />
                                    </button>
                                    <button 
                                      className="icon-btn settings-btn"
                                      disabled={subEvent.status === 'deactivated'}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSettingsClick(subEvent);
                                      }}
                                    >
                                      <FontAwesomeIcon icon={faCog} />
                                    </button>
                                    <button 
                                      className="icon-btn edit-btn"
                                      disabled={subEvent.status === 'deactivated'}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSubEventEditClick(subEvent, event);
                                      }}
                                    >
                                      <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    <button 
                                      className="icon-btn delete-btn"
                                      disabled={subEvent.status === 'deactivated'}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSubEventDelete(subEvent.id, event.id);
                                      }}
                                    >
                                      <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                    <button 
                                      className="icon-btn print-btn"
                                      disabled={subEvent.status === 'deactivated'}
                                    >
                                      <FontAwesomeIcon icon={faPrint} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {subEventsData[event.id].length === 0 && (
                                <div className="no-sub-events">No sub-events yet</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Event Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{currentEventToEdit ? 'Edit Event' : 'Add New Event'}</h2>
              <button className="modal-close-btn" onClick={handleCloseEditModal}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <form className="modal-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="eventName">Event Name</label>
                  <input
                    type="text"
                    id="eventName"
                    name="eventName"
                    value={formData.eventName}
                    onChange={handleInputChange}
                    placeholder="Enter event name"
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="eventYear">Event Year</label>
                  <input
                    type="number"
                    id="eventYear"
                    name="eventYear"
                    value={formData.eventYear}
                    onChange={handleInputChange}
                    placeholder="e.g., 2024"
                    min="2000"
                    max="2099"
                    required
                  />
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label htmlFor="startDate">Start Date</label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="endDate">End Date</label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Enter event location"
                    required
                  />
                </div>
                
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="modal-cancel-btn" 
                    onClick={handleCloseEditModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="modal-submit-btn"
                  >
                    {currentEventToEdit ? 'Update Event' : 'Add Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="modal-overlay" onClick={handleClosePasswordModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isActivating ? 'Activate' : 'Deactivate'} Event</h2>
              <button className="modal-close-btn" onClick={handleClosePasswordModal}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <form className="modal-form" onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label htmlFor="password">Enter Organizer Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    autoFocus
                  />
                </div>
                
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="modal-cancel-btn" 
                    onClick={handleClosePasswordModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="modal-submit-btn"
                  >
                    {isActivating ? 'Activate' : 'Deactivate'} Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Event Modal */}
      {(isSubEventModalOpen || isSubEventEditModalOpen) && (
        <div className="modal-overlay" onClick={isSubEventEditModalOpen ? handleCloseSubEventEditModal : handleCloseSubEventModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{currentSubEventToEdit ? 'Edit Sub-Event' : 'Add Sub-Event'}</h2>
              <button className="modal-close-btn" onClick={isSubEventEditModalOpen ? handleCloseSubEventEditModal : handleCloseSubEventModal}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <form className="modal-form" onSubmit={handleSubEventSubmit}>
                <div className="form-group">
                  <label htmlFor="subEventName">Sub-Event Name</label>
                  <input
                    type="text"
                    id="subEventName"
                    name="subEventName"
                    value={subEventFormData.subEventName}
                    onChange={handleSubEventInputChange}
                    placeholder="Enter sub-event name"
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={subEventFormData.date}
                    onChange={handleSubEventInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="time">Time</label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={subEventFormData.time}
                    onChange={handleSubEventInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={subEventFormData.location}
                    onChange={handleSubEventInputChange}
                    placeholder="Enter sub-event location"
                    required
                  />
                </div>
                
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="modal-cancel-btn" 
                    onClick={isSubEventEditModalOpen ? handleCloseSubEventEditModal : handleCloseSubEventModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="modal-submit-btn"
                  >
                    {currentSubEventToEdit ? 'Update Sub-Event' : 'Add Sub-Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && currentSubEventForSettings && (
        <div className="modal-overlay settings-modal-overlay" onClick={handleCloseSettingsModal}>
          <div className="settings-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h2>Sub-Event Settings — {currentSubEventForSettings.title}</h2>
              <button className="modal-close-btn" onClick={handleCloseSettingsModal}>
                ×
              </button>
            </div>
            
            <div className="settings-modal-content">
              {/* Contestant's Settings */}
              <div className="settings-column contestants-column">
                <div className="settings-column-header">
                  <h3>Contestant's Settings</h3>
                  <button className="add-plus-btn" onClick={addContestant}>
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </div>
                <div className="settings-list">
                  {contestants.map((contestant, index) => (
                    <div key={contestant.id} className="settings-item">
                      <div className="settings-item-content">
                        <span className="item-label">Contestant No. {index + 1}</span>
                        <input
                          type="text"
                          value={contestant.name}
                          onChange={(e) => updateContestant(contestant.id, e.target.value)}
                          className="settings-input"
                        />
                      </div>
                      <button className="delete-item-btn" onClick={() => removeContestant(contestant.id)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Judge's Settings */}
              <div className="settings-column judges-column">
                <div className="settings-column-header">
                  <h3>Judge's Settings</h3>
                  <button className="add-plus-btn" onClick={addJudge}>
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </div>
                <div className="settings-list">
                  {judges.map((judge, index) => (
                    <div key={judge.id} className="settings-item">
                      <div className="settings-item-content">
                        <span className="item-label">{judge.type === 'chairman' ? 'Chairman of the Board' : `Judge No. ${index}`}</span>
                        <input
                          type="text"
                          value={judge.name}
                          onChange={(e) => updateJudge(judge.id, 'name', e.target.value)}
                          className="settings-input"
                        />
                        {judge.code && (
                          <div className="current-code">
                            Current Code: <strong>{judge.code}</strong>
                          </div>
                        )}
                      </div>
                      <button className="delete-item-btn" onClick={() => removeJudge(judge.id)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Criteria's Settings */}
              <div className="settings-column criteria-column">
                <div className="settings-column-header">
                  <h3>Criteria's Settings</h3>
                  <button className="add-plus-btn" onClick={addCriteria}>
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </div>
                <div className="settings-list">
                  {criteria.map((criterion, index) => (
                    <div key={criterion.id} className="settings-item">
                      <div className="settings-item-content">
                        <span className="item-label">Criteria No. {index + 1}</span>
                        <input
                          type="text"
                          value={criterion.name}
                          onChange={(e) => updateCriteria(criterion.id, 'name', e.target.value)}
                          className="settings-input"
                        />
                        <div className="criteria-points">
                          <input
                            type="text"
                            value={criterion.points}
                            onChange={(e) => updateCriteria(criterion.id, 'points', e.target.value)}
                            className="settings-input points-input"
                            placeholder="Points"
                          />
                          <span>%</span>
                        </div>
                      </div>
                      <button className="delete-item-btn" onClick={() => removeCriteria(criterion.id)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="settings-modal-footer">
              <button className="settings-cancel-btn" onClick={handleCloseSettingsModal}>
                Cancel
              </button>
              <button className="settings-save-btn" onClick={() => {
                // Handle save functionality here
                alert('Settings saved!');
                handleCloseSettingsModal();
              }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerPage;
