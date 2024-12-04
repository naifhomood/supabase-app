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
        console.log('Current hash:', hash);
        
        if (hash && hash.includes('access_token')) {
          console.log('Found access_token in hash');
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken && refreshToken) {
            console.log('Setting session with tokens');
            const { data: { session: newSession }, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (sessionError) {
              console.error('Error setting session:', sessionError);
              setLoading(false);
              return;
            }
            
            if (newSession) {
              console.log('New session established:', newSession);
              setSession(newSession);
              if (newSession.user) {
                await checkAdminStatus(newSession.user);
              } else {
                console.log('No user in new session');
                setLoading(false);
              }
              window.history.replaceState(null, '', window.location.pathname);
            } else {
              console.log('No session returned after setSession');
              setLoading(false);
            }
          } else {
            console.log('No tokens found in hash');
            setLoading(false);
          }
        } else {
          console.log('No hash parameters found');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error handling hash params:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    const fetchSession = async () => {
      try {
        console.log('Starting session fetch');
        setLoading(true);
        
        await handleHashParams();
        
        const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession();
        console.log('Got session response:', { session: existingSession, error: sessionError });
        
        if (sessionError) {
          console.error('Error fetching session:', sessionError);
          setLoading(false);
          return;
        }
        
        if (existingSession) {
          console.log('Setting existing session:', existingSession);
          setSession(existingSession);
          if (existingSession.user) {
            await checkAdminStatus(existingSession.user);
          } else {
            console.log('No user in existing session');
            setLoading(false);
          }
        } else {
          console.log('No existing session found');
          setSession(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error in fetchSession:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log('Auth state changed:', _event, newSession?.user?.email);
      
      if (newSession) {
        console.log('Setting new session from auth change');
        setSession(newSession);
        if (newSession.user) {
          await checkAdminStatus(newSession.user);
        } else {
          console.log('No user in new session from auth change');
          setLoading(false);
        }
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else {
        console.log('No session in auth change');
        setSession(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (user: User) => {
    try {
      console.log('Starting checkAdminStatus for user:', user.email);
      console.log('User ID:', user.id);
      
      // First, try to get the user's admin status
      const { data, error } = await supabase
        .from('users')
        .select('*')  // Select all columns for debugging
        .eq('id', user.id)
        .single();

      console.log('User query result:', { data, error });

      if (error) {
        // If error is 'not found', try to create the user
        if (error.code === 'PGRST116') {
          console.log('User not found, attempting to create new user');
          const { data: insertData, error: insertError } = await supabase
            .from('users')
            .insert([
              {
                id: user.id,
                email: user.email,
                is_admin: user.email === 'naifhomood@gmail.com',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ])
            .select()
            .single();

          console.log('Insert result:', { insertData, insertError });

          if (insertError) {
            console.error('Error creating user:', insertError);
            setIsAdmin(false);
          } else {
            console.log('User created successfully:', insertData);
            setIsAdmin(insertData?.is_admin || false);
          }
        } else {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        console.log('Found existing user:', data);
        setIsAdmin(data?.is_admin || false);
      }
    } catch (err) {
      console.error('Error in checkAdminStatus:', err);
      setIsAdmin(false);
    } finally {
      console.log('Finishing checkAdminStatus, setting loading to false');
      setLoading(false);
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
              onClick={() => handleSignOut()}
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

export default App;
