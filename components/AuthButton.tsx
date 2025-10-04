'use client';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      console.log('🔐 Starting sign in...');
      console.log('Auth config:', {
        apiKey: auth.app.options.apiKey?.substring(0, 10) + '...',
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId
      });
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('Opening Google popup...');
      const result = await signInWithPopup(auth, provider);
      
      console.log('✅ Sign in successful!');
      console.log('User:', result.user.email);
      console.log('Display name:', result.user.displayName);
      console.log('UID:', result.user.uid);
      
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let userMessage = 'Sign in failed';
      
      if (error.code === 'auth/popup-blocked') {
        userMessage = 'Popup was blocked by browser. Please allow popups for this site.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        userMessage = 'Sign in cancelled.';
      } else if (error.code === 'auth/unauthorized-domain') {
        userMessage = 'This domain is not authorized. Add it to Firebase Console > Authentication > Settings > Authorized domains';
      } else if (error.code === 'auth/operation-not-allowed') {
        userMessage = 'Google sign-in not enabled. Enable it in Firebase Console > Authentication > Sign-in method';
      } else {
        userMessage = error.message || 'Unknown error occurred';
      }
      
      alert(`Sign In Failed\n\n${userMessage}\n\nCheck browser console for details.`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return <div className="text-sm text-neutral-400">Loading...</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-300">{user.displayName || user.email}</span>
        <button
          onClick={handleSignOut}
          className="text-sm px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      className="text-sm px-3 py-1 rounded bg-[var(--accent)] hover:opacity-90"
    >
      Sign In with Google
    </button>
  );
}
