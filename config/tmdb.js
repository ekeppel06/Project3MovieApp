//Config file for TMDB (The Movie Database)

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
 
//Image sizing
export const posterUrl = (path, size = 'w342') =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
 
export const backdropUrl = (path, size = 'w780') =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
 

//Search TMDB for movies by title query.
//Returns an array of movie objects.
export async function searchMovies(query) {
  if (!query || query.trim().length === 0) return [];
 
  const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
    query
  )}&include_adult=false&language=en-US&page=1`;
 
  const response = await fetch(url);
  if (!response.ok) throw new Error(`TMDB search failed: ${response.status}`);
 
  const data = await response.json();
 
  return data.results.map(normalizeMovie);
}
 

//Fetch full details for a single movie by its TMDB ID.

export async function getMovieDetails(tmdbId) {
  const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`;
 
  const response = await fetch(url);
  if (!response.ok) throw new Error(`TMDB details failed: ${response.status}`);
 
  const data = await response.json();
  return normalizeMovieDetails(data);
}
 
 
//Strips TMDB search result down to only what is stored in Firestore.
export function normalizeMovie(tmdbMovie) {
  return {
    tmdbId: tmdbMovie.id,
    title: tmdbMovie.title,
    overview: tmdbMovie.overview || '',
    posterPath: tmdbMovie.poster_path || null,
    backdropPath: tmdbMovie.backdrop_path || null,
    releaseYear: tmdbMovie.release_date
      ? new Date(tmdbMovie.release_date).getFullYear()
      : null,
    voteAverage: tmdbMovie.vote_average ?? null,
    popularity: tmdbMovie.popularity ?? null,
  };
}
 
export function normalizeMovieDetails(tmdbMovie) {
  return {
    ...normalizeMovie(tmdbMovie),
    genres: tmdbMovie.genres?.map((g) => g.name) ?? [],
    runtime: tmdbMovie.runtime ?? null,
    tagline: tmdbMovie.tagline || null,
  };
}
