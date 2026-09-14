import { createContext, useContext, useReducer, useEffect } from 'react';
import { getCurrentUser } from '../services/api';

const AuthContext = createContext(null);

/**
 * Safely parse and validate stored credentials from localStorage synchronously.
 */
function getStoredAuth() {
  try {
    const stored = localStorage.getItem('payrollpro_auth');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!parsed || !parsed.token) return null;

    // Check JWT expiry if valid JWT format
    const tokenParts = parsed.token.split('.');
    if (tokenParts.length === 3) {
      try {
        const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('payrollpro_auth');
          return null;
        }
      } catch {
        // If decoding claims fails, keep token and let backend validate
      }
    }

    return parsed;
  } catch {
    try {
      localStorage.removeItem('payrollpro_auth');
    } catch {}
    return null;
  }
}

/**
 * Synchronous initial state factory to ensure AuthContext is fully hydrated
 * before the very first render, preventing premature redirects to /login on refresh.
 */
function getInitialState() {
  const stored = getStoredAuth();
  if (stored) {
    return {
      token: stored.token,
      role: stored.role,
      companyId: stored.companyId,
      companyName: stored.companyName || null,
      email: stored.email || null,
      isAuthenticated: true,
      initialized: true
    };
  }
  return {
    token: null,
    role: null,
    companyId: null,
    companyName: null,
    email: null,
    isAuthenticated: false,
    initialized: true
  };
}

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        token: action.payload.token,
        role: action.payload.role,
        companyId: action.payload.companyId,
        companyName: action.payload.companyName || state.companyName || null,
        email: action.payload.email || state.email || null,
        isAuthenticated: true,
        initialized: true
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        companyName: action.payload.companyName || state.companyName,
        email: action.payload.email || state.email
      };
    case 'LOGOUT':
      return {
        token: null,
        role: null,
        companyId: null,
        companyName: null,
        email: null,
        isAuthenticated: false,
        initialized: true
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, undefined, getInitialState);

  // Synchronize auth state across tabs and handle logout events triggered on 401
  useEffect(() => {
    function handleLogoutEvent() {
      dispatch({ type: 'LOGOUT' });
    }

    function handleStorage(e) {
      if (e.key === 'payrollpro_auth') {
        if (!e.newValue) {
          dispatch({ type: 'LOGOUT' });
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed && parsed.token) {
              dispatch({ type: 'LOGIN', payload: parsed });
            }
          } catch {}
        }
      }
    }

    window.addEventListener('payrollpro_auth_logout', handleLogoutEvent);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('payrollpro_auth_logout', handleLogoutEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Fetch full user profile on login or reload to sync companyName and email
  useEffect(() => {
    if (state.token && (!state.companyName || !state.email)) {
      getCurrentUser()
        .then((profile) => {
          if (profile) {
            dispatch({
              type: 'UPDATE_PROFILE',
              payload: {
                companyName: profile.companyName,
                email: profile.email
              }
            });
            const stored = getStoredAuth();
            if (stored) {
              stored.companyName = profile.companyName;
              stored.email = profile.email;
              try {
                localStorage.setItem('payrollpro_auth', JSON.stringify(stored));
              } catch {}
            }
          }
        })
        .catch(() => {});
    }
  }, [state.token, state.companyName, state.email]);

  function login(authData) {
    const payload = {
      token: authData.token,
      role: authData.role,
      companyId: authData.companyId,
      companyName: authData.companyName || null,
      email: authData.email || null
    };
    try {
      localStorage.setItem('payrollpro_auth', JSON.stringify(payload));
    } catch (err) {
      console.error('Failed to save auth state to localStorage', err);
    }
    dispatch({ type: 'LOGIN', payload });

    // If companyName or email was not in authData, load from /auth/me immediately
    if (!payload.companyName || !payload.email) {
      getCurrentUser()
        .then((profile) => {
          if (profile) {
            dispatch({
              type: 'UPDATE_PROFILE',
              payload: {
                companyName: profile.companyName,
                email: profile.email
              }
            });
            payload.companyName = profile.companyName;
            payload.email = profile.email;
            try {
              localStorage.setItem('payrollpro_auth', JSON.stringify(payload));
            } catch {}
          }
        })
        .catch(() => {});
    }
  }

  function logout() {
    try {
      localStorage.removeItem('payrollpro_auth');
    } catch {}
    dispatch({ type: 'LOGOUT' });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
