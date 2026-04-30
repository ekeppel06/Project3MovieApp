//This deals with firestore and the room creation/joining system

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
 
//Returns current user
function currentUser() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user;
}

//Generates invite code
function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
 
//Create a new room. Creator is automatically added as a member.
//Returns the new room's Firestore ID.
export async function createRoom({ name, description = '' }) {
  const user = currentUser();
 
  const roomRef = await addDoc(collection(db, 'rooms'), {
    name,
    description,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    memberIds: [user.uid],
    inviteCode: generateInviteCode(),
  });
 
  return roomRef.id;
}
 

//Join a room using its invite code, throws if the code is invalid.
//Returns the room ID.
export async function joinRoomByCode(inviteCode) {
  const user = currentUser();
 
  //Query for the room with this invite code
  const q = query(
    collection(db, 'rooms'),
    where('inviteCode', '==', inviteCode.toUpperCase())
  );
  const snapshot = await getDocs(q);
 
  if (snapshot.empty) {
    throw new Error('Invalid invite code. Please check and try again.');
  }
 
  const roomDoc = snapshot.docs[0];
  const roomData = roomDoc.data();
 
  //Returns roomID if already a member
  if (roomData.memberIds.includes(user.uid)) {
    return roomDoc.id;
  }
 
  //Add the user to the members array
  await updateDoc(roomDoc.ref, {
    memberIds: arrayUnion(user.uid),
  });
 
  return roomDoc.id;
}
 
//Leave a room. If the user is the last member, the room is deleted.
export async function leaveRoom(roomId) {
  const user = currentUser();
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
 
  if (!roomSnap.exists()) throw new Error('Room not found.');
 
  const { memberIds } = roomSnap.data();
 
  if (memberIds.length <= 1) {
    const moviesSnap = await getDocs(collection(db, 'rooms', roomId, 'movies'));
    const deletions = moviesSnap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletions);
    await deleteDoc(roomRef);
  } else {
    await updateDoc(roomRef, { memberIds: arrayRemove(user.uid) });
  }
}
 
//Fetch all rooms the current user is a member of.
export async function getUserRooms() {
  const user = currentUser();
 
  const q = query(
    collection(db, 'rooms'),
    where('memberIds', 'array-contains', user.uid)
  );
  const snapshot = await getDocs(q);
 
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}
 

//Real-time listener for a single room's data.
//Call the returned unsubscribe function to stop listening.
export function subscribeToRoom(roomId, onUpdate) {
  const roomRef = doc(db, 'rooms', roomId);
  return onSnapshot(roomRef, (snap) => {
    if (snap.exists()) {
      onUpdate({ id: snap.id, ...snap.data() });
    }
  });
}
 
//Add a movie to a room's sub-collection.
//`movieData` should be a normalized TMDB movie object.
 
export async function addMovieToRoom(roomId, movieData) {
  const user = currentUser();
 
  // Prevent duplicates — check if this TMDB ID is already in the room
  const existing = await getDocs(
    query(
      collection(db, 'rooms', roomId, 'movies'),
      where('tmdbId', '==', movieData.tmdbId)
    )
  );
 
  if (!existing.empty) {
    throw new Error(`"${movieData.title}" is already in this room.`);
  }
 
  await addDoc(collection(db, 'rooms', roomId, 'movies'), {
    ...movieData,
    addedBy: user.uid,
    addedByName: user.displayName || user.email || 'Anonymous',
    addedAt: serverTimestamp(),
  });
}
 
//Remove a movie from a room. Only the user who added it (or host) can remove it.
export async function removeMovieFromRoom(roomId, movieDocId) {
  await deleteDoc(doc(db, 'rooms', roomId, 'movies', movieDocId));
}
 
//Real-time listener for a room's movie list.
//Calls onUpdate with the full array whenever movies change.
export function subscribeToRoomMovies(roomId, onUpdate) {
  const moviesRef = collection(db, 'rooms', roomId, 'movies');
  return onSnapshot(moviesRef, (snapshot) => {
    const movies = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Sort by most recently added
    movies.sort((a, b) => {
      const ta = a.addedAt?.toMillis?.() ?? 0;
      const tb = b.addedAt?.toMillis?.() ?? 0;
      return tb - ta;
    });
    onUpdate(movies);
  });
}
 
