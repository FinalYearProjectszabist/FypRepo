import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { parseError } from '../../api/client';
import { authApi } from '../../api/endpoints';
import Alert from '../../components/Alert';
import AuthLayout from '../../components/AuthLayout';
import FormField from '../../components/FormField';
import Spinner from '../../components/Spinner';
import useForm from '../../utils/useForm';
import { rules } from '../../utils/validation';
import useAuthResult from './useAuthResult';

/** Second step of Two-Way Verification: 6-digit code from Google/Microsoft Authenticator. */
export default function MfaLoginPage() {
  const location = useLocation();
  const mfaToken = location.state?.mfaToken;
  const { values, errors, onChange, onBlur, validateAll } = useForm({ code: '' }, { code: rules.otp });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const handleAuth = useAuthResult();

  if (!mfaToken) return <Navigate to="/login" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateAll()) return;
    setBusy(true);
    try {
      handleAuth(await authApi.loginMfa({ mfaToken, code: values.code.trim() }), location.state?.from);
    } catch (err) {
      setError(parseError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Two-step verification"
      subtitle="Open your authenticator app and enter the 6-digit code for EV Charging Platform."
      footer={<Link to="/login" className="font-semibold text-brand-700 hover:underline">Use a different account</Link>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Alert>{error}</Alert>
        <FormField label="Authenticator code" name="code" inputMode="numeric" maxLength={6} autoFocus
          autoComplete="one-time-code" placeholder="123456"
          className={`input text-center text-lg tracking-[0.5em] ${errors.code ? 'input-error' : ''}`}
          value={values.code} onChange={onChange} onBlur={onBlur} error={errors.code} />
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy && <Spinner />} Verify
        </button>
      </form>
    </AuthLayout>
  );
}
