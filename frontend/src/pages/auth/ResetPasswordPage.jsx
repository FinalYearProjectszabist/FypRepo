import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { parseError } from '../../api/client';
import { authApi } from '../../api/endpoints';
import Alert from '../../components/Alert';
import AuthLayout from '../../components/AuthLayout';
import FormField from '../../components/FormField';
import PasswordInput from '../../components/PasswordInput';
import Spinner from '../../components/Spinner';
import useForm from '../../utils/useForm';
import { rules } from '../../utils/validation';

const schema = {
  email: rules.email,
  code: rules.otp,
  newPassword: rules.password,
  confirmPassword: rules.confirm('newPassword'),
};

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const { values, errors, setErrors, onChange, onBlur, validateAll } = useForm(
    { email: params.get('email') || '', code: '', newPassword: '', confirmPassword: '' },
    schema,
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateAll()) return;
    setBusy(true);
    try {
      await authApi.resetPassword({
        email: values.email.trim(), code: values.code.trim(), newPassword: values.newPassword,
      });
      navigate('/login?reset=1');
    } catch (err) {
      const { message, fieldErrors } = parseError(err);
      setErrors(fieldErrors);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="If an account exists for this email, a reset code is on its way."
      footer={<Link to="/forgot-password" className="font-semibold text-brand-700 hover:underline">Send a new code</Link>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Alert>{error}</Alert>
        <FormField label="Email" name="email" type="email"
          value={values.email} onChange={onChange} onBlur={onBlur} error={errors.email} />
        <FormField label="Reset code" name="code" inputMode="numeric" maxLength={6} placeholder="123456"
          autoComplete="one-time-code"
          value={values.code} onChange={onChange} onBlur={onBlur} error={errors.code} />
        <PasswordInput label="New password" name="newPassword" autoComplete="new-password" showStrength
          value={values.newPassword} onChange={onChange} onBlur={onBlur} error={errors.newPassword} />
        <PasswordInput label="Confirm new password" name="confirmPassword" autoComplete="new-password"
          value={values.confirmPassword} onChange={onChange} onBlur={onBlur} error={errors.confirmPassword} />
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy && <Spinner />} Update password
        </button>
      </form>
    </AuthLayout>
  );
}
