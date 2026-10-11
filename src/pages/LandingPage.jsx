// Public landing page for visitors who aren't signed in: what show up! is,
// how it works (with phone mockups of each step), and a way to sign up.
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Lock,
  MapPin,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'
import { useApp } from '../api/useApp'
import ActivityIcon from '../components/ActivityIcon'
import { SAMPLE_PHOTOS } from '../api/photoStore'
import showupBannerWine from '../assets/showup-banner-wine-cropped.png'
import showupBannerWhite from '../assets/showup-banner-white-cropped.png'
import '../styles/landing.css'

const SIGN_UP = '/login?mode=signup'

// Little avatar dot for the mockups (initials on a brand colour).
function Face({ name, color }) {
  return (
    <span className="mock-face" style={{ background: color }}>
      {name[0]}
    </span>
  )
}

function Phone({ children, className = '' }) {
  return (
    <div className={`phone ${className}`}>
      <div className="phone__screen">{children}</div>
    </div>
  )
}

// ---------- Hero phone: an event in its check-in window ----------
function HeroScreen() {
  const people = [
    { name: 'You', color: '#7d2a3d', state: 'in' },
    { name: 'Max', color: '#56704b', state: 'in' },
    { name: 'Levi', color: '#6e8a62', state: 'way' },
    { name: 'Grisha', color: '#c99020', state: 'wait' },
  ]
  return (
    <>
      <div className="mock-hero">
        <span className="mock-hero__icon">
          <Trophy size={18} />
        </span>
        <strong>Friday Tennis</strong>
        <small>Today · 18:00 · Regent’s Park</small>
        <span className="mock-pill mock-pill--mustard">
          <Clock size={11} /> Check-in closes in 04:12
        </span>
      </div>
      <ul className="mock-list">
        {people.map((p) => (
          <li key={p.name}>
            <Face {...p} />
            <span>{p.name}</span>
            {p.state === 'in' && (
              <em className="mock-tag mock-tag--in">
                <Check size={10} /> Here
              </em>
            )}
            {p.state === 'way' && <em className="mock-tag mock-tag--way">On the way</em>}
            {p.state === 'wait' && <em className="mock-tag">Not yet</em>}
          </li>
        ))}
      </ul>
      <div className="mock-held">
        <Lock size={13} /> £5.00 held in your Show up! Space
      </div>
      <span className="mock-btn mock-btn--wine">
        <MapPin size={14} /> Check in · 24 m away
      </span>
    </>
  )
}

// ---------- How-it-works phones ----------
function PlanScreen() {
  return (
    <>
      <p className="mock-title">New event</p>
      <div className="mock-field">
        <small>Event name</small>
        <strong>Sarah’s Birthday</strong>
      </div>
      <div className="mock-chips">
        {[
          ['birthday', 'Birthday'],
          ['dinner', 'Dinner'],
          ['concert', 'Concert'],
          ['tennis', 'Tennis'],
        ].map(([value, label], i) => (
          <span key={value} className={`mock-chip${i === 0 ? ' is-on' : ''}`}>
            <ActivityIcon activity={value} size={12} /> {label}
          </span>
        ))}
      </div>
      <div className="mock-field">
        <small>When</small>
        <strong>
          <CalendarDays size={13} /> Sat 20 Oct · 19:30
        </strong>
      </div>
      <div className="mock-field">
        <small>Commitment</small>
        <strong className="mock-amount">£10</strong>
      </div>
      <span className="mock-btn">Invite friends</span>
    </>
  )
}

