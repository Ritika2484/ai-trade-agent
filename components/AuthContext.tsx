"use client";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { setCookie, deleteCookie } from "cookies-next";
import { auth } from "../library/firebase/client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const token = await currentUser.getIdToken();
        setCookie("token", token, { maxAge: 60 * 60 * 24 * 7, path: "/" }); // 7 days
      } else {
        deleteCookie("token");
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();

    await signInWithPopup(auth, provider);
  }

  async function signOutUser() {
    await signOut(auth);
  }

  async function getAuthToken() {
    if (!auth.currentUser) {
      return null;
    }

    return auth.currentUser.getIdToken();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signOutUser,
        getAuthToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}