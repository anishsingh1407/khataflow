"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  phone: string;
  role: "owner" | "staff" | "admin";
  shopId: string;
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  authLoading: boolean;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  authLoading: true,
  loading: true,
  signOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log("AuthProvider mounted");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    console.log("Setting up onAuthStateChanged listener. Auth:", auth);
    console.log("Auth app:", auth.app.name);

    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log("⚡ onAuthStateChanged FIRED:", firebaseUser?.uid ?? "no user");
        
        if (firebaseUser) {
          setFirebaseUser(firebaseUser);
          try {
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              console.log("Firestore user doc found:", data);
              setUser({
                uid: firebaseUser.uid,
                phone: firebaseUser.phoneNumber || "",
                role: data.role,
                shopId: data.shopId,
              });
              document.cookie = "kf-auth-token=true; path=/; max-age=3600";
            } else {
              console.log("No user doc in Firestore — new user");
              setUser(null);
            }
          } catch (error) {
            console.error("Error fetching user profile:", error);
            setUser(null);
          }
        } else {
          console.log("No firebase user — logged out");
          setFirebaseUser(null);
          setUser(null);
          document.cookie = "kf-auth-token=; path=/; max-age=0";
        }
        
        // CRITICAL: Always set loading to false
        setAuthLoading(false);
        console.log("authLoading set to false");
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("onAuthStateChanged setup failed:", error);
      setAuthLoading(false);
    }
  }, []);

  const signOut = async () => {
    const { signOutUser } = await import("@/lib/auth-service");
    await signOutUser();
    setUser(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, authLoading, loading: authLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
