import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface AllowedEmail {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

interface Props {
  onClose: () => void;
}

const EmailManagement: React.FC<Props> = ({ onClose }) => {
  const [emails, setEmails] = useState<AllowedEmail[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('allowed_emails')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء جلب قائمة البريد الإلكتروني' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase
        .from('allowed_emails')
        .insert([{ email: newEmail.trim(), is_admin: isAdmin }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'تمت إضافة البريد الإلكتروني بنجاح' });
      setNewEmail('');
      setIsAdmin(false);
      fetchEmails();
    } catch (error: any) {
      console.error('Error adding email:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'حدث خطأ أثناء إضافة البريد الإلكتروني' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('allowed_emails')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'تم حذف البريد الإلكتروني بنجاح' });
      fetchEmails();
    } catch (error) {
      console.error('Error deleting email:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء حذف البريد الإلكتروني' });
    }
  };

  const handleToggleAdmin = async (id: string, currentIsAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('allowed_emails')
        .update({ is_admin: !currentIsAdmin })
        .eq('id', id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'تم تحديث صلاحيات المشرف بنجاح' });
      fetchEmails();
    } catch (error) {
      console.error('Error updating admin status:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء تحديث صلاحيات المشرف' });
    }
  };

  return (
    <div className="email-management">
      <h2>إدارة البريد الإلكتروني</h2>
      
      <form onSubmit={handleSubmit} className="email-form">
        <div className="input-group">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="أدخل البريد الإلكتروني"
            required
          />
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
            />
            مشرف
          </label>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'جاري الإضافة...' : 'إضافة'}
          </button>
        </div>
      </form>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="emails-list">
        {emails.map((email) => (
          <div key={email.id} className="email-item">
            <span className="email">{email.email}</span>
            <div className="email-controls">
              <button
                className={`admin-toggle ${email.is_admin ? 'active' : ''}`}
                onClick={() => handleToggleAdmin(email.id, email.is_admin)}
              >
                {email.is_admin ? 'مشرف' : 'مستخدم'}
              </button>
              <button
                className="delete-button"
                onClick={() => handleDelete(email.id)}
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="close-button" onClick={onClose}>
        عودة إلى اللوحة
      </button>
    </div>
  );
};

export default EmailManagement;
