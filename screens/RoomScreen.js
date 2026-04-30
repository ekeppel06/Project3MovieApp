import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { subscribeToRoom, subscribeToRoomMovies, leaveRoom, removeMovieFromRoom } from '../services/roomService';
import { posterUrl } from '../config/tmdb';
import { auth } from '../config/firebase';
 
export default function RoomScreen({ route, navigation }) {
  const { roomId } = route.params;
  const [room, setRoom] = useState(null);
  const [movies, setMovies] = useState([]);
  const currentUserId = auth.currentUser?.uid;
 
  // ─── Real-time subscriptions ─────────────────────────────────────────────
  // Both listeners fire immediately with current data, then again on every change.
  // onSnapshot returns an unsubscribe function — we call it in the cleanup.
 
  useEffect(() => {
    const unsubRoom = subscribeToRoom(roomId, (data) => {
      setRoom(data);
      navigation.setOptions({ title: data.name });
    });
 
    const unsubMovies = subscribeToRoomMovies(roomId, setMovies);
 
    return () => {
      unsubRoom();
      unsubMovies();
    };
  }, [roomId]);
 
  // ─── Actions ─────────────────────────────────────────────────────────────
 
  const handleShare = () => {
    Share.share({
      message: `Join my movie room "${room?.name}"! Use invite code: ${room?.inviteCode}`,
    });
  };
 
  const handleLeave = () => {
    Alert.alert('Leave Room', `Are you sure you want to leave "${room?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          await leaveRoom(roomId);
          navigation.goBack();
        },
      },
    ]);
  };
 
  const handleRemoveMovie = (movie) => {
    // Only the person who added it can remove it
    if (movie.addedBy !== currentUserId) {
      Alert.alert('Not allowed', 'Only the person who added this movie can remove it.');
      return;
    }
    Alert.alert('Remove Movie', `Remove "${movie.title}" from this room?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeMovieFromRoom(roomId, movie.id),
      },
    ]);
  };
 
  // ─── Render ──────────────────────────────────────────────────────────────
 
  if (!room) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#e50914" size="large" />
      </View>
    );
  }
 
  const renderMovie = ({ item }) => (
    <TouchableOpacity
      style={styles.movieCard}
      onLongPress={() => handleRemoveMovie(item)}
      activeOpacity={0.8}
    >
      {item.posterPath ? (
        <Image source={{ uri: posterUrl(item.posterPath, 'w185') }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.posterPlaceholder]}>
          <Text style={{ color: '#555', fontSize: 24 }}>🎬</Text>
        </View>
      )}
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.movieYear}>{item.releaseYear ?? ''}</Text>
        {item.voteAverage > 0 && (
          <Text style={styles.movieRating}>⭐ {item.voteAverage.toFixed(1)}</Text>
        )}
        <Text style={styles.addedBy}>Added by {item.addedByName}</Text>
      </View>
    </TouchableOpacity>
  );
 
  return (
    <View style={styles.container}>
      {/* Room header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{room.name}</Text>
          <Text style={styles.memberCount}>{room.memberIds.length} member{room.memberIds.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.inviteBtn} onPress={handleShare}>
            <Text style={styles.inviteCode}>{room.inviteCode}</Text>
            <Text style={styles.inviteLabel}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
 
      {/* Movie list */}
      <FlatList
        data={movies}
        keyExtractor={(item) => item.id}
        renderItem={renderMovie}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎬</Text>
            <Text style={styles.emptyTitle}>No movies yet</Text>
            <Text style={styles.emptySubtitle}>Be the first to add one!</Text>
          </View>
        }
      />
 
      {/* Add movie FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          navigation.navigate('MovieSearch', { roomId, roomName: room.name })
        }
      >
        <Text style={styles.fabText}>+ Add Movie</Text>
      </TouchableOpacity>
 
      {/* Leave room */}
      <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
        <Text style={styles.leaveBtnText}>Leave Room</Text>
      </TouchableOpacity>
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  memberCount: { color: '#888', fontSize: 13, marginTop: 2 },
  headerActions: { alignItems: 'center' },
  inviteBtn: { alignItems: 'center' },
  inviteCode: { color: '#e50914', fontSize: 20, fontWeight: '800', letterSpacing: 2 },
  inviteLabel: { color: '#888', fontSize: 11 },
  list: { padding: 12, paddingBottom: 140 },
  movieCard: {
    flexDirection: 'row',
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  poster: { width: 75, height: 112 },
  posterPlaceholder: {
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieInfo: { flex: 1, padding: 12, gap: 3 },
  movieTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  movieYear: { color: '#888', fontSize: 13 },
  movieRating: { color: '#f5c518', fontSize: 13 },
  addedBy: { color: '#555', fontSize: 12, marginTop: 4 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptySubtitle: { color: '#666', fontSize: 14, marginTop: 4 },
  fab: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: '#e50914',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  leaveBtn: { position: 'absolute', bottom: 18, alignSelf: 'center' },
  leaveBtnText: { color: '#555', fontSize: 13 },
});
