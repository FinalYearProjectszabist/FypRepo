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

/** Second step of Two-Way Verification: 6-digit code sent to the user's email. */
export default function MfaLoginPage() {
  const location = useLocation();
  const mfaToken = location.state?.mfaToken;
  const { values, errors, onChange, onBlur, validateAll } = useForm({ code: '' }, { code: rules.otp });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
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

  const resend = async () => {
    setError('');
    try {
      setInfo((await authApi.resendMfa(mfaToken)).message);
    } catch (err) {
      setError(parseError(err).message);
    }
  };

  return (
    <AuthLayout
      title="Two-step verification"
      subtitle={`We sent a 6-digit code to ${location.state?.maskedEmail || 'your email'}. Enter it to finish signing in.`}
      footer={<Link to="/login" className="link">Use a different account</Link>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Alert type="info">{info}</Alert>
        <Alert>{error}</Alert>
        <FormField label="Verification code" name="code" inputMode="numeric" maxLength={6} autoFocus
          autoComplete="one-time-code" placeholder="123456"
          className={`input text-center text-lg tracking-[0.5em] ${errors.code ? 'input-error' : ''}`}
          value={values.code} onChange={onChange} onBlur={onBlur} error={errors.code} />
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy && <Spinner />} Verify
        </button>
        <button type="button" onClick={resend} className="w-full text-sm link">
          Didn&apos;t get a code? Resend
        </button>
      </form>
    </AuthLayout>
  );
}
