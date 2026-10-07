// Step 1: ask for the phone number; the server sends a code by SMS.
import React, { useState } from 'react';
import AppButton from '../../../components/common/AppButton';
import AppInput from '../../../components/common/AppInput';
import { isValidPhone } from '../../../utils/validators';

/**
 * @param {function} onSubmit Called with the phone number when it looks valid
 * @param {boolean} isLoading
 */
export default function PhoneStep({ onSubmit, isLoading }) {
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const handleSubmit = () => {
    if (!isValidPhone(phone)) {
      setPhoneError('Enter a valid mobile number, e.g. 01712345678');
      return;
    }
    setPhoneError('');
    onSubmit(phone.replace(/[\s-]/g, ''));
  };

  return (
    <>
      <AppInput
        label="Mobile number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        error={phoneError}
      />
      <AppButton title="Send code" onPress={handleSubmit} isLoading={isLoading} />
    </>
  );
}