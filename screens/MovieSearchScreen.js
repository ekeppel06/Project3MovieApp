import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { searchMovies, posterUrl } from '../config/tmdb';
import { addMovieToRoom } from '../services/roomService';
 
//Debounces search bar to avoid firing a search on every keystroke
function useDebounce(fn, delay = 500) {
  const timer = { current: null };
  return useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}
 
export default function MovieSearchScreen({ route, navigation }) {
  const { roomId, roomName } = route.params;
 
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(null); //tmdbId of movie currently being added

  //Search handler
  const runSearch = useCallback(async (text) => {
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const movies = await searchMovies(text);
      setResults(movies);
    } catch (err) {
      Alert.alert('Search failed', err.message);
    } finally {
      setLoading(false);
    }
  }, []);
 
  const debouncedSearch = useDebounce(runSearch, 500);
 
  const handleChangeText = (text) => {
    setQuery(text);
    debouncedSearch(text);
  };
 
  //Add to Room Handler
  const handleAdd = async (movie) => {
    setAdding(movie.tmdbId);
    try {
      await addMovieToRoom(roomId, movie);
      Alert.alert('Added!', `"${movie.title}" was added to ${roomName}.`, [
        { text: 'Keep searching' },
        { text: 'Go to room', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Could not add', err.message);
    } finally {
      setAdding(null);
    }
  };
 
  //Render Movie
  const renderMovie = ({ item }) => {
    const isAdding = adding === item.tmdbId;
 
    return (
      <View style={styles.resultCard}>
        {/* Poster */}
        {item.posterPath ? (
          <Image
            source={{ uri: posterUrl(item.posterPath, 'w185') }}
            style={styles.poster}
          />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Text style={styles.posterPlaceholderText}>?</Text>
          </View>
        )}
 
        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.year}>{item.releaseYear ?? 'Unknown year'}</Text>
          {item.voteAverage > 0 && (
            <Text style={styles.rating}>⭐ {item.voteAverage.toFixed(1)}</Text>
          )}
          <Text style={styles.overview} numberOfLines={3}>
            {item.overview || 'No description available.'}
          </Text>
        </View>
 
        {/* Add button */}
        <TouchableOpacity
          style={[styles.addBtn, isAdding && styles.addBtnLoading]}
          onPress={() => handleAdd(item)}
          disabled={isAdding}
        >
          {isAdding ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.addBtnText}>+</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };
 
  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Search for a movie..."
          placeholderTextColor="#666"
          value={query}
          onChangeText={handleChangeText}
          autoFocus
          returnKeyType="search"
        />
        {loading && <ActivityIndicator color="#e50914" style={styles.spinner} />}
      </View>
 
      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => String(item.tmdbId)}
        renderItem={renderMovie}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !loading && query.length > 1 ? (
            <Text style={styles.emptyText}>No results for "{query}"</Text>
          ) : null
        }
      />
    </View>
  );
}
 
//MovieSearchScreen StyleSheet
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    margin: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 44,
    color: '#fff',
    fontSize: 15,
  },
  spinner: { marginLeft: 8 },
  list: { paddingHorizontal: 12, paddingBottom: 20 },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
    alignItems: 'center',
  },
  poster: { width: 70, height: 105 },
  posterPlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterPlaceholderText: { fontSize: 24, color: '#666' },
  info: { flex: 1, padding: 10, gap: 3 },
  title: { color: '#fff', fontWeight: '700', fontSize: 14 },
  year: { color: '#888', fontSize: 12 },
  rating: { color: '#f5c518', fontSize: 12 },
  overview: { color: '#aaa', fontSize: 12, lineHeight: 17, marginTop: 3 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e50914',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addBtnLoading: { backgroundColor: '#555' },
  addBtnText: { color: '#fff', fontSize: 22, fontWeight: '300' },
  emptyText: {
    color: '#555',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
});
