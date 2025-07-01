import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download, LogIn, LogOut, Calendar, FileText, AlertCircle, CheckCircle, Loader, User } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';


// Auth Context
const AuthContext = React.createContext();

function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [userName, setUserName] = useState(null);

  const login = (newToken, newUserName) => {
    setToken(newToken);
    setUserName(newUserName);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setToken(null);
    setUserName(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, userName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Login Component
function LoginPage() {
  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = React.useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', { email, password });
      
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
        login(data.token, data.user_name);
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
        setError(errorData.detail || 'Login failed');
      }
    } catch (err) {
      console.error('Connection error:', err);
      setError('Connection error. Make sure the backend server is running on http://localhost:8000');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (userType) => {
    if (userType === 'admin') {
      setEmail('admin@company.com');
      setPassword('admin123');
    } else {
      setEmail('user1@company.com');
      setPassword('user123');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Excel to EDI Platform</h1>
          <p className="text-blue-200">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-300 text-sm bg-red-900/30 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-900/30 rounded-lg">
          <p className="text-sm text-blue-200 mb-3">Demo Credentials:</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fillDemoCredentials('admin')}
              className="w-full text-left text-xs text-blue-300 hover:text-blue-200 bg-blue-800/30 hover:bg-blue-800/50 p-2 rounded transition-colors"
            >
              👑 Admin: admin@company.com / admin123
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('user')}
              className="w-full text-left text-xs text-blue-300 hover:text-blue-200 bg-blue-800/30 hover:bg-blue-800/50 p-2 rounded transition-colors"
            >
              👤 User: user1@company.com / user123
            </button>
          </div>
          <div className="mt-3 text-xs text-blue-400">
            💡 Click on any credential above to auto-fill
          </div>
        </div>

        <div className="mt-6 p-3 bg-yellow-900/30 rounded-lg">
          <p className="text-xs text-yellow-200">
            ⚠️ Make sure the backend server is running on http://localhost:8000
          </p>
        </div>
      </div>
    </div>
  );
}

// File Upload Component
function FileUpload({ onFileSelect, selectedFile, isProcessing }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      onFileSelect(file);
    } else {
      alert('Please select a valid Excel file (.xlsx or .xls)');
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Upload Excel File <span className="text-red-500">*</span>
      </label>
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : selectedFile
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isProcessing}
        />
        
        <div className="space-y-3">
          {selectedFile ? (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <div>
                <p className="text-green-700 font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-gray-600 font-medium">
                  Drop your Excel file here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supports .xlsx and .xls files
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Date Range Picker Component
function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange, ediType }) {
  useEffect(() => {
    if (ediType === 'Inventory') {
      const today = new Date().toISOString().split('T')[0];
      onStartDateChange(today);
      onEndDateChange(today);
    }
  }, [ediType, onStartDateChange, onEndDateChange]);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        <Calendar className="w-4 h-4 inline mr-2" />
        Date Range
        {ediType === 'Inventory' && (
          <span className="text-sm text-blue-600 ml-2">(Auto-set for Inventory)</span>
        )}
      </label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={ediType === 'Inventory'}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={ediType === 'Inventory'}
          />
        </div>
      </div>
    </div>
  );
}

