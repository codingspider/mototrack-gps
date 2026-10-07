// Step 1: ask for the phone number; the server sends a code by SMS.
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import AppButton from '../../../components/common/AppButton';
import AppInput from '../../../components/common/AppInput';
import { showToast } from '../../../store/slices/toastSlice';
import { isValidPhone } from '../../../utils/validators';

/**
 * @param {function} onSubmit Called with the phone number when it looks valid
 * @param {boolean} isLoading
 */
export default function PhoneStep({ onSubmit, isLoading }) {
  const [phone, setPhone] = useState('');
  const dispatch = useDispatch();

  const handleSubmit = () => {
    if (!isValidPhone(phone)) {
      dispatch(showToast({ type: 'warning', message: 'Enter a valid mobile number, e.g. 01712345678' }));
      return;
    }
    onSubmit(phone.replace(/[\s-]/g, ''));
  };

  return (
    <>
      <AppInput label="Mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <AppButton title="Send code" onPress={handleSubmit} isLoading={isLoading} />
    </>
  );
}