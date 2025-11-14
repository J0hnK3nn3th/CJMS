import React, { useState, useEffect } from 'react';
import './JudgePage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faUser, faStar, faSave } from '@fortawesome/free-solid-svg-icons';
import { subEventService, scoreService } from './services/api';

const JudgePage = ({ judgeData, onLogout }) => {
  const [contestants, setContestants] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const saveTimeoutRef = React.useRef(null);

  // Fetch contestants and criteria when judge data is loaded
  useEffect(() => {
    const fetchJudgeData = async () => {
      if (judgeData && judgeData.sub_event) {
        try {
          setLoading(true);
          const subEventId = judgeData.sub_event.id;
          console.log('Fetching settings for sub-event:', subEventId);
          const settings = await subEventService.getSubEventSettings(subEventId);
          
          console.log('Settings received:', settings);
          console.log('Contestants:', settings.contestants);
          console.log('Criteria:', settings.criteria);
          
          const contestantsList = settings.contestants || [];
          const criteriaList = settings.criteria || [];
          
          setContestants(contestantsList);
          setCriteria(criteriaList);
          
          // Initialize scores for all contestants
          const initialScores = {};
          contestantsList.forEach(contestant => {
            initialScores[contestant.id] = {
              comments: ''
            };
            criteriaList.forEach(criterion => {
              initialScores[contestant.id][criterion.id] = { score: undefined };
            });
          });
          
          // Load existing scores from database
          try {
            const judgeId = judgeData.id;
            const existingScores = await scoreService.getJudgeScores(judgeId);
            
            if (existingScores.scores) {
              // Merge existing scores with initial scores
              Object.keys(existingScores.scores).forEach(contestantId => {
                if (initialScores[contestantId]) {
                  // Update comments
                  if (existingScores.comments && existingScores.comments[contestantId]) {
                    initialScores[contestantId].comments = existingScores.comments[contestantId];
                  }
                  
                  // Update criterion scores
                  Object.keys(existingScores.scores[contestantId]).forEach(criterionId => {
                    if (initialScores[contestantId][criterionId]) {
                      initialScores[contestantId][criterionId].score = existingScores.scores[contestantId][criterionId];
                    }
                  });
                }
              });
            }
          } catch (error) {
            console.error('Error loading existing scores:', error);
            // Continue with initial scores if loading fails
          }
          
          setScores(initialScores);
          
          // Set first contestant as active tab
          if (contestantsList.length > 0) {
            setActiveTab(contestantsList[0].id);
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Error fetching judge data:', error);
          console.error('Error details:', error.response?.data || error.message);
          setLoading(false);
        }
      } else {
        console.log('Judge data or sub_event not available:', judgeData);
      }
    };
    
    fetchJudgeData();
  }, [judgeData]);

  const saveScoresToDatabase = async (scoresToSave, contestantId = null, showMessage = false) => {
    if (!judgeData || !judgeData.id) return;
    
    try {
      setSaving(true);
      setSaveMessage('');
      const judgeId = judgeData.id;
      
      // Prepare scores data for the API
      const formattedScores = {};
      const contestantIds = contestantId ? [contestantId] : Object.keys(scoresToSave);
      
      contestantIds.forEach(cId => {
        if (scoresToSave[cId]) {
          formattedScores[cId] = {
            comments: scoresToSave[cId].comments || ''
          };
          
          // Add all criterion scores
          Object.keys(scoresToSave[cId]).forEach(key => {
            if (key !== 'comments' && scoresToSave[cId][key]) {
              formattedScores[cId][key] = scoresToSave[cId][key];
            }
          });
        }
      });
      
      await scoreService.saveJudgeScores(judgeId, formattedScores);
      console.log('Scores saved successfully');
      
      if (showMessage) {
        setSaveMessage('Scores saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving scores:', error);
      if (showMessage) {
        setSaveMessage('Error saving scores. Please try again.');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveScores = () => {
    if (!activeTab) return;
    
    // Clear any pending debounced saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Save only the active contestant's scores
    saveScoresToDatabase(scores, activeTab, true);
  };

  const debouncedSave = (updatedScores, contestantId = null) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      saveScoresToDatabase(updatedScores, contestantId);
    }, 1000);
  };

  const handleScoreChange = (criterionId, value) => {
    if (activeTab) {
      let updatedScores;
      
      // If the value is empty, set it to undefined, otherwise parse and validate
      if (value === '' || value === null) {
        updatedScores = {
          ...scores,
          [activeTab]: {
            ...scores[activeTab],
            [criterionId]: { score: undefined }
          }
        };
      } else {
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
          updatedScores = {
            ...scores,
            [activeTab]: {
              ...scores[activeTab],
              [criterionId]: { score: numValue }
            }
          };
        } else {
          return; // Invalid value, don't update
        }
      }
      
      setScores(updatedScores);
      
      // Save to database after a short delay (debounce)
      debouncedSave(updatedScores, activeTab);
    }
  };

  const handleCommentsChange = (value) => {
    if (activeTab) {
      const updatedScores = {
        ...scores,
        [activeTab]: {
          ...scores[activeTab],
          comments: value
        }
      };
      
      setScores(updatedScores);
      
      // Save to database after a short delay (debounce)
      debouncedSave(updatedScores, activeTab);
    }
  };

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="judge-page">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (!judgeData) {
    return (
      <div className="judge-page">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>Error: No judge data available</h2>
        </div>
      </div>
    );
  }

  const activeContestantScores = activeTab && scores[activeTab] ? scores[activeTab] : {};

  // Calculate overall score for each contestant
  const calculateOverallScore = (contestantId) => {
    const contestantScores = scores[contestantId];
    if (!contestantScores) return null;

    let totalWeightedScore = 0;
    let totalWeight = 0;
    let hasAnyScore = false;

    criteria.forEach(criterion => {
      const criterionScore = contestantScores[criterion.id]?.score;
      const weight = parseFloat(criterion.points) || 0;

      if (criterionScore !== undefined && criterionScore !== null) {
        totalWeightedScore += criterionScore * weight;
        totalWeight += weight;
        hasAnyScore = true;
      }
    });

    if (!hasAnyScore || totalWeight === 0) return null;

    return totalWeightedScore / totalWeight;
  };

  // Get ranked contestants
  const getRankedContestants = () => {
    return contestants
      .map(contestant => ({
        ...contestant,
        overallScore: calculateOverallScore(contestant.id)
      }))
      .filter(contestant => contestant.overallScore !== null)
      .sort((a, b) => b.overallScore - a.overallScore)
      .map((contestant, index) => ({
        ...contestant,
        rank: index + 1
      }));
  };

  const rankedContestants = getRankedContestants();

  return (
    <div className="judge-page">
      {/* Header */}
      <div className="judge-header">
        <div className="judge-header-left">
          <span className="judge-label">Judge: {judgeData.name}</span>
        </div>
        <button className="judge-logout-btn" onClick={onLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} className="logout-icon" />
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="judge-content">
        {/* Main Title */}
        <div className="judge-main-title">
          <h2 style={{ 
            fontSize: '1rem', 
            color: '#70B2B2', 
            margin: '0 0 0.5rem 0',
            fontWeight: '500'
          }}>
            {judgeData.sub_event.event.title}
          </h2>
          <h1>{judgeData.sub_event.title}</h1>
        </div>

        {/* Navigation Tabs */}
        {contestants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            <p>No contestants have been added to this sub-event yet.</p>
            <p style={{ fontSize: '0.9rem', color: '#70B2B2' }}>Please contact the organizer to add contestants.</p>
          </div>
        ) : (
          <div className="judge-tabs">
            {contestants.map((contestant) => (
              <button
                key={contestant.id}
                className={`judge-tab ${activeTab === contestant.id ? 'active' : ''}`}
                onClick={() => setActiveTab(contestant.id)}
              >
                <FontAwesomeIcon icon={faUser} className="tab-icon" />
                {contestant.name}
              </button>
            ))}
            <button
              className={`judge-tab ${activeTab === 'Judge Ranking' ? 'active' : ''}`}
              onClick={() => setActiveTab('Judge Ranking')}
            >
              <FontAwesomeIcon icon={faStar} className="tab-icon" />
              Judge Ranking
            </button>
          </div>
        )}

        {/* Contestant Scoring Section */}
        {activeTab !== 'Judge Ranking' && activeTab && (
          <div className="scoring-section">
            <div className="contestant-heading">
              <h2>{contestants.find(c => c.id === activeTab)?.name}</h2>
              <p className="instruction-text">Score this contestant for each criterion</p>
            </div>

            {/* Scoring Criteria Cards */}
            {criteria.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <p>No criteria have been added to this sub-event yet.</p>
                <p style={{ fontSize: '0.9rem', color: '#70B2B2' }}>Please contact the organizer to add criteria.</p>
              </div>
            ) : (
              <div className="criteria-grid">
                {criteria.map((criterion) => (
                  <div key={criterion.id} className="criterion-card">
                    <h3 className="criterion-name">{criterion.name}</h3>
                    <p className="criterion-weight">Weight: {Math.round(criterion.points)}%</p>
                    <div className="score-input-container">
                      <input
                        type="number"
                        className="score-input"
                        min="0"
                        max="100"
                        value={activeContestantScores[criterion.id]?.score ?? ''}
                        onChange={(e) => handleScoreChange(criterion.id, e.target.value)}
                      />
                      <span className="score-unit">%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comments Section */}
            <div className="comments-section">
              <h3 className="comments-heading">COMMENTS:</h3>
              <textarea
                className="comments-textarea"
                placeholder="Enter comments here..."
                value={activeContestantScores.comments || ''}
                onChange={(e) => handleCommentsChange(e.target.value)}
              />
            </div>

            {/* Save Button */}
            <div className="save-section">
              <button 
                className="save-scores-btn" 
                onClick={handleSaveScores}
                disabled={saving}
              >
                <FontAwesomeIcon icon={faSave} className="save-icon" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              {saveMessage && (
                <p className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
                  {saveMessage}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Judge Ranking Section */}
        {activeTab === 'Judge Ranking' && (
          <div className="ranking-section">
            <h2>Judge Ranking</h2>
            {rankedContestants.length === 0 ? (
              <p style={{ color: '#70B2B2', marginTop: '1rem' }}>
                No scores have been entered yet. Please score contestants to see rankings.
              </p>
            ) : (
              <div className="ranking-table-container">
                <table className="ranking-table">
                  <thead>
                    <tr>
                      <th className="rank-col">Rank</th>
                      <th className="name-col">Contestant</th>
                      <th className="score-col">Overall Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedContestants.map((contestant) => (
                      <tr key={contestant.id} className="ranking-row">
                        <td className="rank-cell">
                          <span className={`rank-badge rank-${contestant.rank}`}>
                            {contestant.rank}
                          </span>
                        </td>
                        <td className="name-cell">{contestant.name}</td>
                        <td className="score-cell">
                          <span className="overall-score">
                            {contestant.overallScore.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JudgePage;
