import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Role, User } from "@/lib/types";

interface AuthState {
  token: string | null;
  user: User | null;
  setSession: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
  getRole: () => Role | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
      getRole: () => {
        const { token, user } = get();
        if (!token) return null;
        try {
          // Decode JWT payload without verification (signature checked by backend)
          // but prevents easy UI manipulation by changing localStorage user object
          const payload = JSON.parse(atob(token.split(".")[1]));
          return payload.role as Role;
        } catch {
          return user?.role || null;
        }
      },
      hasRole: (...roles) => {
        const role = get().getRole();
        return !!role && roles.includes(role);
      },
    }),
    { name: "gala-auth" }
  )
);
