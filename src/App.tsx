import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Session, User } from '@supabase/supabase-js';
import KanbanBoard from './components/KanbanBoard';
import AdminThemeSettings from './components/AdminThemeSettings';
import EmailManagement from './components/EmailManagement';

interface ThemeSettings {
  header_bg: string;
  header_text: string;
  footer_bg: string;
  footer_text: string;
  board_bg: string;
  default_column_bg: string;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showEmailManagement, setShowEmailManagement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    header_bg: '#ffffff',
    header_text: '#000000',
    footer_bg: '#ffffff',
    footer_text: '#000000',
    board_bg: '#f0f2f5',
    default_column_bg: '#e2e8f0'
  });

  useEffect(() => {
    const handleHashParams = async () => {
      try {
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken && refreshToken) {
            const { data: { session: newSession }, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (sessionError) throw sessionError;
            if (newSession) {
              setSession(newSession);
              if (newSession.user) {
                await checkAdminStatus(newSession.user);
              }
              // Clear the hash from URL
              window.history.replaceState(null, '', window.location.pathname);
            }
          }
        }
      } catch (err) {
        console.error('Error handling hash params:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    const fetchSession = async () => {
      try {
        setLoading(true);
        await handleHashParams();
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (data && 'session' in data && data.session) {
          setSession(data.session);
          if (data.session.user) {
            await checkAdminStatus(data.session.user);
          }
        }
      } catch (err) {
        console.error('Error fetching session:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession) {
        setSession(newSession);
        if (newSession.user) {
          await checkAdminStatus(newSession.user);
        }
        // Clear the hash from URL if it exists
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else {
        setSession(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('allowed_emails')
        .select('is_admin')
        .eq('email', user.email)
        .single();

      if (error) throw error;
      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = 'https://naifhomood.github.io/supabase-app/';
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while signing out');
    }
  };

  useEffect(() => {
    const fetchThemeSettings = async () => {
      const { data, error } = await supabase
        .from('theme_settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching theme settings:', error);
        return;
      }

      if (data) {
        setThemeSettings(data);
      }
    };

    fetchThemeSettings();

    const themeSubscription = supabase
      .channel('theme_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'theme_settings'
        },
        (payload) => {
          setThemeSettings(payload.new as ThemeSettings);
        }
      )
      .subscribe();

    return () => {
      themeSubscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل التطبيق...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <div className="text-red-600 text-xl mb-4">⚠️ حدث خطأ</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="p-8 bg-white rounded-lg shadow-md w-96">
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={[]}
              redirectTo={window.location.origin + window.location.pathname}
              magicLink={true}
              view="magic_link"
              localization={{
                variables: {
                  magic_link: {
                    button_label: "أرسل رابط تسجيل الدخول",
                    loading_button_label: "جاري إرسال الرابط...",
                    confirmation_text: "تحقق من بريدك الإلكتروني للحصول على رابط تسجيل الدخول",
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app" style={{ backgroundColor: themeSettings.board_bg }}>
      <header style={{ 
        backgroundColor: themeSettings.header_bg,
        color: themeSettings.header_text 
      }}>
        <div className="header-content">
          <h1>لوحة المهام</h1>
          <div className="header-controls">
            {isAdmin && (
              <button 
                className="theme-settings-button"
                onClick={() => setShowThemeSettings(!showThemeSettings)}
              >
                إعدادات المظهر
              </button>
            )}
            <button 
              className="logout-button"
              onClick={handleSignOut}
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      <main>
        {isAdmin && (
          <div className="admin-controls">
            <button 
              className={`admin-button ${showThemeSettings ? 'active' : ''}`}
              onClick={() => {
                setShowThemeSettings(!showThemeSettings);
                setShowEmailManagement(false);
              }}
            >
              {showThemeSettings ? 'عرض اللوحة' : 'إعدادات المظهر'}
            </button>
            <button 
              className={`admin-button ${showEmailManagement ? 'active' : ''}`}
              onClick={() => {
                setShowEmailManagement(!showEmailManagement);
                setShowThemeSettings(false);
              }}
            >
              {showEmailManagement ? 'عرض اللوحة' : 'إدارة البريد الإلكتروني'}
            </button>
          </div>
        )}

        {showThemeSettings && isAdmin ? (
          <AdminThemeSettings 
            currentSettings={themeSettings}
            onClose={() => setShowThemeSettings(false)}
          />
        ) : showEmailManagement && isAdmin ? (
          <EmailManagement 
            onClose={() => setShowEmailManagement(false)}
          />
        ) : (
          <KanbanBoard themeSettings={themeSettings} />
        )}
      </main>

      <footer style={{ 
        backgroundColor: themeSettings.footer_bg,
        color: themeSettings.footer_text 
      }}>
        <p> 2024 لوحة المهام. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}

export default App;