function CommitScreen() {
  return (
    <>
      <p className="mock-title">Join this event?</p>
      <div className="mock-event">
        <span className="mock-event__icon">
          <ActivityIcon activity="birthday" size={16} />
        </span>
        <span>
          <strong>Sarah’s Birthday</strong>
          <small>Sat 20 Oct · 19:30</small>
        </span>
      </div>
      <div className="mock-move">
        <span>
          <small>Starling</small>
          <strong>£412.38</strong>
        </span>
        <ArrowRight size={14} />
        <span className="mock-move__space">
          <small>Show up! Space</small>
          <strong>£10.00</strong>
        </span>
      </div>
      <div className="mock-committed">
        <span className="mock-faces">
          <Face name="Sarah" color="#b98591" />
          <Face name="Max" color="#56704b" />
          <Face name="Ella" color="#c99020" />
        </span>
        <small>3 of 6 committed</small>
      </div>
      <span className="mock-btn">Join &amp; commit £10</span>
    </>
  )
}

function CheckInScreen() {
  return (
    <>
      <p className="mock-title">Check in</p>
      <div className="mock-map">
        <span className="mock-map__ring" />
        <span className="mock-map__pin">
          <MapPin size={22} />
        </span>
        <span className="mock-map__you" />
      </div>
      <p className="mock-near">
        <strong>You’re here!</strong>
        <small>24 m from the venue</small>
      </p>
      <span className="mock-btn mock-btn--wine">
        <Check size={14} /> Check in
      </span>
    </>
  )
}

function SettleScreen() {
  return (
    <>
      <div className="mock-win">
        <PartyPopper size={20} />
        <strong>You showed up!</strong>
        <small>£10 back + £3.33 from the no-show</small>
      </div>
      <p className="mock-title">Memories</p>
      <div className="mock-photos">
        {['huddle', 'sunset', 'floodlights', 'ball'].map((key) => (
          <img key={key} src={SAMPLE_PHOTOS[key]} alt="" />
        ))}
      </div>
      <small className="mock-caption">12 photos from 5 friends</small>
    </>
  )
}

const STEPS = [
  { title: 'Make the plan', text: 'Pick the activity, time and place, set a small commitment, and invite your friends.', Screen: PlanScreen },
  { title: 'Everyone commits', text: 'Each person puts in the same amount. It’s held in a Space inside their own Starling account.', Screen: CommitScreen },
  { title: 'Check in on arrival', text: 'When you get to the venue, check in with your location. That’s your money safe.', Screen: CheckInScreen },
  { title: 'Settle & remember', text: 'Show up and your money comes straight back, plus a share from anyone who bailed. Then share the photos.', Screen: SettleScreen },
]

