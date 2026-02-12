import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { 
  Settings as SettingsIcon,
  Moon,
  Sun,
  Globe,
  Trash2,
  Download,
  Info,
  Bell,
  Database,
  Smartphone,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Settings = ({ language = 'en', setLanguage }) => {
  const { theme, toggleTheme, isDark } = useTheme();
  
  const [notifications, setNotifications] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [cacheSize, setCacheSize] = useState('0 MB');
  const [isOnline, setIsOnline] = useState(true);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);
    
    // Check if running as PWA
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInstalled = window.navigator.standalone === true;
      setIsPWA(isStandalone || isInstalled);
    };
    checkPWA();

    // Online/Offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get cache size
    getCacheSize();

    // Load saved settings
    const savedNotifications = localStorage.getItem('netprep-notifications') === 'true';
    const savedAutoSync = localStorage.getItem('netprep-autosync') !== 'false';
    setNotifications(savedNotifications);
    setAutoSync(savedAutoSync);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getCacheSize = async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const usedMB = ((estimate.usage || 0) / (1024 * 1024)).toFixed(2);
        setCacheSize(`${usedMB} MB`);
      } catch (error) {
        console.error('Failed to get cache size:', error);
      }
    }
  };

  const clearCache = async () => {
    const confirmMsg = language === 'hi' 
      ? 'क्या आप सभी कैश्ड डेटा साफ करना चाहते हैं?'
      : 'Are you sure you want to clear all cached data?';
    
    if (!window.confirm(confirmMsg)) return;

    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      localStorage.removeItem('netprep-cache');
      
      const successMsg = language === 'hi'
        ? 'कैश सफलतापूर्वक साफ हो गया! कृपया पेज रीलोड करें।'
        : 'Cache cleared successfully! Please reload the page.';
      alert(successMsg);
      getCacheSize();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      const errorMsg = language === 'hi'
        ? 'कैश साफ करने में विफल। कृपया पुनः प्रयास करें।'
        : 'Failed to clear cache. Please try again.';
      alert(errorMsg);
    }
  };

  const handleNotificationToggle = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    localStorage.setItem('netprep-notifications', newValue.toString());
  };

  const handleAutoSyncToggle = () => {
    const newValue = !autoSync;
    setAutoSync(newValue);
    localStorage.setItem('netprep-autosync', newValue.toString());
  };

  const downloadData = () => {
    const data = {
      language: localStorage.getItem('netprep-language'),
      theme: localStorage.getItem('netprep-theme'),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netprep-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const text = {
    title: { en: 'Settings', hi: 'सेटिंग्स' },
    subtitle: { en: 'Manage your app preferences', hi: 'अपनी ऐप प्राथमिकताएं प्रबंधित करें' },
    appearance: { en: 'Appearance', hi: 'रूप-रंग' },
    languageLabel: { en: 'Language', hi: 'भाषा' },
    data: { en: 'Data & Storage', hi: 'डेटा और संग्रहण' },
    app: { en: 'App Settings', hi: 'ऐप सेटिंग्स' },
    about: { en: 'About', hi: 'के बारे में' },
    themeLabel: { en: 'Theme', hi: 'थीम' },
    lightMode: { en: 'Light Mode', hi: 'लाइट मोड' },
    darkMode: { en: 'Dark Mode', hi: 'डार्क मोड' },
    currentTheme: { en: 'Current Theme', hi: 'वर्तमान थीम' },
    cacheSize: { en: 'Cache Size', hi: 'कैश आकार' },
    clearCache: { en: 'Clear Cache', hi: 'कैश साफ करें' },
    downloadData: { en: 'Download My Data', hi: 'मेरा डेटा डाउनलोड करें' },
    autoSync: { en: 'Auto Sync', hi: 'ऑटो सिंक' },
    notifications: { en: 'Notifications', hi: 'सूचनाएं' },
    pwaStatus: { en: 'PWA Status', hi: 'PWA स्थिति' },
    installed: { en: 'Installed', hi: 'इंस्टॉल किया गया' },
    notInstalled: { en: 'Not Installed', hi: 'इंस्टॉल नहीं' },
    connectionStatus: { en: 'Connection Status', hi: 'कनेक्शन स्थिति' },
    online: { en: 'Online', hi: 'ऑनलाइन' },
    offline: { en: 'Offline', hi: 'ऑफ़लाइन' },
    version: { en: 'Version', hi: 'संस्करण' },
    developer: { en: 'Developer', hi: 'डेवलपर' },
    description: { en: 'Description', hi: 'विवरण' },
    appDescription: { 
      en: 'UGC NET Mock Test Application for Paper 1 & Paper 2 (History)', 
      hi: 'UGC NET पेपर 1 और पेपर 2 (इतिहास) के लिए मॉक टेस्ट एप्लिकेशन' 
    }
  };

  return (
    <Layout language={language} setLanguage={setLanguage}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            {text.title[language]}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {text.subtitle[language]}
          </p>
        </div>

        {/* Appearance Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sun className="w-5 h-5 text-primary-600" />
            {text.appearance[language]}
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                {isDark ? (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {text.themeLabel[language]}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {text.currentTheme[language]}: {isDark ? text.darkMode[language] : text.lightMode[language]}
                  </div>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  isDark ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  isDark ? 'translate-x-7' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Language Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary-600" />
            {text.languageLabel[language]}
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setLanguage('en')}
              className={`p-4 rounded-lg border-2 transition-all ${
                language === 'en' 
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900 dark:text-white">English</div>
              {language === 'en' && (
                <CheckCircle className="w-5 h-5 text-primary-600 mt-2" />
              )}
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`p-4 rounded-lg border-2 transition-all ${
                language === 'hi' 
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900 dark:text-white">हिंदी</div>
              {language === 'hi' && (
                <CheckCircle className="w-5 h-5 text-primary-600 mt-2" />
              )}
            </button>
          </div>
        </div>

        {/* Data & Storage Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary-600" />
            {text.data[language]}
          </h2>
          
          <div className="space-y-3">
            {/* Cache Size */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {text.cacheSize[language]}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{cacheSize}</div>
              </div>
              <button
                onClick={clearCache}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>{text.clearCache[language]}</span>
              </button>
            </div>

            {/* Auto Sync */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <div className="font-medium text-gray-900 dark:text-white">
                  {text.autoSync[language]}
                </div>
              </div>
              <button
                onClick={handleAutoSyncToggle}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  autoSync ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  autoSync ? 'translate-x-7' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Download Data */}
            <button
              onClick={downloadData}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{text.downloadData[language]}</span>
            </button>
          </div>
        </div>

        {/* App Settings Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-primary-600" />
            {text.app[language]}
          </h2>
          
          <div className="space-y-3">
            {/* Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <div className="font-medium text-gray-900 dark:text-white">
                  {text.notifications[language]}
                </div>
              </div>
              <button
                onClick={handleNotificationToggle}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  notifications ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  notifications ? 'translate-x-7' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* PWA Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {text.pwaStatus[language]}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {isPWA ? text.installed[language] : text.notInstalled[language]}
                  </div>
                </div>
              </div>
              {isPWA ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
            </div>

            {/* Connection Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-600" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {text.connectionStatus[language]}
                  </div>
                  <div className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                    {isOnline ? text.online[language] : text.offline[language]}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary-600" />
            {text.about[language]}
          </h2>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{text.version[language]}</div>
              <div className="font-medium text-gray-900 dark:text-white">1.0.0</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{text.description[language]}</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {text.appDescription[language]}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{text.developer[language]}</div>
              <div className="font-medium text-gray-900 dark:text-white">NETprep Team</div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                © 2024 NETprep. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;