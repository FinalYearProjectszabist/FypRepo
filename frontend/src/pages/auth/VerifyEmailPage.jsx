import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { parseError } from '../../api/client';
import { authApi } from '../../api/endpoints';
import Alert from '../../components/Alert';
import AuthLayout from '../../components/AuthLayout';
import FormField from '../../components/FormField';
import Spinner from '../../components/Spinner';
import useForm from '../../utils/useForm';
import { rules } from '../../utils/validation';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const { values, errors, onChange, onBlur, validateAll } = useForm(
    { email: params.get('email') || '', code: '' },
    { email: rules.email, code: rules.otp },
  );
  const [error, setError] = useState('');
  const [info, setInfo] = useState(params.get('resent') ? 'Your email is not verified yet. We sent you a new code.' : '');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateAll()) return;
    setBusy(true);
    try {
      await authApi.verifyEmail({ email: values.email.trim(), code: values.code.trim() });
      navigate('/login?verified=1');
    } catch (err) {
      setError(parseError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError('');
    if (rules.email(values.email)) { setError('Enter your email first'); return; }
    try {
      setInfo((await authApi.resendVerification(values.email.trim())).message);
    } catch (err) {
      setError(parseError(err).message);
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Enter the 6-digit code we sent to your email address."
      footer={<Link to="/login" className="link">Back to sign in</Link>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Alert type="info">{info}</Alert>
        <Alert>{error}</Alert>
        <FormField label="Email" name="email" type="email"
          value={values.email} onChange={onChange} onBlur={onBlur} error={errors.email} />
        <FormField label="Verification code" name="code" inputMode="numeric" maxLength={6} placeholder="123456"
          autoComplete="one-time-code" className={`input text-center text-lg tracking-[0.5em] ${errors.code ? 'input-error' : ''}`}
          value={values.code} onChange={onChange} onBlur={onBlur} error={errors.code} />
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy && <Spinner />} Verify email
        </button>
        <button type="button" onClick={resend} className="w-full text-sm link">
          Didn&apos;t get a code? Resend
        </button>
      </form>
    </AuthLayout>
  );
}
