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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
      hasRole: (...roles) => {
        const u = get().user;
        return !!u && roles.includes(u.role);
      },
    }),
    { name: "gala-auth" }
  )
);
