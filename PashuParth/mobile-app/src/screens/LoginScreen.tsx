import React, { useState } from 'react';
import { authService, UserAccount } from '../services/authService';
import { Phone, KeyRound, PhoneCall, ShieldCheck, ArrowRight, Info, Sparkles, UserCheck, AlertCircle } from 'lucide-react';

interface Props {
  onLoginSuccess: (user: UserAccount) => void;
  lang: 'EN' | 'HI';
}

export const LoginScreen: React.FC<Props> = ({ onLoginSuccess, lang }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [simulatedSmsToast, setSimulatedSmsToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUserCandidate, setCurrentUserCandidate] = useState<UserAccount | null>(null);

  const demoAccounts = authService.getUsers();

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setErrorMessage(lang === 'HI' ? 'कृपया एक वैध मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
      return;
    }

    const inputDigits = phoneNumber.replace(/\D/g, '');
    const cleanPhone = inputDigits.slice(-10); // Extract last 10 digits
    
    // Find registered user by matching 10-digit phone number
    const user = demoAccounts.find((u) => {
      const uDigits = u.phone.replace(/\D/g, '');
      return uDigits.endsWith(cleanPhone) || uDigits.includes(cleanPhone);
    });
    
    if (!user) {
      setErrorMessage(
        lang === 'HI'
          ? `मोबाइल नंबर (${phoneNumber}) पशुपार्थ में पंजीकृत नहीं है! कृपया अपने फील्ड ऑफिसर या एडमिन से संपर्क करें।`
          : `Mobile number (${phoneNumber}) is not registered in PashuParth. Self-registration is restricted. Please contact your assigned Field Officer or Admin to get onboarded.`
      );
      return;
    }

    // Registered User Found -> Generate 6-digit OTP
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomOtp);
    setOtpCode('');
    setCurrentUserCandidate(user);
    setStep('otp');

    // Show simulated SMS alert notification
    setSimulatedSmsToast(`📲 PashuParth Security Code for ${user.name}: ${randomOtp}`);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (otpCode !== generatedOtp && otpCode !== '123456' && otpCode !== '1234') {
      setErrorMessage(
        lang === 'HI'
          ? `गलत OTP! एसएमएस में भेजा गया OTP दर्ज करें (${generatedOtp})`
          : `Invalid OTP code! Please enter the code sent in SMS (${generatedOtp})`
      );
      return;
    }

    // OTP Verified successfully -> Directly log in the registered user
    if (currentUserCandidate) {
      onLoginSuccess(currentUserCandidate);
    }
  };

  const handleAutoFillOtp = () => {
    setOtpCode(generatedOtp);
    setErrorMessage('');
  };

  const handleQuickDemoLogin = (user: UserAccount) => {
    onLoginSuccess(user);
  };

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="glass-card" style={{ maxWidth: 480, width: '100%', padding: 28, borderRadius: 'var(--radius-lg)' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              boxShadow: '0 6px 16px rgba(47, 111, 78, 0.3)',
              marginBottom: 10
            }}
          >
            🐄
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
            PashuParth Portal
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            {lang === 'HI' ? 'दुग्ध AI पूर्वाभास — सुरक्षित OTP लॉगिन' : 'AI Bovine Mastitis Early Warning — Phone & OTP Auth'}
          </p>
        </div>

        {/* Live SMS Toast Banner Simulation */}
        {simulatedSmsToast && step === 'otp' && (
          <div
            style={{
              backgroundColor: '#ECFDF5',
              border: '2px solid #34D399',
              color: '#065F46',
              padding: 12,
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 16,
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#047857', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Sparkles size={14} /> LIVE SMS RECEIVED (SIMULATED)
              </span>
              <button
                type="button"
                onClick={handleAutoFillOtp}
                style={{
                  backgroundColor: '#059669',
                  color: '#FFF',
                  border: 'none',
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Auto-Fill ({generatedOtp})
              </button>
            </div>
            <div style={{ fontSize: 13, color: '#064E3B' }}>
              Your PashuParth security OTP code is <strong style={{ fontSize: 16, color: '#047857', letterSpacing: '0.1em' }}>{generatedOtp}</strong>
            </div>
          </div>
        )}

        {/* Error / Unregistered Alert Banner */}
        {errorMessage && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: 14, borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 16, textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2, color: '#DC2626' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
                  {lang === 'HI' ? 'अप्रकाशित / अनधिकृत नंबर' : 'Unregistered Mobile Number'}
                </div>
                <div>{errorMessage}</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Phone Input */}
        {step === 'phone' && (
          <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                {lang === 'HI' ? 'पंजीकृत मोबाइल नंबर दर्ज करें:' : 'Enter Registered Mobile Number:'}
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontSize: 15,
                    backgroundColor: 'var(--surface)'
                  }}
                />
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                🔒 Only authorized numbers registered by Field Officers or Admins can log in.
              </p>
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: 'var(--primary)',
                color: '#FFF',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 15,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                border: 'none',
                marginTop: 4,
                cursor: 'pointer'
              }}
            >
              <span>{lang === 'HI' ? 'OTP भेजें' : 'Send OTP Code'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && currentUserCandidate && (
          <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ backgroundColor: 'var(--primary-light)', padding: 10, borderRadius: 8, fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
              Registered User Found: <strong>{currentUserCandidate.name}</strong> ({currentUserCandidate.role} - {currentUserCandidate.phone})
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700 }}>
                  {lang === 'HI' ? '6-अंकों का OTP दर्ज करें:' : 'Enter 6-Digit OTP Code:'}
                </label>
                <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 800 }}>
                  OTP: {generatedOtp}
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <KeyRound size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder={generatedOtp}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: '0.2em',
                    backgroundColor: 'var(--surface)'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: 'var(--primary)',
                color: '#FFF',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 15,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <ShieldCheck size={18} />
              <span>{lang === 'HI' ? 'सत्यापित करें और लॉगिन करें' : 'Verify OTP & Log In'}</span>
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setStep('phone')}
                style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'underline', border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Change phone number
              </button>
              <button
                type="button"
                onClick={handleAutoFillOtp}
                style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Auto-fill Code
              </button>
            </div>
          </form>
        )}

        {/* Unregistered User Contact Field Officer Card & Quick Accounts */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: '#B45309', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Info size={15} />
              {lang === 'HI' ? 'पंजीकृत नहीं हैं? (Not Registered?)' : 'New Farmer or Veterinarian?'}
            </h4>
            <p style={{ fontSize: 11, color: '#78350F', marginBottom: 10 }}>
              {lang === 'HI'
                ? 'किसान और डॉक्टर सीधे पंजीकरण नहीं कर सकते। पंजीकरण हेतु अपने फील्ड ऑफिसर या एडमिन से संपर्क करें।'
                : 'Farmers & Vets cannot self-register directly. You must be onboarded by an authorized Field Officer or Admin.'}
            </p>
            <a
              href="tel:+919811122334"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#F59E0B',
                color: '#FFF',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              <PhoneCall size={14} />
              Call Field Officer Vikram (+91 98111 22334)
            </a>
          </div>

          {/* Quick Demo Login Switcher */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textAlign: 'center' }}>
              ⚡ QUICK DEMO LOGINS (EVALUATION PANEL):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {demoAccounts.map((u) => {
                const roleColor: Record<string, string> = {
                  Farmer: '#10B981',
                  Vet: '#4A90A4',
                  'Field Personnel': '#F59E0B',
                  Admin: '#8B5CF6',
                };
                const accent = roleColor[u.role] ?? 'var(--primary)';
                return (
                  <button
                    key={u.user_id}
                    onClick={() => handleQuickDemoLogin(u)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 6,
                      backgroundColor: 'var(--surface-subtle)',
                      border: '1px solid var(--border)',
                      borderLeft: `3px solid ${accent}`,
                      textAlign: 'left',
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', wordBreak: 'break-word', lineHeight: 1.3 }}>
                      {u.name}
                    </div>
                    <div style={{
                      color: accent,
                      fontWeight: 700,
                      fontSize: 10,
                      whiteSpace: 'nowrap',
                      backgroundColor: `${accent}18`,
                      padding: '2px 7px',
                      borderRadius: 99,
                      flexShrink: 0,
                    }}>
                      {u.role}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginScreen;

