import { LeaderboardEntry } from '../utils/categoryGamification';
import './GamificationLeaderboard.css';

export interface GamificationLeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  onClose?: () => void;
  collaborative?: boolean;
}

export function GamificationLeaderboard({
  entries,
  currentUserId,
  onClose,
  collaborative = false,
}: GamificationLeaderboardProps) {
  const sortedEntries = [...entries].sort((a, b) => b.score - a.score);
  const topThree = sortedEntries.slice(0, 3);
  const rest = sortedEntries.slice(3);

  const currentUserEntry = sortedEntries.find(e => e.userId === currentUserId);
  const currentUserRank = currentUserEntry
    ? sortedEntries.findIndex(e => e.userId === currentUserId) + 1
    : null;

  return (
    <div className="gamification-leaderboard">
      {onClose && (
        <div className="leaderboard-header">
          <h2>
            <span className="leaderboard-icon">🏆</span>
            Category Creators
          </h2>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
      )}

      {collaborative && (
        <div className="collaborative-message">
          <span className="collaborative-icon">🤝</span>
          <p>Collaborate to create the best organized list together!</p>
        </div>
      )}

      {currentUserEntry && currentUserRank && (
        <div className="current-user-rank">
          <div className="rank-badge">#{currentUserRank}</div>
          <div className="rank-info">
            <span className="rank-label">Your Rank</span>
            <span className="rank-score">{currentUserEntry.score} points</span>
          </div>
        </div>
      )}

      {topThree.length > 0 && (
        <div className="leaderboard-podium">
          {topThree.map((entry, index) => {
            const rank = index + 1;
            const isCurrentUser = entry.userId === currentUserId;

            return (
              <PodiumCard
                key={entry.userId}
                entry={entry}
                rank={rank}
                isCurrentUser={isCurrentUser}
              />
            );
          })}
        </div>
      )}

      {rest.length > 0 && (
        <div className="leaderboard-list">
          <h3 className="leaderboard-section-title">All Contributors</h3>
          {rest.map((entry, index) => {
            const rank = index + 4;
            const isCurrentUser = entry.userId === currentUserId;

            return (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                rank={rank}
                isCurrentUser={isCurrentUser}
              />
            );
          })}
        </div>
      )}

      {entries.length === 0 && (
        <div className="leaderboard-empty">
          <span className="empty-icon">📊</span>
          <p>No category creators yet</p>
          <p className="empty-hint">Be the first to create a custom category!</p>
        </div>
      )}
    </div>
  );
}

interface PodiumCardProps {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
}

function PodiumCard({ entry, rank, isCurrentUser }: PodiumCardProps) {
  const podiumColors = {
    1: { bg: '#FFD700', icon: '🥇', height: '120px' },
    2: { bg: '#C0C0C0', icon: '🥈', height: '100px' },
    3: { bg: '#CD7F32', icon: '🥉', height: '80px' },
  };

  const style = podiumColors[rank as 1 | 2 | 3];

  return (
    <div
      className={`podium-card ${isCurrentUser ? 'current-user' : ''}`}
      style={{ height: style.height }}
    >
      <div className="podium-rank" style={{ backgroundColor: style.bg }}>
        {style.icon}
      </div>
      <div className="podium-avatar">
        {getInitials(entry.userName)}
      </div>
      <div className="podium-name" title={entry.userName}>
        {isCurrentUser ? 'You' : entry.userName}
      </div>
      <div className="podium-score">{entry.score}</div>
      <div className="podium-stats">
        <span title="Categories created">📚 {entry.categoriesCreated}</span>
        <span title="Items using categories">📦 {entry.totalUsage}</span>
      </div>
    </div>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
}

function LeaderboardRow({ entry, rank, isCurrentUser }: LeaderboardRowProps) {
  return (
    <div className={`leaderboard-row ${isCurrentUser ? 'current-user' : ''}`}>
      <div className="row-rank">#{rank}</div>
      <div className="row-avatar">
        {getInitials(entry.userName)}
      </div>
      <div className="row-info">
        <div className="row-name" title={entry.userName}>
          {isCurrentUser ? 'You' : entry.userName}
        </div>
        <div className="row-email" title={entry.userEmail}>
          {entry.userEmail}
        </div>
      </div>
      <div className="row-stats">
        <span className="row-stat" title="Categories created">
          <span className="stat-icon">📚</span>
          {entry.categoriesCreated}
        </span>
        <span className="row-stat" title="Items using categories">
          <span className="stat-icon">📦</span>
          {entry.totalUsage}
        </span>
      </div>
      <div className="row-score">{entry.score}</div>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function GamificationLeaderboardCompact({
  entries,
  currentUserId,
}: Pick<GamificationLeaderboardProps, 'entries' | 'currentUserId'>) {
  const topThree = entries.sort((a, b) => b.score - a.score).slice(0, 3);

  if (topThree.length === 0) {
    return null;
  }

  return (
    <div className="leaderboard-compact">
      <div className="leaderboard-compact-header">
        <span className="leaderboard-compact-icon">🏆</span>
        <span className="leaderboard-compact-title">Top Contributors</span>
      </div>
      <div className="leaderboard-compact-list">
        {topThree.map((entry, index) => {
          const isCurrentUser = entry.userId === currentUserId;
          const medals = ['🥇', '🥈', '🥉'];

          return (
            <div
              key={entry.userId}
              className={`leaderboard-compact-item ${isCurrentUser ? 'current-user' : ''}`}
            >
              <span className="compact-medal">{medals[index]}</span>
              <span className="compact-name" title={entry.userName}>
                {isCurrentUser ? 'You' : entry.userName}
              </span>
              <span className="compact-score">{entry.score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
