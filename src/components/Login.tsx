import { useState, useEffect } from 'react';
import styles from './Login.module.css';
import { User } from '../types';
import { setGlobalAuthToken } from '../utils/auth';

interface Charity {
  id: number;
  name: string;
}

interface LoginProps {
  onLogin: (user: User) => void;
}

interface JwtRole {
  authority: string;
}

interface JwtPayload {
  sub?: string;
  roles?: JwtRole[];
  charityId?: number;
  iat?: number;
  exp?: number;
}

function normalizeToken(authResponse: any): string | null {
  if (typeof authResponse === 'string') {
    return authResponse.replace(/^Bearer\s+/i, '').trim();
  }

  const tokenCandidate = authResponse?.token || authResponse?.accessToken || authResponse?.jwt || authResponse?.data?.token;
  if (typeof tokenCandidate !== 'string') {
    return null;
  }

  return tokenCandidate.replace(/^Bearer\s+/i, '').trim();
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

  try {
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function mapAuthorityToRole(authority?: string): User['role'] | null {
  if (authority === 'ROLE_SUPERUSER') return 'SUPERUSER';
  if (authority === 'ROLE_ADMIN') return 'ADMIN';
  if (authority === 'ROLE_USER') return 'USER';
  return null;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCharityId, setSelectedCharityId] = useState('');
  const [availableCharities, setAvailableCharities] = useState<Charity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharityDirectory = async () => {
      console.log('[Portal Auth] Initializing Directory: Fetching /api/charity...');
      
      try {
        const response = await fetch('http://localhost:8081/app/charities');
        if (response.ok) {
          const data = await response.json();
          setAvailableCharities(data);
          console.log('[Portal Auth] Directory populated via Real Backend API.');
        } else {
          throw new Error('Backend responded with error code');
        }
      } catch (err) {
        console.warn('[Portal Auth] Backend Charity API unreachable. Restoring Mock Directory for development.');
      }
    };

    fetchCharityDirectory();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const loginPayload = {
      username: username.toLowerCase(),
      password: password,
      charityId: parseInt(selectedCharityId)
    };

    console.log('[Portal Auth] Attempting secure login with payload:', loginPayload);
    let response;
    try {
      // 1. Attempt Real Backend Call
      response = await fetch('http://localhost:8081/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginPayload)
      });

      if (response.ok && !response.headers.get('content-type')?.includes('application/json')) {
        const authResponse = await response.text();
        const token = normalizeToken(authResponse);

        if (!token) {
          setError('Authentication token not found in login response.');
          return;
        }

        setGlobalAuthToken(token);
        const payload = decodeJwtPayload(token);
        const authority = payload?.roles?.[0]?.authority;
        const derivedRole = mapAuthorityToRole(authority) || 'USER';
        const derivedCharityId = payload?.charityId ?? loginPayload.charityId;

        const userData = {
          id: 1,
          username: payload?.sub || username,
          role: derivedRole,
          charityId: derivedCharityId,
          charityName: availableCharities.find(c => c.id === derivedCharityId)?.name,
          token
        };
        onLogin(userData);
        return;
      }
      
      const errorData = await response.json();
      setError(errorData.message || 'Authentication failed via Backend API.');

    } catch (err) {
      console.warn('[Portal Auth] Backend API unreachable. Falling back to local Mock Directory.');
      setError(err instanceof Error ? err.message : 'Backend API unreachable. Please try again later.');
    }
  };

  return (
    <div className={`flex-center ${styles.pageRoot}`}>
      <div className={`glass-panel ${styles.panel}`}>
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <h2 className={styles.logoTitle}>Grant Hub Portal</h2>          <p className={styles.logoSubtitle}>Manage. Apply. Track.</p>
        
        </div>

        {error && <div className={`alert alert-error animate-fade-in ${styles.errorAlert}`}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">AFFILIATED CHARITY</label>
            <select className={`form-control ${styles.charitySelect}`}
              value={selectedCharityId} onChange={e => setSelectedCharityId(e.target.value)} required>
              <option value="">-- Choose your Organization --</option>
              {availableCharities.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">USERNAME</label>
            <input type="text" className="form-control" value={username}
              onChange={(e) => setUsername(e.target.value)} placeholder="Enter User name" required />
          </div>

          <div className="form-group mb-6">
            <label className="form-label">PASSWORD</label>
            <div className={styles.passwordWrapper}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-control" 
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter Password"
                required 
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className={`btn btn-primary ${styles.btnSubmit}`}>Sign In</button>
        </form>

        
      </div>
    </div>
  );
}
