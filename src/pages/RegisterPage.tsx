import { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    charityName: "",
    charityNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    const result = await register({
      email: formData.email,
      password: formData.password,
      charityName: formData.charityName,
      charityNumber: formData.charityNumber,
    });

    if (!result.success) {
      setError(result.error || "Registration failed");
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container auth-container--wide">
        <div className="auth-header">
          <div className="auth-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <h1>Create Your Account</h1>
          <p className="muted">Start managing your charity's grant applications</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="auth-section">
            <h3>Charity Details</h3>
            <label>
              Charity Name <span className="required">*</span>
              <input
                type="text"
                name="charityName"
                value={formData.charityName}
                onChange={handleChange}
                placeholder="e.g., Hope Community Trust"
                required
              />
            </label>

            <label>
              Charity Registration Number
              <input
                type="text"
                name="charityNumber"
                value={formData.charityNumber}
                onChange={handleChange}
                placeholder="e.g., 1234567 (England & Wales) or SC012345 (Scotland)"
              />
              <span className="input-hint">Optional - you can add this later</span>
            </label>
          </div>

          <div className="auth-section">
            <h3>Your Account</h3>
            <label>
              Email Address <span className="required">*</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@yourcharity.org"
                required
                autoComplete="email"
              />
            </label>

            <label>
              Password <span className="required">*</span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                required
                autoComplete="new-password"
              />
            </label>

            <label>
              Confirm Password <span className="required">*</span>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
              />
            </label>
          </div>

          <div className="auth-terms">
            <p className="muted small">
              By creating an account, you agree to our Terms of Service and Privacy Policy. 
              Your data is stored securely and used only for managing your grant applications.
            </p>
          </div>

          <button type="submit" disabled={isLoading} className="auth-submit">
            {isLoading ? (
              <>
                <span className="auth-spinner" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <button type="button" className="auth-link" onClick={onSwitchToLogin}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
