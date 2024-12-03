import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

interface AllowedEmail {
  id: string
  email: string
  created_at: string
}

export default function EmailManager() {
  const [emails, setEmails] = useState<AllowedEmail[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmails()
  }, [])

  async function fetchEmails() {
    try {
      const { data, error } = await supabase
        .from('allowed_emails')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEmails(data || [])
    } catch (error) {
      console.error('Error fetching emails:', error)
      setMessage('حدث خطأ أثناء جلب قائمة البريد الإلكتروني')
    } finally {
      setLoading(false)
    }
  }

  async function addEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim()) return

    try {
      setMessage('')
      const { error } = await supabase
        .from('allowed_emails')
        .insert([{ email: newEmail.trim() }])

      if (error) throw error

      setMessage('تمت إضافة البريد الإلكتروني بنجاح')
      setNewEmail('')
      fetchEmails()
    } catch (error: any) {
      if (error.code === '23505') {
        setMessage('هذا البريد الإلكتروني موجود بالفعل في القائمة')
      } else {
        setMessage('حدث خطأ أثناء إضافة البريد الإلكتروني')
        console.error('Error adding email:', error)
      }
    }
  }

  async function removeEmail(emailId: string) {
    try {
      setMessage('')
      const { error } = await supabase
        .from('allowed_emails')
        .delete()
        .eq('id', emailId)

      if (error) throw error

      setMessage('تم حذف البريد الإلكتروني بنجاح')
      fetchEmails()
    } catch (error) {
      setMessage('حدث خطأ أثناء حذف البريد الإلكتروني')
      console.error('Error removing email:', error)
    }
  }

  if (loading) {
    return <div>جاري التحميل...</div>
  }

  return (
    <div className="email-manager">
      <h2>إدارة البريد الإلكتروني المسموح به</h2>
      
      <form onSubmit={addEmail} className="add-email-form">
        <input
          type="email"
          placeholder="أدخل البريد الإلكتروني"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          required
        />
        <button type="submit">إضافة</button>
      </form>

      {message && (
        <div className={`message ${message.includes('خطأ') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="email-list">
        <h3>قائمة البريد الإلكتروني المسموح به ({emails.length})</h3>
        {emails.length === 0 ? (
          <p>لا يوجد بريد إلكتروني في القائمة</p>
        ) : (
          <ul>
            {emails.map((email) => (
              <li key={email.id}>
                <span>{email.email}</span>
                <button
                  onClick={() => removeEmail(email.id)}
                  className="delete-button"
                  title="حذف"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
