import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loginapi, refreshapi, registerapi } from "../pages/auth/apipath";

const TOKEN_STORAGE_KEY = "authToken";

export type UserRole = "PATIENT" | "DOCTOR" | "ADMIN";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  experience?: number | null;
  specialization?: string | null;
  refreshToken?: string | null;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginCredentials & {
  name: string;
  role: UserRole;
  experience?: number;
  specialization?: string;
};

export type AuthApiResponse = {
  message: string;
  success: boolean;
  token?: string;
  user?: AuthUser;
};

export type AuthFieldError = {
  field: string;
  message: string;
};

export type AuthRequestError = Error & {
  fieldErrors?: AuthFieldError[];
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthApiResponse>;
  register: (payload: RegisterPayload) => Promise<AuthApiResponse>;
  refreshAuth: () => Promise<AuthApiResponse | null>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function readAuthResponse(response: Response): Promise<AuthApiResponse> {
  const rawBody = await response.text();
  let data = {} as AuthApiResponse & { error?: AuthFieldError[] };

  if (rawBody) {
    try {
      data = JSON.parse(rawBody) as AuthApiResponse & { error?: AuthFieldError[] };
    } catch {
      data = {} as AuthApiResponse & { error?: AuthFieldError[] };
    }
  }

  if (!response.ok) {
    const error = new Error(
      data.message || response.statusText || "Authentication request failed",
    ) as AuthRequestError;
    error.fieldErrors = data.error;
    throw error;
  }

  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  );
  const [loading, setLoading] = useState(true);

  const saveAuth = useCallback((data: AuthApiResponse) => {
    if (data.user) {
      setUser(data.user);
    }

    if (data.token) {
      setToken(data.token);
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await fetch(loginapi, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await readAuthResponse(response);
      saveAuth(data);
      return data;
    },
    [saveAuth],
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await fetch(registerapi, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return readAuthResponse(response);
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const response = await fetch(refreshapi, {
        method: "POST",
        credentials: "include",
      });
      const data = await readAuthResponse(response);
      saveAuth(data);
      return data;
    } catch {
      logout();
      return null;
    }
  }, [logout, saveAuth]);

  useEffect(() => {
    refreshAuth().finally(() => {
      setLoading(false);
    });
  }, [refreshAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      refreshAuth,
      logout,
    }),
    [loading, login, logout, refreshAuth, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