export default function LandingPage() {
  const { state } = useApp()
  const signedIn = Boolean(state.session)
  // Signed-in visitors can still read this page; every CTA takes them back in.
  const start = signedIn ? { to: '/dashboard', label: 'Open your dashboard' } : { to: SIGN_UP, label: 'Get started, it’s free' }

  return (
    <div className="landing">
      <header className="landing-nav">
        <Link to="/" className="landing-nav__brand" aria-label="show up! home">
          <img src={showupBannerWine} alt="show up!" />
        </Link>
        <nav className="landing-nav__links" aria-label="Page">
          <a href="#how" className="landing-nav__link">
            How it works
          </a>
          {signedIn ? (
            <Link to="/dashboard" className="btn btn--primary btn--sm">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="landing-nav__link">
                Log in
              </Link>
              <Link to={SIGN_UP} className="btn btn--primary btn--sm">
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="landing-hero">
        <div className="landing-hero__copy">
          <span className="landing-eyebrow">
            <Sparkles size={14} /> For friends who mean it this time
          </span>
          <h1>
            Stop flaking.
            <br />
            Start <span className="landing-script">showing up.</span>
          </h1>
          <p className="landing-hero__lead">
            Make plans with friends and everyone commits a few pounds. Check in at the venue and it comes straight back. Bail, and your
            stake goes to the friends who came.
          </p>
          <div className="landing-hero__ctas">
            <Link to={start.to} className="btn btn--primary btn--lg">
              {start.label} <ArrowRight size={18} />
            </Link>
            <a href="#how" className="btn btn--ghost btn--lg">
              See how it works
            </a>
          </div>
          <ul className="landing-trust">
            <li>
              <ShieldCheck size={16} /> Money stays in your own Starling account
            </li>
            <li>
              <MapPin size={16} /> Check in by location
            </li>
            <li>
              <Users size={16} /> Better with friends
            </li>
          </ul>
        </div>

        <div className="landing-hero__art" aria-hidden="true">
          <span className="blob blob--mustard" />
          <span className="blob blob--sage" />
          <span className="blob blob--ring" />
          <span className="confetti confetti--1" />
          <span className="confetti confetti--2" />
          <span className="confetti confetti--3" />
          <span className="confetti confetti--4" />
          <Phone className="phone--hero">
            <HeroScreen />
          </Phone>
          <div className="float-chip float-chip--a">
            <Face name="Max" color="#56704b" />
            <span>
              <strong>Max checked in</strong>
              <small>just now</small>
            </span>
            <Check size={16} className="float-chip__ok" />
          </div>
          <div className="float-chip float-chip--b">
            <span className="float-chip__money">+£1.67</span>
            <span>
              <strong>Grisha bailed</strong>
              <small>shared with the group</small>
            </span>
          </div>
          <div className="float-chip float-chip--c">
            <PartyPopper size={18} />
            <strong>£5 back in your account</strong>
          </div>
        </div>
      </section>

      {/* ---------- Problem + how it works ---------- */}
      <section className="landing-how" id="how">
        <div className="landing-problem">
          <div className="chat" aria-hidden="true">
            <p className="chat__bubble">we should totally do this again 🙌</p>
            <p className="chat__bubble chat__bubble--me">yes!! next week?</p>
            <p className="chat__bubble">ahh can’t make it tonight, sorry 😩</p>
            <p className="chat__bubble chat__bubble--late">…3 people have left the chat</p>
          </div>
          <div className="landing-problem__copy">
            <span className="landing-eyebrow landing-eyebrow--wine">Sound familiar?</span>
            <h2>
              Plans are easy to make.
              <br />
              <span className="landing-script landing-script--wine">Easier to bail on.</span>
            </h2>
            <p>
              show up! puts a little something on the line, so “maybe” turns into “see you there”. No awkward chasing, no one left waiting
              alone at the bar.
            </p>
          </div>
        </div>

        <div className="landing-steps__head">
          <span className="landing-eyebrow">How it works</span>
          <h2>Four steps from group chat to good times</h2>
        </div>
        <ol className="landing-steps">
          {STEPS.map(({ title, text, Screen }, i) => (
            <li key={title} className="landing-step">
              <Phone>
                <Screen />
              </Phone>
              <div className="landing-step__text">
                <span className="landing-step__num">{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="landing-cta">
          <h2>
            Your group chat has made enough plans.
            <br />
            <span className="landing-script">Make one that happens.</span>
          </h2>
          <div className="landing-hero__ctas">
            <Link to={start.to} className="btn btn--primary btn--lg">
              {signedIn ? start.label : 'Get started'} <ArrowRight size={18} />
            </Link>
            {!signedIn && (
              <Link to="/login" className="btn btn--light btn--lg">
                I already have an account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="landing-footer">
        <div className="landing-footer__top">
          <div className="landing-footer__brand">
            <img src={showupBannerWhite} alt="show up!" />
            <p>Show up, or pay up. Making plans that actually happen.</p>
          </div>
          <nav className="landing-footer__col" aria-label="Product">
            <strong>Product</strong>
            <a href="#how">How it works</a>
            <Link to={SIGN_UP}>Create an account</Link>
            <Link to="/login">Log in</Link>
          </nav>
          <div className="landing-footer__col">
            <strong>Built with</strong>
            <span>Starling Engine</span>
            <span>TfL open data</span>
            <span>OpenStreetMap</span>
          </div>
        </div>
        <div className="landing-footer__bottom">
          <span>© 2026 show up! · Made for #HuddleHiveHack26</span>
          <span>Prototype: no real accounts or money move.</span>
        </div>
      </footer>
    </div>
  )
}
