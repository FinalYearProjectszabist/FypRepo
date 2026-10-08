import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { parseError } from '../../api/client';
import { profileApi } from '../../api/endpoints';
import Alert from '../../components/Alert';
import FormField from '../../components/FormField';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';
import useForm from '../../utils/useForm';
import { rules } from '../../utils/validation';

/** Two-Way Verification (TOTP) setup: scan QR → confirm code → enabled. */
export default function SecurityPage() {
  const { user, setUser } = useAuth();
  const [setup, setSetup] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const form = useForm({ code: '' }, { code: rules.otp });

  const start = async () => {
    setMsg(null);
    setBusy(true);
    try {
      setSetup(await profileApi.mfaSetup());
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
      const updated = user.mfaEnabled
        ? await profileApi.mfaDisable(form.values.code.trim())
        : await profileApi.mfaEnable(form.values.code.trim());
      setUser(updated);
      setSetup(null);
      form.setValues({ code: '' });
      setMsg({ type: 'success', text: updated.mfaEnabled ? 'Two-step verification is now ON.' : 'Two-step verification turned off.' });
    } catch (err) {
      setMsg({ type: 'error', text: parseError(err).message });
    } finally {
      setBusy(false);
    }
  };

  const codeField = (
    <FormField label="6-digit code from your app" name="code" inputMode="numeric" maxLength={6} placeholder="123456"
      autoComplete="one-time-code" value={form.values.code} onChange={form.onChange} onBlur={form.onBlur} error={form.errors.code} />
  );

  return (
    <div className="card max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Two-step verification</h1>
          <p className="text-sm text-slate-500">
            After your password, sign-in will also ask for a code from Google Authenticator or Microsoft Authenticator.
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.mfaEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {user.mfaEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      <Alert type={msg?.type}>{msg?.text}</Alert>

      {user.mfaEnabled ? (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <p className="text-sm text-slate-600">To turn it off, confirm with a current code.</p>
          {codeField}
          <button className="btn-danger" disabled={busy}>{busy && <Spinner />} Turn off</button>
        </form>
      ) : !setup ? (
        <button className="btn-primary" onClick={start} disabled={busy}>{busy && <Spinner />} Set up two-step verification</button>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
            <li>Install Google Authenticator or Microsoft Authenticator on your phone.</li>
            <li>Scan this QR code (or enter the key manually).</li>
            <li>Type the 6-digit code the app shows.</li>
          </ol>
          <div className="flex flex-wrap items-center gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <QRCodeSVG value={setup.otpauthUrl} size={168} />
            </div>
            <div className="text-sm">
              <p className="text-slate-500">Manual key</p>
              <code className="break-all rounded bg-slate-100 px-2 py-1 font-mono text-xs">{setup.secret}</code>
            </div>
          </div>
          {codeField}
          <div className="flex gap-2">
            <button className="btn-primary" disabled={busy}>{busy && <Spinner />} Verify & enable</button>
            <button type="button" className="btn-secondary" onClick={() => setSetup(null)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
