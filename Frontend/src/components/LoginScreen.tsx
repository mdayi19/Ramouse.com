import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Provider, Customer, Settings, Technician, Notification, NotificationType, TowTruck, CarProvider } from '../types';
import { COUNTRY_CODES } from '../constants/countries';
import Icon from './Icon';
import { AuthService } from '../services/auth.service';
import { reconnectEcho } from '../lib/echo';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent } from './ui/Card';
import { cn } from '../lib/utils';

interface LoginScreenProps {
  onLoginSuccess: (phone: string, rememberMe: boolean, provider?: Provider, technician?: Technician, towTruck?: TowTruck, isAdmin?: boolean, customer?: Customer, carProvider?: CarProvider) => void;
  onClose: () => void;
  onGoToTechnicianRegistration: () => void;
  onGoToTowTruckRegistration: () => void;
  onGoToCarProviderRegistration: () => void;
  settings: Settings;
  sendMessage: (type: 'verification' | 'notification', to: string, message: string) => Promise<{ success: boolean; error?: string }>;
  addNotificationForUser: (userPhone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, type: NotificationType) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  isClosing?: boolean;
}

type LoginMode = 'enterPhone' | 'verifyNewUser' | 'loginWithPassword' | 'forgotPasswordVerify' | 'resetPassword';



// OTP Input Component
interface OtpInputGroupProps {
  otp: string[];
  setOtp: (otp: string[]) => void;
}

