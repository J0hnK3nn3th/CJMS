import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './ScoreSheet.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faChartBar, faTimes, faPrint } from '@fortawesome/free-solid-svg-icons';
import { subEventService, scoreService } from './services/api';

const ScoreSheet = ({ subEvent, initialJudge = null, onClose }) => {
  const [judges, setJudges] = useState([]);
  const [contestants, setContestants] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [selectedJudge, setSelectedJudge] = useState(initialJudge);
  const [scores, setScores] = useState({});
  const [overallScores, setOverallScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [showOverall, setShowOverall] = useState(true); // Default to showing overall scores
  const printContentRef = useRef(null);

  useEffect(() => {
    fetchSubEventData();
  }, [subEvent]);

  const fetchSubEventData = async () => {
    try {
      setLoading(true);
      const settings = await subEventService.getSubEventSettings(subEvent.id);
      
      setContestants(settings.contestants || []);
      setCriteria(settings.criteria || []);
      
      // Sort judges: chairman first, then regular judges
      const judgesList = (settings.judges || []).sort((a, b) => {
        if (a.type === 'chairman' && b.type !== 'chairman') return -1;
        if (a.type !== 'chairman' && b.type === 'chairman') return 1;
        return a.order - b.order;
      });
      setJudges(judgesList);
      
      // Fetch scores for all judges to calculate overall scores
      await fetchAllScores(judgesList, settings.contestants || [], settings.criteria || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sub-event data:', error);
      setLoading(false);
    }
  };

  const fetchAllScores = async (judgesList, contestantsList, criteriaList) => {
    const allScores = {};
    
    // Fetch scores for each judge
    for (const judge of judgesList) {
      try {
        const judgeScores = await scoreService.getJudgeScores(judge.id);
        allScores[judge.id] = judgeScores;
      } catch (error) {
        console.error(`Error fetching scores for judge ${judge.id}:`, error);
        allScores[judge.id] = { scores: {}, comments: {} };
      }
    }
    
    setScores(allScores);
    
    // Calculate overall scores (average across all judges)
    calculateOverallScores(allScores, judgesList, contestantsList, criteriaList);
  };

  const calculateOverallScores = (allScores, judgesList, contestantsList = null, criteriaList = null) => {
    const overall = {};
    
    // Use provided lists or fall back to state
    const currentContestants = contestantsList || contestants;
    const currentCriteria = criteriaList || criteria;
    
    // If we don't have contestants/criteria yet, return early
    if (!currentContestants || currentContestants.length === 0 || 
        !currentCriteria || currentCriteria.length === 0) {
      return;
    }
    
    currentContestants.forEach(contestant => {
      overall[contestant.id] = {};
      currentCriteria.forEach(criterion => {
        const scoresForCriterion = [];
        
        // Get scores from all judges for this contestant and criterion
        judgesList.forEach(judge => {
          const judgeScores = allScores[judge.id]?.scores || {};
          const contestantScores = judgeScores[contestant.id] || {};
          const score = contestantScores[criterion.id];
          
          if (score !== null && score !== undefined) {
            scoresForCriterion.push(score);
          }
        });
        
        // Calculate average
        if (scoresForCriterion.length > 0) {
          const sum = scoresForCriterion.reduce((a, b) => a + b, 0);
          overall[contestant.id][criterion.id] = Math.round((sum / scoresForCriterion.length) * 100) / 100;
        } else {
          overall[contestant.id][criterion.id] = null;
        }
      });
    });
    
    setOverallScores(overall);
  };
  
  // Recalculate overall scores when contestants or criteria change
  useEffect(() => {
    if (contestants.length > 0 && criteria.length > 0 && Object.keys(scores).length > 0 && judges.length > 0) {
      calculateOverallScores(scores, judges);
    }
  }, [contestants, criteria, scores, judges]);

  const handleJudgeClick = (judge) => {
    setSelectedJudge(judge);
    setShowOverall(false);
  };

  const handleOverallClick = () => {
    setSelectedJudge(null);
    setShowOverall(true);
  };

  // Set initial view based on initialJudge prop
  useEffect(() => {
    if (initialJudge) {
      setSelectedJudge(initialJudge);
      setShowOverall(false);
    } else {
      setSelectedJudge(null);
      setShowOverall(true);
    }
  }, [initialJudge]);

  const getDisplayScores = () => {
    if (showOverall) {
      return overallScores;
    }
    
    if (selectedJudge) {
      const judgeScores = scores[selectedJudge.id];
      return judgeScores?.scores || {};
    }
    
    return {};
  };

  const getDisplayComments = () => {
    if (showOverall || !selectedJudge) {
      return {};
    }
    
    const judgeScores = scores[selectedJudge.id];
    return judgeScores?.comments || {};
  };

  const calculateTotalScore = (contestantId) => {
    const contestantScores = getDisplayScores()[contestantId] || {};
    let total = 0;
    
    criteria.forEach(criterion => {
      const score = contestantScores[criterion.id];
      if (score !== null && score !== undefined) {
        // Apply criterion weight (points percentage)
        const weight = parseFloat(criterion.points) || 0;
        total += (score * weight) / 100;
      }
    });
    
    return Math.round(total * 100) / 100;
  };

  // Calculate rankings based on total scores
  const getRankings = () => {
    if (contestants.length === 0) return {};
    
    // Calculate total scores for all contestants
    const contestantTotals = contestants.map(contestant => ({
      id: contestant.id,
      totalScore: calculateTotalScore(contestant.id)
    }));
    
    // Sort by total score (descending)
    contestantTotals.sort((a, b) => b.totalScore - a.totalScore);
    
    // Assign ranks
    const rankings = {};
    let currentRank = 1;
    let previousScore = null;
    
    contestantTotals.forEach((contestant, index) => {
      // If scores are equal, use the same rank
      if (previousScore !== null && contestant.totalScore === previousScore) {
        rankings[contestant.id] = currentRank;
      } else {
        currentRank = index + 1;
        rankings[contestant.id] = currentRank;
      }
      previousScore = contestant.totalScore;
    });
    
    return rankings;
  };

  const handlePrintAll = () => {
    // Trigger print
    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (loading) {
    return (
      <div className="score-sheet-modal">
        <div className="score-sheet-container">
          <div className="loading-state">Loading scores...</div>
        </div>
      </div>
    );
  }

  const displayScores = getDisplayScores();
  const displayComments = getDisplayComments();
  const currentJudgeName = showOverall ? 'Overall Scores' : (selectedJudge?.name || 'Select a judge');
  const rankings = getRankings();

  // Render print content to document body
  const printContent = (
    <div className="print-all-scoresheets" ref={printContentRef}>
        {/* Print all judges' score sheets */}
        {judges.map((judge) => {
          const judgeScores = scores[judge.id]?.scores || {};
          const judgeComments = scores[judge.id]?.comments || {};
          
          // Calculate judge number (excluding chairman)
          const regularJudges = judges.filter(j => j.type !== 'chairman');
          const judgeNumber = judge.type === 'chairman' 
            ? null 
            : regularJudges.indexOf(judge) + 1;
          
          const calculateJudgeTotalScore = (contestantId) => {
            const contestantScores = judgeScores[contestantId] || {};
            let total = 0;
            
            criteria.forEach(criterion => {
              const score = contestantScores[criterion.id];
              if (score !== null && score !== undefined) {
                const weight = parseFloat(criterion.points) || 0;
                total += (score * weight) / 100;
              }
            });
            
            return Math.round(total * 100) / 100;
          };

          // Calculate rankings for this judge
          const judgeRankings = (() => {
            if (contestants.length === 0) return {};
            
            const contestantTotals = contestants.map(contestant => ({
              id: contestant.id,
              totalScore: calculateJudgeTotalScore(contestant.id)
            }));
            
            contestantTotals.sort((a, b) => b.totalScore - a.totalScore);
            
            const rankings = {};
            let currentRank = 1;
            let previousScore = null;
            
            contestantTotals.forEach((contestant, index) => {
              if (previousScore !== null && contestant.totalScore === previousScore) {
                rankings[contestant.id] = currentRank;
              } else {
                currentRank = index + 1;
                rankings[contestant.id] = currentRank;
              }
              previousScore = contestant.totalScore;
            });
            
            return rankings;
          })();
          
          const sortedContestants = [...contestants].sort((a, b) => {
            const rankA = judgeRankings[a.id] || 999;
            const rankB = judgeRankings[b.id] || 999;
            return rankA - rankB;
          });
          
          return (
            <div key={judge.id} className="print-scoresheet-page">
              <div className="print-header">
                <h1>{subEvent.title}</h1>
                <p className="print-subtitle">
                  {subEvent.date} at {subEvent.time} • {subEvent.location}
                </p>
              </div>
              
              <div className="print-table-container">
                <table className="print-table">
                  <thead>
                    <tr>
                      <th>Contestant</th>
                      {criteria.map(criterion => (
                        <th key={criterion.id}>
                          {criterion.name} ({criterion.points}%)
                        </th>
                      ))}
                      <th>Total Score</th>
                      <th>Comments</th>
                      <th>Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedContestants.map(contestant => {
                      const contestantScores = judgeScores[contestant.id] || {};
                      const totalScore = calculateJudgeTotalScore(contestant.id);
                      const comments = judgeComments[contestant.id] || '';
                      const rank = judgeRankings[contestant.id] || '-';
                      
                      return (
                        <tr key={contestant.id}>
                          <td className="contestant-name">{contestant.name}</td>
                          {criteria.map(criterion => {
                            const score = contestantScores[criterion.id];
                            return (
                              <td key={criterion.id} className="score-cell">
                                {score !== null && score !== undefined ? `${score}%` : '-'}
                              </td>
                            );
                          })}
                          <td className="total-score">{totalScore.toFixed(2)}</td>
                          <td className="comments-cell">{comments || '-'}</td>
                          <td className="rank-cell">{rank}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="print-judge-info">
                <p className="print-judge-name">{judge.name}</p>
                <p className="print-judge-number">
                  {judge.type === 'chairman' 
                    ? 'Chairman of the Board'
                    : `Judge ${judgeNumber}`}
                </p>
              </div>
            </div>
          );
        })}
        
        {/* Overall Score Sheet */}
        <div className="print-scoresheet-page">
          <div className="print-header">
            <h1>{subEvent.title}</h1>
            <p className="print-subtitle">
              {subEvent.date} at {subEvent.time} • {subEvent.location}
            </p>
          </div>
          
          <div className="print-table-container">
            <table className="print-table">
              <thead>
                <tr>
                  <th>Contestant</th>
                  {criteria.map(criterion => (
                    <th key={criterion.id}>
                      {criterion.name} ({criterion.points}%)
                    </th>
                  ))}
                  <th>Total Score</th>
                  <th>Rank</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const sortedContestants = [...contestants].sort((a, b) => {
                    const rankA = rankings[a.id] || 999;
                    const rankB = rankings[b.id] || 999;
                    return rankA - rankB;
                  });
                  
                  return sortedContestants.map(contestant => {
                    const contestantScores = overallScores[contestant.id] || {};
                    const totalScore = calculateTotalScore(contestant.id);
                    const rank = rankings[contestant.id] || '-';
                    
                    return (
                      <tr key={contestant.id}>
                        <td className="contestant-name">{contestant.name}</td>
                        {criteria.map(criterion => {
                          const score = contestantScores[criterion.id];
                          return (
                            <td key={criterion.id} className="score-cell">
                              {score !== null && score !== undefined ? `${score}%` : '-'}
                            </td>
                          );
                        })}
                        <td className="total-score">{totalScore.toFixed(2)}</td>
                        <td className="rank-cell">{rank}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
          
          <div className="print-judges-list">
            {judges.map((judge) => {
              const regularJudges = judges.filter(j => j.type !== 'chairman');
              const judgeNumber = judge.type === 'chairman' 
                ? null 
                : regularJudges.indexOf(judge) + 1;
              
              return (
                <div key={judge.id} className="print-judge-info">
                  <p className="print-judge-name">{judge.name}</p>
                  <p className="print-judge-number">
                    {judge.type === 'chairman' 
                      ? 'Chairman of the Board'
                      : `Judge ${judgeNumber}`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
    </div>
  );

  return (
    <>
      <div className="score-sheet-modal">
        <div className="score-sheet-container">
          <div className="score-sheet-header">
            <div>
              <h2>{subEvent.title}</h2>
              <p className="score-sheet-subtitle">
                {subEvent.date} at {subEvent.time} • {subEvent.location}
              </p>
            </div>
            <div className="score-sheet-header-actions">
              <button className="score-sheet-print-btn" onClick={handlePrintAll} title="Print All Score Sheets">
                <FontAwesomeIcon icon={faPrint} />
                <span>Print All</span>
              </button>
              <button className="score-sheet-close-btn" onClick={onClose}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>

          <div className="score-sheet-content">
            <div className="judges-section">
              <h3>Judges</h3>
              <div className="judges-list">
                {judges.map((judge, index) => (
                  <button
                    key={judge.id}
                    className={`judge-button ${selectedJudge?.id === judge.id ? 'active' : ''}`}
                    onClick={() => handleJudgeClick(judge)}
                  >
                    <FontAwesomeIcon icon={faUser} />
                    <span>
                      {judge.type === 'chairman' ? 'Chairman of the Board' : `Judge ${index}`}
                    </span>
                  </button>
                ))}
                <button
                  className={`judge-button overall-button ${showOverall ? 'active' : ''}`}
                  onClick={handleOverallClick}
                >
                  <FontAwesomeIcon icon={faChartBar} />
                  <span>Overall Scores</span>
                </button>
              </div>
            </div>

            <div className="scores-section">
              <div className="scores-header">
                <h3>{currentJudgeName}</h3>
              </div>
              
              {contestants.length === 0 ? (
                <div className="no-data">No contestants available</div>
              ) : (
                <div className="scores-table-container">
                  <table className="scores-table">
                    <thead>
                      <tr>
                        <th>Contestant</th>
                        {criteria.map(criterion => (
                          <th key={criterion.id}>
                            {criterion.name} ({criterion.points}%)
                          </th>
                        ))}
                        <th>Total Score</th>
                        {!showOverall && <th>Comments</th>}
                        <th>Rank</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Sort contestants by rank for display
                        const sortedContestants = [...contestants].sort((a, b) => {
                          const rankA = rankings[a.id] || 999;
                          const rankB = rankings[b.id] || 999;
                          return rankA - rankB;
                        });
                        
                        return sortedContestants.map(contestant => {
                          const contestantScores = displayScores[contestant.id] || {};
                          const totalScore = calculateTotalScore(contestant.id);
                          const comments = displayComments[contestant.id] || '';
                          const rank = rankings[contestant.id] || '-';
                          
                          return (
                            <tr key={contestant.id}>
                              <td className="contestant-name">{contestant.name}</td>
                              {criteria.map(criterion => {
                                const score = contestantScores[criterion.id];
                                return (
                                  <td key={criterion.id} className="score-cell">
                                    {score !== null && score !== undefined ? `${score}%` : '-'}
                                  </td>
                                );
                              })}
                              <td className="total-score">{totalScore.toFixed(2)}</td>
                              {!showOverall && (
                                <td className="comments-cell">{comments || '-'}</td>
                              )}
                              <td className="rank-cell">{rank}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Content - Rendered to document body */}
      {createPortal(printContent, document.body)}
    </>
  );
};

export default ScoreSheet;

