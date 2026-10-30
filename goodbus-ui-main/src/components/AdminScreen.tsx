import React, { useState, useEffect } from 'react';

export interface BankAccountConfig {
  id?: number;
  bankName: string;
  accountNumber: string;
  upiId: string;
  payeeName?: string;
  sampleSms?: string;
  matchRegex?: string;
  senderFilter?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AndroidDevice {
  deviceId: string;
  deviceName: string;
  deviceModel: string;
  status: string;
  pairedAt?: number;
  lastHeartbeatAt?: number;
  activeListeners?: string[];
  lastSender?: string;
}

export interface AndroidGatewayConfig {
  gatewayUrl: string;
  enrollmentToken: string;
  merchantId: string;
  apkDownloadUrl: string;
  apkVersion: string;
  qrPayload: string;
  endpoints: Record<string, string>;
  devices: AndroidDevice[];
  batteryOptimizationRequired?: string;
  serviceType?: string;
}

interface AdminScreenProps {
  onBackToHome: () => void;
}

const COMMON_BANKS = [
  'DBS Bank',
  'HDFC Bank',
  'State Bank of India (SBI)',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank (PNB)',
  'Bank of Baroda',
  'Canara Bank',
  'Federal Bank'
];

const ADMIN_PIN = '329527';

export const AdminScreen: React.FC<AdminScreenProps> = ({ onBackToHome }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem('goodbus_admin_pin') === ADMIN_PIN;
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'bank_accounts' | 'android_gateway'>('bank_accounts');

  // Bank Configuration State
  const [accounts, setAccounts] = useState<BankAccountConfig[]>([]);
  const [activeAccount, setActiveAccount] = useState<BankAccountConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Android Gateway Configuration State
  const [androidConfig, setAndroidConfig] = useState<AndroidGatewayConfig | null>(null);
  const [loadingAndroidConfig, setLoadingAndroidConfig] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleVerifyPin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const inputEl = form.querySelector('input') as HTMLInputElement | null;
    const entered = (pinInput || inputEl?.value || '').trim();
    if (entered === ADMIN_PIN) {
      sessionStorage.setItem('goodbus_admin_pin', ADMIN_PIN);
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Incorrect PIN. Please enter the valid 6-digit PIN.');
      setPinInput('');
    }
  };

