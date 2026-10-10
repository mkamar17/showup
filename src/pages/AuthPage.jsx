// Mock sign up / log in — any password works, only the username matters.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useApp } from '../api/useApp'
import authBg from '../assets/auth_bg.svg'
import showupBannerBlack from '../assets/showup-banner-black-cropped.png'
import showupBannerWhite from '../assets/showup-banner-white-cropped.png'
import '../styles/auth.css'

export default function AuthPage() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', name: '', email: '', password: '' })
  const [error, setError] = useState('')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function submit(e) {
    e.preventDefault()
    const username = form.username.trim().replace(/^@/, '')
    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username)) {
      setError('Usernames are 3–20 letters, numbers, dots or underscores.')
      return
    }
    if (mode === 'signup' && !form.name.trim()) {
      setError('Tell us your name.')
      return
    }
    if (!form.password) {
      setError('Enter any password — this is a prototype.')
      return
    }
    const result = login({ username, name: mode === 'signup' ? form.name : '', email: form.email })
    if (!result.ok) {
      setError(result.message)
      return
    }
    navigate('/')
  }

  return (
    <div className="auth">
      <aside className="auth__hero">
        <div className="auth__brand">
          <img className="auth__brand-logo" src={showupBannerWhite} alt="show up!" />
        </div>
        <img src={authBg} alt="" className="auth__art" />
        <h1>Show up, or pay up.</h1>
        <p>Commit a few pounds with your friends. Check in at the venue to get it back — and collect a share from whoever bails.</p>
      </aside>

      <main className="auth__panel">
        <form className="auth__form" onSubmit={submit} noValidate>
          <div className="auth__brand auth__brand--mobile">
            <img className="auth__brand-logo" src={showupBannerBlack} alt="show up!" />
          </div>
          <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="muted">{mode === 'login' ? 'Log in to see your events.' : 'It only takes a username to get started.'}</p>

          <div className="segmented">
            <button type="button" className={mode === 'login' ? 'is-active' : ''} onClick={() => { setMode('login'); setError('') }}>
              Log in
            </button>
            <button type="button" className={mode === 'signup' ? 'is-active' : ''} onClick={() => { setMode('signup'); setError('') }}>
              Sign up
            </button>
          </div>

          {mode === 'signup' && (
            <label className="field">
              <span>Full name</span>
              <input type="text" value={form.name} onChange={set('name')} placeholder="Your name" autoComplete="name" />
            </label>
          )}
          <label className="field">
            <span>Username</span>
            <div className="input-prefix">
              <span>@</span>
              <input type="text" value={form.username} onChange={set('username')} placeholder="username" autoComplete="username" autoCapitalize="none" />
            </div>
          </label>
          {mode === 'signup' && (
            <label className="field">
              <span>Email (optional)</span>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
            </label>
          )}
          <label className="field">
            <span>Password</span>
            <input type="password" value={form.password} onChange={set('password')} placeholder="Anything works" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn--primary btn--block btn--lg">
            {mode === 'login' ? 'Log in' : 'Create account'} <ArrowRight size={18} />
          </button>
          <p className="muted small center">Prototype — no real accounts, passwords or payments.</p>
        </form>
      </main>
    </div>
  )
}
