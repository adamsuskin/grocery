import { Challenge, dismissChallenge } from '../utils/categoryGamification';
import './GamificationChallenges.css';

export interface GamificationChallengesProps {
  listId: string;
  challenges: Challenge[];
  onDismiss?: (challengeId: string) => void;
  maxVisible?: number;
}

export function GamificationChallenges({
  listId,
  challenges,
  onDismiss,
  maxVisible = 3,
}: GamificationChallengesProps) {
  const visibleChallenges = challenges.slice(0, maxVisible);

  if (visibleChallenges.length === 0) {
    return null;
  }

  const handleDismiss = (challengeId: string) => {
    dismissChallenge(listId, challengeId);
    if (onDismiss) {
      onDismiss(challengeId);
    }
  };

  return (
    <div className="gamification-challenges">
      <h3 className="challenges-header">
        <span className="challenges-icon">🎯</span>
        Challenges & Tips
      </h3>
      <div className="challenges-list">
        {visibleChallenges.map(challenge => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
}

interface ChallengeCardProps {
  challenge: Challenge;
  onDismiss: (challengeId: string) => void;
}

function ChallengeCard({ challenge, onDismiss }: ChallengeCardProps) {
  const typeStyles = {
    tip: { bg: '#E3F2FD', border: '#2196F3', icon: '💡' },
    goal: { bg: '#FFF3E0', border: '#FF9800', icon: '🎯' },
    milestone: { bg: '#F3E5F5', border: '#9C27B0', icon: '🏆' },
  };

  const style = typeStyles[challenge.type];

  return (
    <div
      className={`challenge-card challenge-${challenge.type}`}
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
      }}
    >
      <div className="challenge-icon">{challenge.icon}</div>
      <div className="challenge-content">
        <div className="challenge-header">
          <h4 className="challenge-title">{challenge.title}</h4>
          <span className="challenge-type-badge" style={{ backgroundColor: style.border }}>
            {challenge.type}
          </span>
        </div>
        <p className="challenge-description">{challenge.description}</p>
      </div>
      {challenge.dismissible && (
        <button
          className="challenge-dismiss"
          onClick={() => onDismiss(challenge.id)}
          aria-label="Dismiss challenge"
          title="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}

export function GamificationChallengesCompact({
  listId,
  challenges,
  onDismiss,
}: Omit<GamificationChallengesProps, 'maxVisible'>) {
  const topChallenge = challenges[0];

  if (!topChallenge) {
    return null;
  }

  const handleDismiss = (challengeId: string) => {
    dismissChallenge(listId, challengeId);
    if (onDismiss) {
      onDismiss(challengeId);
    }
  };

  return (
    <div className="gamification-challenge-compact">
      <div className="challenge-compact-icon">{topChallenge.icon}</div>
      <div className="challenge-compact-content">
        <p className="challenge-compact-text">{topChallenge.description}</p>
      </div>
      {topChallenge.dismissible && (
        <button
          className="challenge-compact-dismiss"
          onClick={() => handleDismiss(topChallenge.id)}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}
