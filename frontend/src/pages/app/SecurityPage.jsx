import { useState } from 'react';
import { parseError } from '../../api/client';
import { profileApi } from '../../api/endpoints';
import Alert from '../../components/Alert';
import FormField from '../../components/FormField';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';
import useForm from '../../utils/useForm';
import { rules } from '../../utils/validation';

/** Two-Way Verification by email: send code → confirm code → setting changed. */
export default function SecurityPage() {
  const { user, setUser } = useAuth();
  const [codeSent, setCodeSent] = useState(false);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const form = useForm({ code: '' }, { code: rules.otp });
  const turningOn = !user.mfaEnabled;

  const sendCode = async () => {
    setMsg(null);
    setBusy(true);
    try {
      const res = await profileApi.mfaSendCode();
      setCodeSent(true);
      setMsg({ type: 'info', text: `${res.message} (${user.email})` });
    } catch (e) {
      setMsg({ type: 'error', text: parseError(e).message });
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!form.validateAll()) return;
    setBusy(true);
    try {
      const code = form.values.code.trim();
      const updated = turningOn ? await profileApi.mfaEnable(code) : await profileApi.mfaDisable(code);
      setUser(updated);
      setCodeSent(false);
      form.setValues({ code: '' });
      setMsg({ type: 'success', text: updated.mfaEnabled ? 'Two-step verification is now ON.' : 'Two-step verification turned off.' });
    } catch (err) {
      setMsg({ type: 'error', text: parseError(err).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Two-step verification</h1>
          <p className="text-sm text-slate-400">
            After your password, sign-in will also ask for a 6-digit code that we email to <b>{user.email}</b>.
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.mfaEnabled ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/20' : 'bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/20'}`}>
          {user.mfaEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      <Alert type={msg?.type}>{msg?.text}</Alert>

      {!codeSent ? (
        <button className={turningOn ? 'btn-primary' : 'btn-danger'} onClick={sendCode} disabled={busy}>
          {busy && <Spinner />} {turningOn ? 'Turn on two-step verification' : 'Turn off two-step verification'}
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormField label="6-digit code from your email" name="code" inputMode="numeric" maxLength={6} placeholder="123456"
            autoComplete="one-time-code" value={form.values.code} onChange={form.onChange} onBlur={form.onBlur} error={form.errors.code} />
          <div className="flex flex-wrap gap-2">
            <button className={turningOn ? 'btn-primary' : 'btn-danger'} disabled={busy}>
              {busy && <Spinner />} {turningOn ? 'Verify & turn on' : 'Verify & turn off'}
            </button>
            <button type="button" className="btn-secondary" onClick={sendCode} disabled={busy}>Resend code</button>
            <button type="button" className="btn-secondary" onClick={() => { setCodeSent(false); setMsg(null); }}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