const OtpInputGroup: React.FC<OtpInputGroupProps> = ({ otp, setOtp }) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (val && !/^\d+$/.test(val)) return;

    const newOtp = [...otp];
    if (val.length > 1) {
      const chars = val.split('').slice(0, 6);
      chars.forEach((c, i) => {
        if (index + i < 6) newOtp[index + i] = c;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(index + chars.length, 5);
      inputsRef.current[nextFocus]?.focus();
      return;
    }
    newOtp[index] = val;
    setOtp(newOtp);
    if (val && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;
    const newOtp = [...otp];
    paste.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    const nextFocus = Math.min(paste.length, 5);
    inputsRef.current[nextFocus]?.focus();
  };

  return (
    <div className="flex justify-center gap-2" dir="ltr">
      {otp.map((digit, index) => (
        <Input
          key={index}
          ref={el => { inputsRef.current[index] = el; }}
          type="tel"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          className="w-12 h-14 text-center text-2xl font-bold px-0"
          value={digit}
          onChange={e => handleChange(e, index)}
          onKeyDown={e => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
        />
      ))}
    </div>
  );
};

const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess, onClose, onGoToTechnicianRegistration, onGoToTowTruckRegistration, onGoToCarProviderRegistration,
  settings, showToast, isClosing
}) => {
  const [loginMode, setLoginMode] = useState<LoginMode>('enterPhone');

  const [countryCode, setCountryCode] = useState('+963');
  const [localPhone, setLocalPhone] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [rememberMe, setRememberMe] = useState(true);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const fullPhoneNumber = useMemo(() => countryCode + localPhone, [countryCode, localPhone]);
  const selectedCountry = useMemo(() => COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0], [countryCode]);

  useEffect(() => {
    const savedPhone = localStorage.getItem('savedUserPhone');
    if (savedPhone) {
      const foundCode = COUNTRY_CODES.find(c => savedPhone.startsWith(c.code));
      if (foundCode) {
        setCountryCode(foundCode.code);
        setLocalPhone(savedPhone.substring(foundCode.code.length));
      } else {
        setLocalPhone(savedPhone);
      }
      setRememberMe(true);
    }
  }, []);

  const resetToPhoneInput = () => {
    setLoginMode('enterPhone');
    setPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setOtp(new Array(6).fill(''));
    setError('');
    setSuccessMessage('');
    setIsNewUser(false);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localPhone.length !== selectedCountry.length) {
      setError(`الرجاء إدخال رقم هاتف صحيح (${selectedCountry.length} أرقام).`);
      return;
    }
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const checkResult = await AuthService.checkPhone(fullPhoneNumber);

      // Check if account is pending verification (car_provider, technician, tow_truck)
      if (checkResult.pending_verification) {
        setError(checkResult.message || 'حسابك قيد المراجعة. يرجى الانتظار حتى يتم تفعيله من قبل المسؤول.');
        setLoading(false);
        return;
      }

      if (checkResult.exists) {
        setLoginMode('loginWithPassword');
        setIsNewUser(false);
      } else {
        await AuthService.sendOtp(fullPhoneNumber);
        setSuccessMessage('تم إرسال رمز التحقق عبر واتساب. الرجاء التحقق من هاتفك.');
        setIsNewUser(true);
        setLoginMode('verifyNewUser');
      }
      setLoading(false);
    } catch (err: any) {
      console.error('Phone check error:', err);
      setError('حدث خطأ. يرجى المحاولة مرة أخرى.');
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await AuthService.login(fullPhoneNumber, password);
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      localStorage.setItem('userType', response.role);
      if (rememberMe) {
        localStorage.setItem('savedUserPhone', fullPhoneNumber);
      } else {
        localStorage.removeItem('savedUserPhone');
      }
      // Reconnect Echo with new auth token
      reconnectEcho();
      setLoading(false);

      if (response.role === 'provider') {
        onLoginSuccess(fullPhoneNumber, rememberMe, response.user as Provider);
      } else if (response.role === 'technician') {
        onLoginSuccess(fullPhoneNumber, rememberMe, undefined, response.user as Technician);
      } else if (response.role === 'tow_truck') {
        onLoginSuccess(fullPhoneNumber, rememberMe, undefined, undefined, response.user as TowTruck);
      } else if ((response.role as string) === 'admin') {
        onLoginSuccess(fullPhoneNumber, rememberMe, undefined, undefined, undefined, true);
      } else if (response.role === 'car_provider') {
        onLoginSuccess(fullPhoneNumber, rememberMe, undefined, undefined, undefined, undefined, undefined, response.user as CarProvider);
      } else {
        onLoginSuccess(fullPhoneNumber, rememberMe);
      }
      showToast('تم تسجيل الدخول بنجاح!', 'success');
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'كلمة المرور غير صحيحة أو الحساب غير موجود.';
      setError(errorMessage);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setLoading(true);
    try {
      await AuthService.sendOtp(fullPhoneNumber);
      setSuccessMessage('تم إرسال رمز التحقق عبر واتساب. الرجاء التحقق من هاتفك.');
      setLoginMode('forgotPasswordVerify');
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'فشل إرسال رمز التحقق. يرجى المحاولة مرة أخرى.';
      setError(errorMessage);
    }
  };

  const handleForgotPasswordVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('الرجاء إدخال رمز التحقق المكون من 6 أرقام.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await AuthService.verifyOtp(fullPhoneNumber, code);
      setSuccessMessage('تم التحقق بنجاح!');
      setLoginMode('resetPassword');
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'رمز التحقق غير صحيح.';
      setError(errorMessage);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('الرجاء إدخال رمز التحقق المكون من 6 أرقام.');
      return;
    }
    if (newPassword.length < 6) {
      setError('يجب أن تكون كلمة المرور مكونة من 6 أحرف على الأقل.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await AuthService.verifyOtp(fullPhoneNumber, code);
      const response = await AuthService.registerCustomer({ phone: fullPhoneNumber, password: newPassword });
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      localStorage.setItem('userType', 'customer');
      if (rememberMe) {
        localStorage.setItem('savedUserPhone', fullPhoneNumber);
      }
      // Reconnect Echo with new auth token
      reconnectEcho();
      setLoading(false);
      showToast('تم تسجيل حسابك بنجاح!', 'success');
      onLoginSuccess(fullPhoneNumber, rememberMe);
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'فشل التسجيل. يرجى المحاولة مرة أخرى.';
      setError(errorMessage);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('يجب أن تكون كلمة المرور مكونة من 6 أحرف على الأقل.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('كلمات المرور غير متطابقة.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await AuthService.resetPassword(fullPhoneNumber, newPassword);
      showToast('تم إعادة تعيين كلمة المرور بنجاح!', 'success');
      const response = await AuthService.login(fullPhoneNumber, newPassword);
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      localStorage.setItem('userType', response.role);
      if (rememberMe) {
        localStorage.setItem('savedUserPhone', fullPhoneNumber);
      }
      // Reconnect Echo with new auth token
      reconnectEcho();
      setLoading(false);

      if (response.role === 'provider') {
        onLoginSuccess(fullPhoneNumber, rememberMe, response.user as Provider);
      } else if (response.role === 'technician') {
        onLoginSuccess(fullPhoneNumber, rememberMe, undefined, response.user as Technician);
      } else if (response.role === 'tow_truck') {
        onLoginSuccess(fullPhoneNumber, rememberMe, undefined, undefined, response.user as TowTruck);
      } else if ((response.role as string) === 'admin') {
        onLoginSuccess(fullPhoneNumber, rememberMe, undefined, undefined, undefined, true);
      } else if (response.role === 'car_provider') {
        onLoginSuccess(fullPhoneNumber, rememberMe, undefined, undefined, undefined, undefined, undefined, response.user as CarProvider);
      } else {
        onLoginSuccess(fullPhoneNumber, rememberMe);
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'فشل تحديث كلمة المرور.';
      setError(errorMessage);
    }
  };

  const renderContent = () => {
    const fadeClass = "animate-slide-up";

    switch (loginMode) {
      case 'enterPhone':
        return (
          <form onSubmit={handlePhoneSubmit} className={`space-y-6 ${fadeClass}`}>
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">رقم الهاتف</label>
              <div className="flex mt-1 group relative">
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="appearance-none rounded-r-xl border-l-0 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors px-3 py-3 pr-8 w-[100px]"
                  dir="ltr"
                >
                  {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
                <div className="absolute top-1/2 right-2 transform -translate-y-1/2 pointer-events-none text-slate-500">
                  <Icon name="ChevronDown" className="w-4 h-4" />
                </div>
                <Input
                  type="tel"
                  id="phone"
                  value={localPhone}
                  onChange={e => setLocalPhone(e.target.value.replace(/\D/g, ''))}
                  className="rounded-r-none rounded-l-xl border-l h-auto py-3 sm:text-sm bg-slate-50 dark:bg-slate-700/50"
                  placeholder={selectedCountry.placeholder}
                  required
                  dir="ltr"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              isLoading={loading}
              className="w-full font-bold py-6 rounded-xl shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200"
              size="lg"
            >
              {loading ? 'جاري التحقق...' : 'متابعة'}
            </Button>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={onGoToTechnicianRegistration}
                className="block w-full text-center text-sm font-medium text-slate-500 hover:text-primary transition-colors py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
              >
                هل أنت فني؟ <span className="underline">سجل من هنا</span>
              </button>
              <button
                type="button"
                onClick={onGoToTowTruckRegistration}
                className="block w-full text-center text-sm font-medium text-slate-500 hover:text-primary transition-colors py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
              >
                هل أنت سائق سطحة؟ <span className="underline">سجل من هنا</span>
              </button>
              <button
                type="button"
                onClick={onGoToCarProviderRegistration}
                className="block w-full text-center text-sm font-medium text-slate-500 hover:text-primary transition-colors py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
              >
                هل أنت معرض سيارات؟ <span className="underline">سجل من هنا</span>
              </button>
            </div>
          </form>
        );
      case 'loginWithPassword':
        return (
          <form onSubmit={handlePasswordLogin} className={`space-y-6 ${fadeClass}`}>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm text-slate-600 dark:text-slate-300 mb-2">
                <span>أهلاً بك!</span>
                <span dir="ltr" className="font-bold text-primary">{fullPhoneNumber}</span>
              </div>
              <p className="text-sm text-slate-500">الرجاء إدخال كلمة المرور للمتابعة</p>
            </div>

            <div>
              <Input
                label="كلمة المرور"
                type="password"
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-auto py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                required
                dir="ltr"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary/20 transition-all"
                />
                <span>تذكرني</span>
              </label>
              <button type="button" onClick={handleForgotPassword} className="font-semibold text-primary hover:text-primary-700 transition-colors">نسيت كلمة المرور؟</button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              isLoading={loading}
              className="w-full font-bold py-6 rounded-xl shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200"
              size="lg"
            >
              {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={resetToPhoneInput}
              className="w-full"
            >
              تغيير الرقم
            </Button>
          </form>
        );
      case 'verifyNewUser':
        return (
          <form onSubmit={handleVerifyAndRegister} className={`space-y-6 ${fadeClass}`}>
            {successMessage && (
              <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-4 animate-modal-in">
                <p className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold flex items-center justify-center gap-2">
                  <Icon name="CheckCircle2" className="w-5 h-5" />
                  {successMessage}
                </p>
              </div>
            )}

            <div className="text-center mb-6">
              <p className="text-sm text-slate-600 dark:text-slate-400">الرجاء إدخال رمز التحقق المرسل إلى</p>
              <p dir="ltr" className="font-bold text-lg text-slate-800 dark:text-slate-200 mt-1">{fullPhoneNumber}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 text-center">رمز التحقق (6 أرقام)</label>
              <div className="py-2">
                <OtpInputGroup otp={otp} setOtp={setOtp} />
              </div>
            </div>

            <div>
              <Input
                label="كلمة مرور جديدة"
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="h-auto py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                required
                dir="ltr"
                placeholder="6 أحرف على الأقل"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              isLoading={loading}
              className="w-full font-bold py-6 rounded-xl shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200"
              size="lg"
            >
              {loading ? 'جاري التسجيل...' : 'تسجيل وإنشاء حساب'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={resetToPhoneInput}
              className="w-full"
            >
              تغيير الرقم
            </Button>
          </form>
        );
      case 'forgotPasswordVerify':
        return (
          <form onSubmit={handleForgotPasswordVerify} className={`space-y-6 ${fadeClass}`}>
            <div className="text-center mb-6">
              <p className="text-sm text-slate-600 dark:text-slate-400">تم إرسال رمز التحقق عبر واتساب إلى</p>
              <p dir="ltr" className="font-bold text-lg text-slate-800 dark:text-slate-200 mt-1">{fullPhoneNumber}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 text-center">رمز التحقق (6 أرقام)</label>
              <div className="py-2">
                <OtpInputGroup otp={otp} setOtp={setOtp} />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              isLoading={loading}
              className="w-full font-bold py-6 rounded-xl shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200"
              size="lg"
            >
              {loading ? 'جاري التحقق...' : 'تحقق ومتابعة'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={resetToPhoneInput}
              className="w-full"
            >
              العودة
            </Button>
          </form>
        );
      case 'resetPassword':
        return (
          <form onSubmit={handleResetPassword} className={`space-y-6 ${fadeClass}`}>
            <p className="text-sm text-center text-slate-600 dark:text-slate-400 mb-6">الرجاء إدخال كلمة المرور الجديدة.</p>

            <div>
              <Input
                label="كلمة المرور الجديدة"
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="h-auto py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                required
                dir="ltr"
                placeholder="6 أحرف على الأقل"
                autoFocus
              />
            </div>

            <div>
              <Input
                label="تأكيد كلمة المرور"
                type="password"
                id="confirmNewPassword"
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                className="h-auto py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                required
                dir="ltr"
                placeholder="أعد كتابة كلمة المرور"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              isLoading={loading}
              className="w-full font-bold py-6 rounded-xl shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200"
              size="lg"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={resetToPhoneInput}
              className="w-full"
            >
              العودة
            </Button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <Card
      className={cn(
        "w-full max-w-sm bg-white/95 backdrop-blur-xl dark:bg-slate-900/95 border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-2xl relative transition-all duration-300",
        isClosing ? 'animate-modal-out' : 'animate-modal-in'
      )}
      onClick={e => e.stopPropagation()}
    >
      <CardContent className="p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold"
        >
          <Icon name="X" className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="bg-white/50 dark:bg-white/5 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-sm">
            <img src={settings.logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            {loginMode === 'verifyNewUser' ? 'تأكيد الحساب الجديد' : loginMode === 'resetPassword' ? 'إعادة تعيين كلمة المرور' : 'تسجيل الدخول'}
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-3 mb-6 animate-fade-in">
            <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium flex items-center justify-center gap-2">
              <Icon name="AlertCircle" className="w-4 h-4" />
              {error}
            </p>
          </div>
        )}

        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default LoginScreen;