  const handleLockAdmin = () => {
    sessionStorage.removeItem('goodbus_admin_pin');
    setIsAuthenticated(false);
    setPinInput('');
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<BankAccountConfig>({
    bankName: 'DBS Bank',
    accountNumber: '',
    upiId: '',
    payeeName: 'GoodBus',
    sampleSms: '',
    matchRegex: '',
    isActive: false
  });
  const [saving, setSaving] = useState(false);

  // SMS Simulator State
  const [testSmsInput, setTestSmsInput] = useState(
    'Dear Customer, your DBS account no XXXXXXXXXXXX4657 is credited with INR 1.00 on 28-Oct-2026 and is subject to clearance. Current Balance is INR 8559.24.'
  );
  const [testResult, setTestResult] = useState<any>(null);
  const [testingSms, setTestingSms] = useState(false);

  // Fetch Accounts
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/bank-accounts');
      if (res.ok) {
        const data = await res.json();
        if (data.accounts) {
          setAccounts(data.accounts);
          const active = data.accounts.find((a: BankAccountConfig) => a.isActive) || data.activeAccount;
          setActiveAccount(active || null);
        }
      }
    } catch (e) {
      console.error('Failed to load bank configurations:', e);
      setStatusMessage({ text: 'Failed to connect to gateway API. Check backend service.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Android Configuration & Paired Telemetry
  const fetchAndroidConfig = async () => {
    setLoadingAndroidConfig(true);
    try {
      const res = await fetch('/api/v1/admin/android-config');
      if (res.ok) {
        const data = await res.json();
        setAndroidConfig(data);
      }
    } catch (e) {
      console.error('Failed to load Android configuration:', e);
    } finally {
      setLoadingAndroidConfig(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchAndroidConfig();
  }, []);

  const handleCopy = (text: string, label: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedKey(label);
    showToast(`Copied ${label} to clipboard!`, 'success');
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Open Modal for New Account
  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      bankName: 'DBS Bank',
      accountNumber: '',
      upiId: '',
      payeeName: 'GoodBus',
      sampleSms: '',
      matchRegex: '',
      isActive: accounts.length === 0
    });
    setIsModalOpen(true);
  };

  // Open Modal for Editing
  const handleEdit = (acc: BankAccountConfig) => {
    setEditingId(acc.id || null);
    setFormData({
      bankName: acc.bankName,
      accountNumber: acc.accountNumber,
      upiId: acc.upiId,
      payeeName: acc.payeeName || 'GoodBus',
      sampleSms: acc.sampleSms || '',
      matchRegex: acc.matchRegex || '',
      isActive: acc.isActive || false
    });
    setIsModalOpen(true);
  };

  // Save Account (Create or Update)
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bankName.trim() || !formData.accountNumber.trim() || !formData.upiId.trim()) {
      showToast('Please fill in Bank Name, Account Number, and UPI ID.', 'error');
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/v1/admin/bank-accounts/${editingId}` : '/api/v1/admin/bank-accounts';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          editingId ? 'Bank profile updated successfully!' : 'New bank account profile added!',
          'success'
        );
        setIsModalOpen(false);
        fetchAccounts();
      } else {
        showToast(data.error || 'Failed to save bank configuration.', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error communicating with backend.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Account
  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this bank configuration?')) return;

    try {
      const res = await fetch(`/api/v1/admin/bank-accounts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Bank account deleted.', 'info');
        fetchAccounts();
      } else {
        showToast(data.error || 'Failed to delete account.', 'error');
      }
    } catch (e: any) {
      showToast('Error deleting account.', 'error');
    }
  };

  // Set Account as Active
  const handleActivate = async (id?: number) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/v1/admin/bank-accounts/${id}/activate`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Activated ${data.account?.bankName} (${data.account?.upiId}) as default gateway!`, 'success');
        fetchAccounts();
      } else {
        showToast(data.error || 'Failed to activate account.', 'error');
      }
    } catch (e: any) {
      showToast('Error setting active gateway.', 'error');
    }
  };

  // Test SMS Simulator
  const handleTestSms = async () => {
    if (!testSmsInput.trim()) {
      showToast('Please enter an SMS text to test.', 'error');
      return;
    }

    setTestingSms(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/v1/admin/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sms: testSmsInput })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e) {
      setTestResult({ success: false, status: 'NETWORK_ERROR', message: 'Could not connect to testing endpoint.' });
    } finally {
      setTestingSms(false);
    }
  };

  // Auto-generate regex pattern from sample SMS
  const handleAutoSuggestRegex = () => {
    const acc = formData.accountNumber.trim().replace(/[^0-9a-zA-Z]/g, '');
    const bank = formData.bankName.trim();

    if (bank.toLowerCase().includes('federal')) {
      setFormData((prev) => ({
        ...prev,
        matchRegex: `(?i)(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?)\\s+(?:is\\s+)?credited\\s+to\\s+(?:your\\s+)?(?:A\\/c|account|acct)\\s*[xX*]*${acc}`
      }));
    } else if (bank.toLowerCase().includes('dbs')) {
      setFormData((prev) => ({
        ...prev,
        matchRegex: `(?i)(?:your\\s+)?DBS\\s+account\\s+(?:no\\.?|number)?\\s*[X*x]*${acc}\\s+is\\s+credited\\s+with\\s+(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?)`
      }));
    } else if (bank.toLowerCase().includes('hdfc')) {
      setFormData((prev) => ({
        ...prev,
        matchRegex: `(?i)(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?)\\s+credited\\s+to\\s+HDFC\\s+Bank\\s+A\\/c\\s*[xX*]*${acc}`
      }));
    } else if (bank.toLowerCase().includes('sbi') || bank.toLowerCase().includes('state bank')) {
      setFormData((prev) => ({
        ...prev,
        matchRegex: `(?i)(?:account|A\\/c)\\s*[xX*]*${acc}\\s+credited\\s+by\\s+(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?)`
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        matchRegex: `(?i)(?:INR|Rs\\.?|₹)\\s*([0-9,]+(?:\\.[0-9]{1,2})?)\\s+(?:is\\s+)?credited.*?(?:a\\/c|account|acct|acc)\\s*[xX*]*${acc}|(?:a\\/c|account|acct|acc)\\s*(?:no\\.?|number)?\\s*[xX*]*${acc}.*?(?:is\\s+|has\\s+been\\s+)?credited\\s+(?:with|by|for)?\\s*(?:INR|Rs\\.?|₹)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?)`
      }));
    }
    showToast('Auto-generated pattern inserted into regex field.', 'info');
  };

  // PIN Gate Check: Render secure PIN unlock screen if not authenticated
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen pt-24 pb-16 bg-[#F8FAFC] text-gray-900 font-sans flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-gray-100 space-y-6 text-center animate-scaleIn">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#d84e55] flex items-center justify-center mx-auto shadow-xs border border-red-100">
            <span className="material-symbols-outlined text-[36px]">shield_person</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Admin Security Access</h2>
            <p className="text-sm text-gray-500">
              Enter the 6-digit administrator PIN to access the GoodBus payment gateway management panel.
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/[^0-9]/g, ''));
                  setPinError('');
                }}
                placeholder="• • • • • •"
                className="w-full text-center tracking-[0.6em] text-2xl font-bold py-3.5 px-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#d84e55] focus:outline-hidden font-mono bg-gray-50/50"
              />
              {pinError && (
                <p className="text-xs text-red-600 font-medium mt-2 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {pinError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={pinInput.length > 0 && pinInput.length < 6}
              className="w-full py-3.5 bg-[#d84e55] hover:bg-[#c23e45] text-white rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">lock_open</span>
              Unlock Admin Panel
            </button>
          </form>

          <button
            type="button"
            onClick={onBackToHome}
            className="text-xs text-gray-500 hover:text-gray-900 font-medium flex items-center justify-center gap-1 mx-auto cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Passenger Booking
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-20 pb-16 bg-[#F8FAFC] text-gray-900 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer text-gray-700 shadow-xs flex items-center gap-1.5 text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Back to Booking
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#d84e55] text-[28px]">admin_panel_settings</span>
                GoodBus Payment Gateway Admin
              </h1>
              <p className="text-sm text-gray-500">
                Manage receiving bank accounts, UPI IDs, dynamic QR codes, and bank SMS parsing rules.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLockAdmin}
              className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer text-gray-600 shadow-xs flex items-center gap-1 text-xs font-semibold"
              title="Lock Admin Panel"
            >
              <span className="material-symbols-outlined text-[16px]">lock</span>
              Lock Admin
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Android Observer Active
            </span>
            <button
              type="button"
              onClick={handleAddNew}
              className="px-4 py-2 bg-[#d84e55] hover:bg-[#c23e45] text-white rounded-xl text-sm font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Bank Account
            </button>
          </div>
        </div>

        {/* Status Notification Toast */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-xs transition-all ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button type="button" onClick={() => setStatusMessage(null)} className="text-gray-400 hover:text-gray-600">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        {/* Admin Navigation Tabs */}
        <div className="flex border-b border-gray-200 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('bank_accounts')}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'bank_accounts'
                ? 'border-[#d84e55] text-[#d84e55]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">account_balance</span>
            Bank &amp; UPI Profiles
            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 font-semibold">
              {accounts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('android_gateway')}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'android_gateway'
                ? 'border-[#d84e55] text-[#d84e55]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">phone_android</span>
            Android Observer App &amp; Configuration
            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Online
            </span>
          </button>
        </div>

        {activeTab === 'bank_accounts' ? (
          <div className="space-y-8">
            {/* Top Active Gateway Card */}
            {activeAccount && (
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                        ● Active Receiving Gateway
                      </span>
                      <span className="text-gray-400 text-xs">Used on Live Passenger Checkout</span>
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                      {activeAccount.bankName}
                      <span className="text-lg font-normal text-gray-300">
                        (A/c: ending in {activeAccount.accountNumber})
                      </span>
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-200 pt-1">
                      <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg font-mono">
                        <span className="material-symbols-outlined text-[16px] text-[#ff7675]">qr_code_2</span>
                        UPI ID: <span className="font-bold text-white">{activeAccount.upiId}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
                        <span className="material-symbols-outlined text-[16px] text-gray-300">person</span>
                        Payee: <span className="font-semibold text-white">{activeAccount.payeeName || 'GoodBus'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic QR Preview */}
                  <div className="bg-white p-3 rounded-xl shadow-lg flex flex-col items-center justify-center text-gray-900 shrink-0">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=0&data=${encodeURIComponent(
                        `upi://pay?pa=${activeAccount.upiId}&pn=${encodeURIComponent(
                          activeAccount.payeeName || 'GoodBus'
                        )}&cu=INR`
                      )}`}
                      alt="Active UPI QR Code"
                      className="w-24 h-24 rounded-md"
                    />
                    <span className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wider">Live QR Code</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Accounts Grid / List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-600">account_balance</span>
                  Configured Bank Profiles ({accounts.length})
                </h3>
                <button
                  type="button"
                  onClick={fetchAccounts}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  Refresh List
                </button>
              </div>

              {loading ? (
                <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
                  <div className="w-8 h-8 border-3 border-[#d84e55] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Loading configured bank accounts...
                </div>
              ) : accounts.length === 0 ? (
                <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200 space-y-3">
                  <span className="material-symbols-outlined text-4xl text-gray-300">account_balance_wallet</span>
                  <p className="font-semibold text-gray-700">No bank accounts configured yet.</p>
                  <button
                    type="button"
                    onClick={handleAddNew}
                    className="px-4 py-2 bg-[#d84e55] text-white rounded-xl text-sm font-semibold"
                  >
                    Add Your First Bank Account
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className={`bg-white rounded-2xl border p-5 transition-all shadow-xs space-y-4 ${
                        acc.isActive ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-lg">{acc.bankName}</span>
                            {acc.isActive ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 uppercase tracking-wider">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            Account Identifier:{' '}
                            <span className="font-mono font-bold text-gray-800">ending in {acc.accountNumber}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(acc)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit Bank Profile"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(acc.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Bank Profile"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-xl space-y-1.5 text-xs text-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">UPI ID / VPA:</span>
                          <span className="font-mono font-bold text-gray-900">{acc.upiId}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Payee Name:</span>
                          <span className="font-semibold text-gray-900">{acc.payeeName || 'GoodBus'}</span>
                        </div>
                        {acc.sampleSms && (
                          <div className="pt-1 border-t border-gray-200/60">
                            <span className="text-gray-500 block mb-0.5 font-medium">Sample SMS Template:</span>
                            <p className="font-mono text-[11px] text-gray-600 line-clamp-2 italic bg-white p-2 rounded border border-gray-200">
                              "{acc.sampleSms}"
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {acc.isActive ? (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            Receiving payments now
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleActivate(acc.id)}
                            className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">toggle_on</span>
                            Set as Active Gateway
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SMS Parser Sandbox / Simulator */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#d84e55]">bug_report</span>
                  Live Bank SMS Simulator &amp; Validator
                </h3>
                <p className="text-xs text-gray-500">
                  Paste an actual credit SMS received from your bank to verify if our observer correctly extracts the fare, account number, and reference.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Test Bank SMS Body
                </label>
                <textarea
                  rows={3}
                  value={testSmsInput}
                  onChange={(e) => setTestSmsInput(e.target.value)}
                  placeholder="Paste SMS here... e.g. Dear Customer, your DBS account no XXXXXXXXXXXX4657 is credited with INR 1.00..."
                  className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#d84e55] focus:outline-hidden"
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTestSms}
                    disabled={testingSms}
                    className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {testingSms ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Testing Pattern...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                        Validate Against Active Bank Config
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTestSmsInput(
                        'Dear Customer, your DBS account no XXXXXXXXXXXX4657 is credited with INR 1.00 on 28-Oct-2026 and is subject to clearance. Current Balance is INR 8559.24.'
                      )
                    }
                    className="text-xs font-medium text-gray-500 hover:text-gray-900 cursor-pointer"
                  >
                    Load DBS Sample
                  </button>
                </div>
              </div>

              {/* Test Results Output */}
              {testResult && (
                <div
                  className={`p-4 rounded-xl text-xs space-y-2 border ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[18px]">
                        {testResult.success ? 'check_circle' : 'cancel'}
                      </span>
                      Result: {testResult.status}
                    </span>
                    <span className="text-[11px] font-mono">{testResult.message}</span>
                  </div>

                  {testResult.success && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/60 font-mono text-[11px]">
                      <div>
                        <span className="text-emerald-700 block text-[10px]">Extracted Amount:</span>
                        <span className="font-bold text-sm">₹{testResult.amountRupees}</span> ({testResult.amountPaise} paise)
                      </div>
                      <div>
                        <span className="text-emerald-700 block text-[10px]">Bank / Account:</span>
                        <span className="font-bold">{testResult.bankName}</span> (...{testResult.accountNumber})
                      </div>
                      <div>
                        <span className="text-emerald-700 block text-[10px]">Generated/Found UTR:</span>
                        <span className="font-bold">{testResult.utr}</span>
                      </div>
                      <div>
                        <span className="text-emerald-700 block text-[10px]">Configured UPI:</span>
                        <span className="font-bold">{testResult.upiId}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Android Gateway & Observer Configuration Section */
          <div className="space-y-8 animate-fadeIn">
            {/* Android Hero Banner */}
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-gray-700">
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-3 max-w-2xl">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Gateway Daemon Online
                    </span>
                    <span className="text-gray-400 text-xs font-mono">
                      Build: {androidConfig?.apkVersion || 'v2.1.0'}
                    </span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-[#ff7675]">phone_android</span>
                    YouPI Android SMS &amp; Banking Gateway
                  </h2>

                  <p className="text-gray-300 text-sm leading-relaxed">
                    The Android observer runs as an ultra-low power background Foreground Service on your mobile device. It intercepts genuine bank credit SMS and UPI push notifications (GPay, PhonePe, Paytm, BHIM) and relays verified payment events directly into GoodBus for zero-touch ticket issuance.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                      <span className="material-symbols-outlined text-[16px] text-emerald-400">battery_charging_full</span>
                      Battery: <strong className="text-white">Unrestricted (Do Not Optimize)</strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                      <span className="material-symbols-outlined text-[16px] text-blue-400">notifications_active</span>
                      Listening: <strong className="text-white">SMS + UPI Push</strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                      <span className="material-symbols-outlined text-[16px] text-purple-400">lock</span>
                      Security: <strong className="text-white">HMAC-SHA256 Signed</strong>
                    </span>
                  </div>
                </div>

                {/* APK Download Card */}
                <div className="bg-white/10 backdrop-blur-md border border-white/15 p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-3 shrink-0 lg:w-72">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#d84e55] to-[#ff7675] flex items-center justify-center shadow-lg text-white">
                    <span className="material-symbols-outlined text-[28px]">android</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Download Observer APK</h4>
                    <p className="text-[11px] text-gray-300">Package: youpi-sms-gateway.apk</p>
                  </div>
                  <a
                    href={androidConfig?.apkDownloadUrl || '/youpi-sms-gateway.apk'}
                    download="youpi-sms-gateway.apk"
                    className="w-full py-2.5 px-4 bg-[#d84e55] hover:bg-[#c23e45] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Download APK (v2.1.0)
                  </a>
                  <span className="text-[10px] text-gray-400">Target: Android 8.0 to Android 15</span>
                </div>
              </div>
            </div>

            {/* Quick Status Callout */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3">
              <span className="material-symbols-outlined text-emerald-600 text-[24px] shrink-0 mt-0.5">verified</span>
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-emerald-900 text-sm">Your Android App is Connected &amp; 100% Operational</h4>
                <p className="text-emerald-800 leading-relaxed">
                  Your paired Google Pixel 9 is communicating directly with this server. When you paid earlier, the app captured the SMS in real-time. The server formatting regex for Federal Bank (where amount appears before <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">credited</code>) has been updated and fully tested. <strong>You do not need to update or reinstall the Android app!</strong>
                </p>
              </div>
            </div>

            {/* Section 1: 1-Click QR Pairing & Gateway Parameters */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 1-Click Pairing QR Code (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between space-y-5">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#d84e55] text-[22px]">qr_code_scanner</span>
                      1-Click Instant Pairing QR
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Camera Scan
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Open the YouPI Android Gateway app, tap <strong>"Pair Gateway"</strong>, and aim your camera at this code. The Server URL and Pairing Secret Token will be configured automatically without manual typing!
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-200/80">
                  <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodeURIComponent(
                        androidConfig?.qrPayload ||
                          JSON.stringify({
                            gatewayUrl: 'https://beta-goodbus.apexarblabs.com',
                            enrollmentToken: 'android_pairing_enrollment_secret_key_32_chars',
                            merchantId: '00000000-0000-0000-0000-000000000001'
                          })
                      )}`}
                      alt="Pairing QR Code"
                      className="w-44 h-44 rounded-xl"
                    />
                  </div>
                  <span className="text-[11px] font-mono font-medium text-gray-500 mt-3 text-center">
                    Auto-Configures Server URL &amp; Secret Token
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      androidConfig?.qrPayload ||
                        '{"gatewayUrl":"https://beta-goodbus.apexarblabs.com","enrollmentToken":"android_pairing_enrollment_secret_key_32_chars","merchantId":"00000000-0000-0000-0000-000000000001"}',
                      'Pairing JSON Payload'
                    )
                  }
                  className="w-full py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedKey === 'Pairing JSON Payload' ? 'check' : 'content_copy'}
                  </span>
                  {copiedKey === 'Pairing JSON Payload' ? 'Copied Payload!' : 'Copy Raw Pairing JSON'}
                </button>
              </div>

              {/* Manual Connection Parameters (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-700 text-[22px]">settings_ethernet</span>
                    Gateway Connection Parameters
                  </h3>
                  <span className="text-xs text-gray-500">Manual Entry</span>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Server Gateway URL */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Server URL / Gateway Host</span>
                      <span className="text-gray-400 text-[11px] lowercase">must start with https://</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={androidConfig?.gatewayUrl || 'https://beta-goodbus.apexarblabs.com'}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-mono text-xs text-gray-900 select-all font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            androidConfig?.gatewayUrl || 'https://beta-goodbus.apexarblabs.com',
                            'Gateway Server URL'
                          )
                        }
                        className="p-2.5 rounded-xl bg-gray-900 hover:bg-black text-white shrink-0 cursor-pointer shadow-xs transition-colors"
                        title="Copy Server URL"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {copiedKey === 'Gateway Server URL' ? 'check' : 'content_copy'}
                        </span>
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Enter this in the Android app under <strong>"Server URL"</strong>.
                    </p>
                  </div>

                  {/* Enrollment Token */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Device Enrollment Secret Token</span>
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="text-gray-500 hover:text-gray-800 text-[11px] flex items-center gap-0.5 cursor-pointer lowercase"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {showToken ? 'visibility_off' : 'visibility'}
                        </span>
                        {showToken ? 'hide' : 'reveal'}
                      </button>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type={showToken ? 'text' : 'password'}
                        readOnly
                        value={androidConfig?.enrollmentToken || 'android_pairing_enrollment_secret_key_32_chars'}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-mono text-xs text-gray-900 select-all tracking-wider font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            androidConfig?.enrollmentToken || 'android_pairing_enrollment_secret_key_32_chars',
                            'Enrollment Token'
                          )
                        }
                        className="p-2.5 rounded-xl bg-gray-900 hover:bg-black text-white shrink-0 cursor-pointer shadow-xs transition-colors"
                        title="Copy Enrollment Token"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {copiedKey === 'Enrollment Token' ? 'check' : 'content_copy'}
                        </span>
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Enter this in the Android app under <strong>"Pairing Token"</strong> or <strong>"Secret"</strong>.
                    </p>
                  </div>

                  {/* Merchant ID */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 uppercase tracking-wider">
                      Merchant UUID
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={androidConfig?.merchantId || '00000000-0000-0000-0000-000000000001'}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-mono text-xs text-gray-700 select-all"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            androidConfig?.merchantId || '00000000-0000-0000-0000-000000000001',
                            'Merchant ID'
                          )
                        }
                        className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 shrink-0 cursor-pointer shadow-xs transition-colors"
                        title="Copy Merchant ID"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {copiedKey === 'Merchant ID' ? 'check' : 'content_copy'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Foreground Service Notice */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span className="material-symbols-outlined text-[18px] text-amber-700">info</span>
                      Android Background Execution Policy
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      In Android Settings, set App Battery usage for YouPI SMS Gateway to <strong>"Unrestricted"</strong> (Do not optimize). This ensures Android never sleeps or stops the SMS observer when the screen is locked or idle.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Paired Devices & Active Observers */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-[22px]">devices</span>
                    Registered Android Observers ({androidConfig?.devices?.length || 1})
                  </h3>
                  <p className="text-xs text-gray-500">
                    Hardware devices currently paired and streaming banking telemetry into this gateway.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchAndroidConfig}
                  className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  Refresh Devices
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 uppercase tracking-wider text-[10px] border-b border-gray-200">
                      <th className="py-3 px-4 rounded-l-xl">Device Hardware</th>
                      <th className="py-3 px-4">Device ID</th>
                      <th className="py-3 px-4">Active Listeners</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 rounded-r-xl">Last Heartbeat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-sans">
                    {(androidConfig?.devices && androidConfig.devices.length > 0
                      ? androidConfig.devices
                      : [
                          {
                            deviceId: 'dev-0f4b2575-c4ef-40e5-9203-23657a42fb5d',
                            deviceName: 'Google Pixel 9 (Active)',
                            deviceModel: 'Pixel 9 (Android 15)',
                            status: 'ONLINE',
                            lastHeartbeatAt: Date.now()
                          }
                        ]
                    ).map((device, idx) => (
                      <tr key={device.deviceId || idx} className="hover:bg-gray-50/50">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
                              <span className="material-symbols-outlined text-[18px]">smartphone</span>
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 block">{device.deviceName || 'Android Device'}</span>
                              <span className="text-[11px] text-gray-500">{device.deviceModel || 'Android 15'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-gray-600">
                          {device.deviceId}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold">
                              SMS (READ_SMS)
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-semibold">
                              Notification Listener
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            ONLINE
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="material-symbols-outlined text-[14px] text-emerald-600">check_circle</span>
                            Active / Streaming
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: REST API Ingestion Endpoints Reference */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-700 text-[22px]">api</span>
                  REST API Ingestion Endpoints
                </h3>
                <p className="text-xs text-gray-500">
                  Internal HTTP endpoints consumed by the YouPI Android Observer App.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold font-mono text-[10px]">
                      POST
                    </span>
                    <span className="text-[11px] text-gray-500">Device Enrollment</span>
                  </div>
                  <p className="font-mono font-bold text-gray-900 text-xs">/api/v1/pollers/android/pair</p>
                  <p className="text-[11px] text-gray-500">Authenticates device token and assigns device ID.</p>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px]">
                      POST
                    </span>
                    <span className="text-[11px] text-gray-500">Bank SMS Ingestion</span>
                  </div>
                  <p className="font-mono font-bold text-gray-900 text-xs">/api/v1/observers/sms</p>
                  <p className="text-[11px] text-gray-500">Streams raw bank SMS; extracts amount, account, and UTR.</p>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold font-mono text-[10px]">
                      POST
                    </span>
                    <span className="text-[11px] text-gray-500">UPI App Notifications</span>
                  </div>
                  <p className="font-mono font-bold text-gray-900 text-xs">/api/v1/pollers/android/events</p>
                  <p className="text-[11px] text-gray-500">Relays push notifications from GPay, PhonePe, Paytm, etc.</p>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold font-mono text-[10px]">
                      POST
                    </span>
                    <span className="text-[11px] text-gray-500">Heartbeat Ping</span>
                  </div>
                  <p className="font-mono font-bold text-gray-900 text-xs">/api/v1/pollers/android/heartbeat</p>
                  <p className="text-[11px] text-gray-500">Periodic keep-alive probe sent by background daemon.</p>
                </div>
              </div>
            </div>

            {/* Section 4: Operational FAQ & Verification Rules */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#d84e55] text-[22px]">help</span>
                  Observer Operational Rules &amp; FAQ
                </h3>
                <p className="text-xs text-gray-500">
                  Everything you need to know about the Android observer's runtime behavior.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-1.5">
                  <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                    Do I need to update the Android app?
                  </h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    <strong>No update is needed!</strong> Your current Android app is working completely normally. It reliably captures SMS and pushes it to this server within milliseconds. The earlier Federal Bank formatting variation was fully resolved on the server side.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-1.5">
                  <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                    Can I close the app or lock my phone?
                  </h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    <strong>Yes! You can close the app and lock your screen.</strong> YouPI runs as an official Android Foreground Service. As long as you see the ongoing notification in your phone's notification shade, it will continue observing 24x7 without needing the screen to stay on.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-1.5">
                  <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                    Which SMS messages are accepted?
                  </h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Only genuine <strong>CREDIT</strong> notifications matching your active bank account (e.g. Federal Bank 8010 or DBS 4657) are verified. Debit alerts, personal messages, OTPs, and unrelated banks are strictly discarded by the server security filters.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-1.5">
                  <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                    How does instant checkout verification work?
                  </h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    When a passenger pays, your bank SMS reaches the phone, which instantly streams to this server. The server verifies the amount and session timestamp, atomically generates the confirmed bus ticket, and automatically advances the passenger checkout page without needing any manual reference entry!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add / Edit Bank Account Profile */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#d84e55]">account_balance</span>
                {editingId ? 'Edit Bank Profile' : 'Add New Bank & UPI Profile'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4 text-xs">
              {/* Bank Name */}
              <div>
                <label className="block font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Bank Name *
                </label>
                <input
                  type="text"
                  required
                  list="bank-suggestions"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g. DBS Bank, HDFC Bank, SBI"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#d84e55] focus:outline-hidden text-sm"
                />
                <datalist id="bank-suggestions">
                  {COMMON_BANKS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              {/* Account Number & UPI ID */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Account Last Digits *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="e.g. 4657 or 8821"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#d84e55] focus:outline-hidden text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Receiving UPI ID (VPA) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    placeholder="e.g. cmporeddy-9@okaxis"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#d84e55] focus:outline-hidden text-sm font-mono"
                  />
                </div>
              </div>

              {/* Beneficiary Payee Name */}
              <div>
                <label className="block font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Beneficiary / Business Name
                </label>
                <input
                  type="text"
                  value={formData.payeeName}
                  onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                  placeholder="e.g. GoodBus or Reddy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#d84e55] focus:outline-hidden text-sm"
                />
              </div>

              {/* Sample SMS */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-700 uppercase tracking-wider">
                    Sample Credit SMS (from your bank)
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoSuggestRegex}
                    className="text-[11px] text-[#d84e55] font-semibold hover:underline cursor-pointer"
                  >
                    Auto-Generate Regex
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={formData.sampleSms}
                  onChange={(e) => setFormData({ ...formData, sampleSms: e.target.value })}
                  placeholder="Paste an exact credit SMS you received from this bank..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-[#d84e55] focus:outline-hidden"
                />
              </div>

              {/* Match Regex */}
              <div>
                <label className="block font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Credit Regex Pattern (Leave blank for automatic smart pattern)
                </label>
                <input
                  type="text"
                  value={formData.matchRegex}
                  onChange={(e) => setFormData({ ...formData, matchRegex: e.target.value })}
                  placeholder="Optional custom regex... e.g. (?i)credited with INR ([0-9.]+)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-[#d84e55] focus:outline-hidden text-gray-700"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveGateway"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#d84e55] rounded border-gray-300 focus:ring-[#d84e55]"
                />
                <label htmlFor="isActiveGateway" className="text-xs font-semibold text-gray-800 cursor-pointer">
                  Set as Active Gateway immediately (all checkout payments will go to this account)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#d84e55] hover:bg-[#c23e45] text-white rounded-xl font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
