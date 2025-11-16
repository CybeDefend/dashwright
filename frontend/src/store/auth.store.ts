import { create } from "zustand";

interface UserRole {
  id: string;
  role: "admin" | "maintainer" | "viewer";
}

interface User {
  id: string;
  username: string;
  fullName: string;
  organizationId: string;
  isSuperAdmin?: boolean;
  roles?: UserRole[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

// Helper functions to persist/retrieve user from localStorage
const persistUser = (user: User) => {
  localStorage.setItem("user", JSON.stringify(user));
};

const retrieveUser = (): User | null => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: retrieveUser(),
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  isAuthenticated: !!localStorage.getItem("accessToken"),

  login: (accessToken, refreshToken, user) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    persistUser(user);
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  setUser: (user) => {
    persistUser(user);
    set({ user });
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },
}));

// Helper function to check if user has a specific role
export const hasRole = (
  user: User | null,
  roles: ("admin" | "maintainer" | "viewer")[]
): boolean => {
  if (!user) return false;
  if (user.isSuperAdmin) return true; // Super admin bypasses all checks
  if (!user.roles || user.roles.length === 0) return false;
  return user.roles.some((userRole) => roles.includes(userRole.role));
};

// Helper to check if user is admin
export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, ["admin"]);
};

// Helper to check if user can manage (admin or maintainer)
export const canManage = (user: User | null): boolean => {
  return hasRole(user, ["admin", "maintainer"]);
};
