// ─── Firebase Auth ─────────────────────────────────────────────────────────

import { set } from './state.js';
import { toast } from './components/toast.js';

export async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  await firebase.auth().signInWithPopup(provider);
}

export async function signOut() {
  await firebase.auth().signOut();
}

export function initAuth({ onSignedIn, onSignedOut }) {
  firebase.auth().onAuthStateChanged(async user => {
    if (user) {
      try {
        const token = await user.getIdToken();
        set('user', user);
        set('token', token);
        onSignedIn(user);
      } catch (e) {
        toast.error('Failed to get auth token.');
        onSignedOut();
      }
    } else {
      set('user', null);
      set('token', null);
      onSignedOut();
    }
  });
}
