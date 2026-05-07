import { useState } from 'react';
import { User } from '../types';
import { authFetch } from '../utils/auth';

interface RegisterMemberProps {
  user: User; // The logged-in admin/superuser
}

export default function RegisterMember({ user }: RegisterMemberProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'ADMIN' | 'USER'>('USER');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    const payload = {
      username: username.toLowerCase(),
      password,
      role,
      charityId: user.charityId
    };

    try {
      console.log('[Register] Sending payload to /auth/register:', payload);
      const response = await authFetch('http://localhost:8081/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Successfully registered ${username} as ${role} for ${user.charityName}.` });
        setUsername('');
        setPassword('');
        setRole('USER');
      } else {
        const errData = await response.json();
        throw new Error(errData.message || 'Registration failed');
      }
    } catch (err: any) {
      console.warn('[Register] Backend API failure. Simulating success in mock mode.');
      throw new Error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ 
      maxWidth: '650px', 
      margin: '2rem auto 0 auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="mb-6">
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>Register New Member</h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem', fontWeight: 600 }}>
          Onboard new users to {user.charityName || `Charity #${user.charityId}`}
        </p>
      </div>

      <div className="card">
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-4`} style={{
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: message.type === 'success' ? '#def7ec' : '#fde8e8',
            color: message.type === 'success' ? '#03543f' : '#9b1c1c',
            border: `1px solid ${message.type === 'success' ? '#84e1bc' : '#f8b4b4'}`,
            fontSize: '0.9rem',
            fontWeight: 500
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group mb-4">
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>MEMBER USERNAME</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Enter Username" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              required 
            />
          </div>

          <div className="form-group mb-4">
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>INITIAL PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-control" 
                placeholder="Enter Password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
                style={{ paddingRight: '48px' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute', 
                  right: '8px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.8,
                  color: '#64748b'
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-group mb-6">
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)'}}>SYSTEM ROLE</label>
            <div className="flex mt-2" style={{ flexWrap: 'wrap', columnGap: '2rem', rowGap: '0.75rem', alignItems: 'center' }}>
              <label className="flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  name="role" 
                  value="USER" 
                  checked={role === 'USER'} 
                  onChange={() => setRole('USER')}
                  style={{ marginRight: '0.5rem' }}
                />
                <span style={{ fontSize: '0.9rem' }}>Staff Member (USER)</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  name="role" 
                  value="ADMIN" 
                  checked={role === 'ADMIN'} 
                  onChange={() => setRole('ADMIN')}
                  style={{ marginRight: '0.35rem' }}
                />
                <span style={{ fontSize: '0.9rem' }}>Charity Admin (ADMIN)</span>
              </label>
            </div>
          </div>

          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
              <b>Note:</b> New members will be automatically restricted to the <b>{user.charityName}</b> data partition.
            </p>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isLoading}
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
          >
            {isLoading ? 'Processing Registration...' : 'Onboard Member to Charity'}
          </button>
        </form>
      </div>
    </div>
  );
}
