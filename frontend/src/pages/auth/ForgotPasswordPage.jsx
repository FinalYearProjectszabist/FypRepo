import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { parseError } from '../../api/client';
import { authApi } from '../../api/endpoints';
import Alert from '../../components/Alert';
import AuthLayout from '../../components/AuthLayout';
import FormField from '../../components/FormField';
import Spinner from '../../components/Spinner';
import useForm from '../../utils/useForm';
import { rules } from '../../utils/validation';

export default function ForgotPasswordPage() {
  const { values, errors, onChange, onBlur, validateAll } = useForm({ email: '' }, { email: rules.email });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateAll()) return;
    setBusy(true);
    try {
      await authApi.forgotPassword(values.email.trim());
      navigate(`/reset-password?email=${encodeURIComponent(values.email.trim())}`);
    } catch (err) {
      setError(parseError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Recover password"
      subtitle="Enter your account email and we'll send you a 6-digit reset code."
      footer={<Link to="/login" className="link">Back to sign in</Link>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Alert>{error}</Alert>
        <FormField label="Email" name="email" type="email" autoComplete="email"
          value={values.email} onChange={onChange} onBlur={onBlur} error={errors.email} />
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy && <Spinner />} Send reset code
        </button>
      </form>
    </AuthLayout>
  );
}
