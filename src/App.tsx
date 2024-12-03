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
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    header_bg: '#ffffff',
    header_text: '#000000',
    footer_bg: '#ffffff',
    footer_text: '#000000',
    board_bg: '#f0f2f5',
    default_column_bg: '#e2e8f0'
  });

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data && data.session) {
        setSession(data.session);
        if (data.session.user) {
          checkAdminStatus(data.session.user);
        }
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (currentSession) {
        setSession(currentSession);
        if (currentSession.user) {
          checkAdminStatus(currentSession.user);
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

  if (!session) {
    return (
      <div className="auth-container">
        <Auth 
          supabaseClient={supabase} 
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          view="magic_link"
          localization={{
            variables: {
              magic_link: {
                button_label: "إرسال رابط تسجيل الدخول",
                loading_button_label: "جاري إرسال الرابط...",
                confirmation_text: "تحقق من بريدك الإلكتروني للحصول على رابط تسجيل الدخول",
                error_message: "حدث خطأ أثناء إرسال الرابط"
              }
            }
          }}
        />
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
              onClick={() => supabase.auth.signOut()}
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
          <KanbanBoard defaultColumnColor={themeSettings.default_column_bg} />
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