// Status Message Component
function StatusMessage({ status, message }) {
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'loading':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'loading':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return '';
    }
  };

  if (!status || !message) return null;

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border ${getStatusClass()}`}>
      {getStatusIcon()}
      <span className="font-medium">{message}</span>
    </div>
  );
}

// Success Modal Component
function SuccessModal({ isOpen, onClose, ediFilename, onDownload }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">EDI File Generated!</h3>
            <p className="text-gray-600">Your EDI file has been successfully created:</p>
            <p className="font-mono text-sm bg-gray-100 p-2 rounded mt-2 break-all">
              {ediFilename}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onDownload}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download EDI
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Connection Status Component
function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        setIsConnected(response.ok);
      } catch (err) {
        setIsConnected(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (isChecking) {
    return (
      <div className="flex items-center gap-2 text-gray-600 text-sm">
        <Loader className="w-4 h-4 animate-spin" />
        Checking connection...
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      {isConnected ? 'Backend Connected' : 'Backend Disconnected'}
    </div>
  );
}

// Main Dashboard Component
function Dashboard() {
  const { token, userName, logout } = React.useContext(AuthContext);
  const [selectedFile, setSelectedFile] = useState(null);
  const [makeCompany, setMakeCompany] = useState('');
  const [ediType, setEdiType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ status: '', message: '' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedEdiFilename, setGeneratedEdiFilename] = useState('');

  const companies = ['Renesas', 'Osram'];
  const ediTypes = ['PO', 'POS', 'CLAIM', 'Inventory'];

  const setStatus = (status, message) => {
    setStatusMessage({ status, message });
    if (status !== 'loading') {
      setTimeout(() => setStatusMessage({ status: '', message: '' }), 5000);
    }
  };

  const handleGenerateEDI = async () => {
    if (!selectedFile || !makeCompany || !ediType) {
      setStatus('error', 'Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    setStatus('loading', 'Processing Excel file and generating EDI...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('make_company', makeCompany);
      formData.append('edi_type', ediType);
      if (startDate) formData.append('start_date', startDate);
      if (endDate) formData.append('end_date', endDate);

      console.log('Sending request to:', `${API_BASE_URL}/upload-and-process`);

      const response = await fetch(`${API_BASE_URL}/upload-and-process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Success response:', data);
        setGeneratedEdiFilename(data.edi_filename);
        setStatus('success', 'EDI file generated successfully!');
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        setStatus('error', errorData.detail || 'Processing failed');
      }
    } catch (err) {
      console.error('Request error:', err);
      setStatus('error', 'Connection error. Make sure the backend server is running.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadEDI = async () => {
    try {
      console.log('Downloading:', generatedEdiFilename);
      
      const response = await fetch(`${API_BASE_URL}/download-edi/${generatedEdiFilename}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = generatedEdiFilename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setShowSuccessModal(false);
        setStatus('success', 'File downloaded successfully!');
      } else {
        setStatus('error', 'Download failed');
      }
    } catch (err) {
      console.error('Download error:', err);
      setStatus('error', 'Download error. Please try again.');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setMakeCompany('');
    setEdiType('');
    setStartDate('');
    setEndDate('');
    setStatusMessage({ status: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Excel to EDI Platform</h1>
            </div>
            
            <div className="flex items-center gap-6">
              <ConnectionStatus />
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span className="text-sm">{userName}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate EDI File</h2>
            <p className="text-gray-600">Upload your Excel file and configure the EDI parameters</p>
          </div>

          <div className="space-y-8">
            {/* File Upload */}
            <FileUpload
              onFileSelect={setSelectedFile}
              selectedFile={selectedFile}
              isProcessing={isProcessing}
            />

            {/* Configuration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Make/Company Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Make/Company <span className="text-red-500">*</span>
                </label>
                <select
                  value={makeCompany}
                  onChange={(e) => setMakeCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isProcessing}
                >
                  <option value="">Select Company</option>
                  {companies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </div>

              {/* EDI Type Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EDI Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={ediType}
                  onChange={(e) => setEdiType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isProcessing}
                >
                  <option value="">Select EDI Type</option>
                  {ediTypes.map((type) => (
                    <option key={type} value={type}>
                      {type} - {type === 'PO' ? 'Purchase Order' : 
                               type === 'POS' ? 'Point of Sale' : 
                               type === 'CLAIM' ? 'Claim' : 'Inventory'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range Picker */}
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              ediType={ediType}
            />

            {/* Status Message */}
            <StatusMessage status={statusMessage.status} message={statusMessage.message} />

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleGenerateEDI}
                disabled={isProcessing || !selectedFile || !makeCompany || !ediType}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
                {isProcessing ? 'Generating...' : 'Generate EDI'}
              </button>

              <button
                onClick={resetForm}
                disabled={isProcessing}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-900 font-semibold text-xs mt-0.5">1</div>
                <span>Upload your Excel file (.xlsx or .xls)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-900 font-semibold text-xs mt-0.5">2</div>
                <span>Select the Make/Company (Renesas or Osram)</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-900 font-semibold text-xs mt-0.5">3</div>
                <span>Choose EDI Type (PO, POS, CLAIM, or Inventory)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-900 font-semibold text-xs mt-0.5">4</div>
                <span>Set date range and click Generate EDI</span>
              </div>
            </div>
          </div>
        </div>

        </main>

{/* Success Modal */}
<SuccessModal
  isOpen={showSuccessModal}
  onClose={() => setShowSuccessModal(false)}
  ediFilename={generatedEdiFilename}
  onDownload={handleDownloadEDI}
/>
</div>
);
}

// Main App Component
function App() {
return (
<AuthProvider>
<div className="App">
  <AuthContext.Consumer>
    {({ isAuthenticated }) => (
      isAuthenticated ? <Dashboard /> : <LoginPage />
    )}
  </AuthContext.Consumer>
</div>
</AuthProvider>
);
}

export default App;