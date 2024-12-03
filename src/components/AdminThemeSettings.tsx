import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface ThemeSettings {
  header_bg: string;
  header_text: string;
  footer_bg: string;
  footer_text: string;
  board_bg: string;
  default_column_bg: string;
}

interface Props {
  currentSettings: ThemeSettings;
  onClose: () => void;
}

const AdminThemeSettings: React.FC<Props> = ({ currentSettings, onClose }) => {
  const [settings, setSettings] = useState<ThemeSettings>(currentSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // First, get the theme settings record ID
      const { data: themeData, error: fetchError } = await supabase
        .from('theme_settings')
        .select('id')
        .single();

      if (fetchError) throw fetchError;

      if (!themeData?.id) {
        throw new Error('لم يتم العثور على إعدادات المظهر');
      }

      // Then update using the correct ID
      const { error: updateError } = await supabase
        .from('theme_settings')
        .update(settings)
        .eq('id', themeData.id);

      if (updateError) throw updateError;

      setMessage({ type: 'success', text: 'تم حفظ التغييرات بنجاح' });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error saving theme settings:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'حدث خطأ أثناء حفظ التغييرات' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="theme-settings">
      <h2>إعدادات المظهر</h2>
      <form onSubmit={handleSubmit}>
        <div className="settings-group">
          <h3>الهيدر</h3>
          <div className="color-input">
            <label>لون الخلفية:</label>
            <input
              type="color"
              name="header_bg"
              value={settings.header_bg}
              onChange={handleChange}
            />
          </div>
          <div className="color-input">
            <label>لون النص:</label>
            <input
              type="color"
              name="header_text"
              value={settings.header_text}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="settings-group">
          <h3>الفوتر</h3>
          <div className="color-input">
            <label>لون الخلفية:</label>
            <input
              type="color"
              name="footer_bg"
              value={settings.footer_bg}
              onChange={handleChange}
            />
          </div>
          <div className="color-input">
            <label>لون النص:</label>
            <input
              type="color"
              name="footer_text"
              value={settings.footer_text}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="settings-group">
          <h3>اللوحة</h3>
          <div className="color-input">
            <label>لون خلفية اللوحة:</label>
            <input
              type="color"
              name="board_bg"
              value={settings.board_bg}
              onChange={handleChange}
            />
          </div>
          <div className="color-input">
            <label>لون العمود الافتراضي:</label>
            <input
              type="color"
              name="default_column_bg"
              value={settings.default_column_bg}
              onChange={handleChange}
            />
          </div>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="button-group">
          <button 
            type="submit" 
            className="save-button" 
            disabled={isSaving}
          >
            {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
          <button 
            type="button" 
            className="cancel-button" 
            onClick={onClose}
            disabled={isSaving}
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminThemeSettings;
