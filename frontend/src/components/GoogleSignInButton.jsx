import { GoogleLogin } from '@react-oauth/google';

export const GOOGLE_ENABLED = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

/** Renders the official Google button; onCredential receives the Google ID token. */
export default function GoogleSignInButton({ onCredential, onError, text = 'continue_with' }) {
  if (!GOOGLE_ENABLED) return null;
  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={(res) => onCredential(res.credential)}
        onError={() => onError?.('Google sign-in was cancelled or failed')}
        text={text}
        shape="pill"
        width="320"
      />
    </div>
  );
}

export function OrDivider() {
  if (!GOOGLE_ENABLED) return null;
  return (
    <div className="my-5 flex items-center gap-3 text-xs uppercase text-slate-400">
      <div className="h-px flex-1 bg-slate-200" /> or <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
