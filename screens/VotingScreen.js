import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { castVote, calculateWinner } from '../services/votingService';
import { subscribeToRoom, subscribeToRoomMovies } from '../services/roomService';
import { posterUrl } from '../config/tmdb';
import { auth } from '../config/firebase';
 
export default function VotingScreen({ route, navigation }) {
  const { roomId } = route.params;
  const [room, setRoom] = useState(null);
  const [movies, setMovies] = useState([]);
  const [voting, setVoting] = useState(false);
  const currentUserId = auth.currentUser?.uid;
 
  useEffect(() => {
    const unsubRoom = subscribeToRoom(roomId, setRoom);
    const unsubMovies = subscribeToRoomMovies(roomId, setMovies);
    return () => { unsubRoom(); unsubMovies(); };
  }, [roomId]);
 
  if (!room) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#e50914" size="large" />
      </View>
    );
  }
 
  const votes = room.votes || {};
  const isVotingActive = room.votingActive === true;
  const votingEnded = !isVotingActive && room.votingEndedAt;
  const myVotedId = Object.entries(votes).find(
    ([, voters]) => voters[currentUserId]
  )?.[0];
 
  const winner = votingEnded ? calculateWinner(votes, movies) : null;
 
  const totalVoters = () => {
    const voterSet = new Set();
    Object.values(votes).forEach((voters) =>
      Object.keys(voters).forEach((uid) => voterSet.add(uid))
    );
    return voterSet.size;
  };
 
  const handleVote = async (tmdbId) => {
    if (!isVotingActive || voting) return;
    setVoting(true);
    try {
      await castVote(roomId, tmdbId, votes);
    } catch (err) {
      console.error(err);
    } finally {
      setVoting(false);
    }
  };
 
  // ─── Winner screen ──────────────────────────────────────────────────────
  if (votingEnded) {
    return (
      <View style={styles.container}>
        {winner ? (
          <View style={styles.winnerContainer}>
            <Text style={styles.winnerLabel}>🏆 The Room Picks</Text>
            <Text style={styles.winnerTitle}>{winner.title}</Text>
            <Text style={styles.winnerYear}>{winner.releaseYear}</Text>
 
            {winner.posterPath && (
              <Image
                source={{ uri: posterUrl(winner.posterPath, 'w342') }}
                style={styles.winnerPoster}
              />
            )}
 
            <View style={styles.winnerVotes}>
              <Text style={styles.winnerVoteCount}>{winner.voteCount}</Text>
              <Text style={styles.winnerVoteLabel}>
                {winner.voteCount === 1 ? 'vote' : 'votes'} out of {totalVoters()} cast
              </Text>
            </View>
 
            {/* Full results */}
            <Text style={styles.resultsHeader}>Full Results</Text>
            {movies
              .map((m) => ({
                ...m,
                count: Object.keys(votes[m.tmdbId] || {}).length,
              }))
              .sort((a, b) => b.count - a.count)
              .map((m) => (
                <View key={m.id} style={styles.resultRow}>
                  <Text style={styles.resultTitle} numberOfLines={1}>{m.title}</Text>
                  <View style={styles.resultBarWrap}>
                    <View
                      style={[
                        styles.resultBar,
                        {
                          width: `${totalVoters() > 0 ? (m.count / totalVoters()) * 100 : 0}%`,
                          backgroundColor:
                            String(m.tmdbId) === String(winner?.tmdbId)
                              ? '#e50914'
                              : '#333',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.resultCount}>{m.count}</Text>
                </View>
              ))}
          </View>
        ) : (
          <View style={styles.centered}>
            <Text style={styles.noVotesEmoji}>🤷</Text>
            <Text style={styles.noVotesText}>No votes were cast</Text>
          </View>
        )}
      </View>
    );
  }
 
  // ─── Ballot ─────────────────────────────────────────────────────────────
  const renderMovie = ({ item }) => {
    const voteCount = Object.keys(votes[item.tmdbId] || {}).length;
    const isMyVote = String(myVotedId) === String(item.tmdbId);
 
    return (
      <TouchableOpacity
        style={[styles.ballotCard, isMyVote && styles.ballotCardVoted]}
        onPress={() => handleVote(item.tmdbId)}
        disabled={!isVotingActive || voting}
        activeOpacity={0.75}
      >
        {item.posterPath && (
          <Image
            source={{ uri: posterUrl(item.posterPath, 'w185') }}
            style={styles.ballotPoster}
          />
        )}
 
        <View style={styles.ballotInfo}>
          <Text style={styles.ballotTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.ballotYear}>{item.releaseYear}</Text>
 
          {/* Live vote bar */}
          <View style={styles.voteBarWrap}>
            <View
              style={[
                styles.voteBar,
                {
                  width: `${totalVoters() > 0 ? (voteCount / totalVoters()) * 100 : 0}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.voteCount}>
            {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
          </Text>
        </View>
 
        {/* Vote indicator */}
        <View style={[styles.voteBtn, isMyVote && styles.voteBtnActive]}>
          <Text style={styles.voteBtnText}>{isMyVote ? '✓' : '+'}</Text>
        </View>
      </TouchableOpacity>
    );
  };
 
  return (
    <View style={styles.container}>
      {/* Status banner */}
      <View style={[styles.banner, isVotingActive ? styles.bannerActive : styles.bannerIdle]}>
        <Text style={styles.bannerText}>
          {isVotingActive
            ? `🗳  Voting is open · ${totalVoters()} voted`
            : '⏸  Voting has not started yet'}
        </Text>
        {myVotedId && isVotingActive && (
          <Text style={styles.bannerSub}>Tap your pick again to remove your vote</Text>
        )}
      </View>
 
      <FlatList
        data={movies}
        keyExtractor={(item) => item.id}
        renderItem={renderMovie}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No movies in this room yet.</Text>
        }
      />
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  banner: { padding: 12, alignItems: 'center' },
  bannerActive: { backgroundColor: '#1a3a1a' },
  bannerIdle: { backgroundColor: '#1e1e1e' },
  bannerText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  bannerSub: { color: '#666', fontSize: 12, marginTop: 3 },
  list: { padding: 12, paddingBottom: 40 },
  ballotCard: {
    flexDirection: 'row',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  ballotCardVoted: { borderColor: '#e50914' },
  ballotPoster: { width: 65, height: 97 },
  ballotInfo: { flex: 1, padding: 10, gap: 3 },
  ballotTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  ballotYear: { color: '#888', fontSize: 12 },
  voteBarWrap: { height: 4, backgroundColor: '#2a2a2a', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  voteBar: { height: 4, backgroundColor: '#e50914', borderRadius: 2 },
  voteCount: { color: '#888', fontSize: 12, marginTop: 3 },
  voteBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  voteBtnActive: { backgroundColor: '#e50914' },
  voteBtnText: { color: '#fff', fontSize: 18, fontWeight: '300' },
 
  // Winner screen
  winnerContainer: { padding: 24, alignItems: 'center' },
  winnerLabel: { color: '#f5c518', fontSize: 14, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  winnerTitle: { color: '#fff', fontSize: 26, fontWeight: '800', textAlign: 'center' },
  winnerYear: { color: '#888', fontSize: 14, marginBottom: 16 },
  winnerPoster: { width: 160, height: 240, borderRadius: 12, marginBottom: 16 },
  winnerVotes: { alignItems: 'center', marginBottom: 24 },
  winnerVoteCount: { color: '#e50914', fontSize: 48, fontWeight: '800' },
  winnerVoteLabel: { color: '#888', fontSize: 14 },
  resultsHeader: { color: '#555', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, alignSelf: 'flex-start', marginBottom: 10 },
  resultRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 8, gap: 8 },
  resultTitle: { color: '#aaa', fontSize: 13, width: 130 },
  resultBarWrap: { flex: 1, height: 6, backgroundColor: '#2a2a2a', borderRadius: 3, overflow: 'hidden' },
  resultBar: { height: 6, borderRadius: 3 },
  resultCount: { color: '#888', fontSize: 13, width: 20, textAlign: 'right' },
  noVotesEmoji: { fontSize: 48, marginBottom: 12 },
  noVotesText: { color: '#888', fontSize: 16 },
});
