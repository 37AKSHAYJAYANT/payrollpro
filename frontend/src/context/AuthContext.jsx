import { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext(null);

const initialState = {
  token: null,
  role: null,
  companyId: null,
  isAuthenticated: false
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        token: action.payload.token,
        role: action.payload.role,
        companyId: action.payload.companyId,
        isAuthenticated: true
      };
    case 'LOGOUT':
      return { ...initialState };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('payrollpro_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.token) {
          dispatch({ type: 'LOGIN', payload: parsed });
        }
      } catch {
        localStorage.removeItem('payrollpro_auth');
      }
    }
  }, []);

  function login(authData) {
    const payload = {
      token: authData.token,
      role: authData.role,
      companyId: authData.companyId
    };
    localStorage.setItem('payrollpro_auth', JSON.stringify(payload));
    dispatch({ type: 'LOGIN', payload });
  }

  function logout() {
    localStorage.removeItem('payrollpro_auth');
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
