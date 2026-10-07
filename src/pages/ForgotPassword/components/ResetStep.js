// Step 2: enter the SMS code and the new password.
import React, { useState } from 'react';
import AppButton from '../../../components/common/AppButton';
import AppInput from '../../../components/common/AppInput';
import { isBlank } from '../../../utils/validators';

/**
 * @param {function} onSubmit Called with (code, password)
 * @param {function} onResend Ask for a new code
 * @param {boolean} isLoading
 */
export default function ResetStep({ onSubmit, onResend, isLoading }) {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = () => {
    if (isBlank(code) || isBlank(password)) {
      setFormError('Enter the code and your new password');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('The two passwords do not match');
      return;
    }
    setFormError('');
    onSubmit(code.trim(), password);
  };

  return (
    <>
      <AppInput label="SMS code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
      <AppInput label="New password" value={password} onChangeText={setPassword} secureTextEntry />
      <AppInput
        label="Confirm new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        error={formError}
      />
      <AppButton title="Change password" onPress={handleSubmit} isLoading={isLoading} />
      <AppButton title="Send a new code" variant="link" onPress={onResend} isDisabled={isLoading} />
    </>
  );
}