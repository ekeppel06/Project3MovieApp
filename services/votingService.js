//This deals with the voting process

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

//Returns current user (to differentiate from other users' votes)
function currentUser() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user;
}

//Host starts voting mode. Clears any previous votes.
export async function startVoting(roomId) {
  const user = currentUser();
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
 
  if (roomSnap.data().createdBy !== user.uid) {
    throw new Error('Only the host can start voting.');
  }
 
  await updateDoc(roomRef, {
    votingActive: true,
    votingEndedAt: null,
    votes: {}, // clear previous votes
  });
}
 

//Host ends voting mode. Records the end timestamp.
export async function endVoting(roomId) {
  const user = currentUser();
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
 
  if (roomSnap.data().createdBy !== user.uid) {
    throw new Error('Only the host can end voting.');
  }
 
  await updateDoc(roomRef, {
    votingActive: false,
    votingEndedAt: serverTimestamp(),
  });
}
 
/*
  Cast or retract a vote for a movie.
  Each user gets one vote total — voting for a new movie moves their vote.
  Voting for the same movie again removes their vote (aka a toggle).
 */
export async function castVote(roomId, tmdbId, currentVotes = {}) {
  const user = currentUser();
  const roomRef = doc(db, 'rooms', roomId);
 
  //Build the updated votes map
  //First remove this user's vote from any movie they previously voted for
  const updatedVotes = {};
  for (const [id, voters] of Object.entries(currentVotes)) {
    const { [user.uid]: _, ...rest } = voters; // remove user's vote
    updatedVotes[id] = rest;
  }
 
  //Check if they're toggling off (voted for this movie already)
  const alreadyVoted = currentVotes[tmdbId]?.[user.uid];
  if (!alreadyVoted) {
    //Add their vote to the new movie
    updatedVotes[tmdbId] = {
      ...(updatedVotes[tmdbId] || {}),
      [user.uid]: true,
    };
  }
 
  await updateDoc(roomRef, { votes: updatedVotes });
}
 

//Calculate the winner
//Returns the movie object with the most votes, or null if no votes cast.

export function calculateWinner(votes = {}, movies = []) {
  if (!votes || Object.keys(votes).length === 0) return null;
 
  let winnerId = null;
  let maxVotes = 0;
 
  for (const [tmdbId, voters] of Object.entries(votes)) {
    const count = Object.keys(voters).length;
    if (count > maxVotes) {
      maxVotes = count;
      winnerId = tmdbId;
    }
  }
 
  if (!winnerId || maxVotes === 0) return null;
 
  const winnerMovie = movies.find((m) => String(m.tmdbId) === String(winnerId));
  return winnerMovie ? { ...winnerMovie, voteCount: maxVotes } : null;
}
