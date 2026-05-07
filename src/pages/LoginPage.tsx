import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");

  const canSignIn = useMemo(() => email.trim().length > 0 && pwd.length > 0, [email, pwd]);

  function handleSignIn() {
    // hackathon-friendly "mock auth"
    localStorage.setItem("auth", "true");
    navigate("/portal");
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-avatar" aria-hidden="true">
          <div className="login-avatar__circle" />
        </div>

        <h1 className="login-title">EZGrants</h1>

        <div className="login-form">
          <label className="login-label">Email</label>
          <input
            className="login-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="login-row">
            <label className="login-label">Password</label>
            <button className="link" type="button">
              Forgot Password?
            </button>
          </div>

          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />

          <button
            className="btn btn--primary btn--full"
            type="button"
            onClick={handleSignIn}
            disabled={!canSignIn}
          >
            Sign in
          </button>

          <button className="btn btn--outline btn--full" type="button" onClick={handleSignIn}>
            <span className="icon-ms" aria-hidden="true" /> Sign in with Microsoft
          </button>

          <button className="btn btn--outline btn--full" type="button" onClick={handleSignIn}>
            <span className="icon-g" aria-hidden="true" /> Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}