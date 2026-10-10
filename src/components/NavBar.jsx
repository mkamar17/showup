// Sidebar: brand, search, navigation, balance, notifications and profile.
// Desktop: a collapsed icon rail that peeks open on hover/focus (floating over
// the page) and can be pinned open (pushing the page). The pin is remembered.
// Mobile: it becomes a compact header plus a bottom tab bar (no toggle).
import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  House,
  Images,
  Landmark,
  LogOut,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { useApp } from "../api/useApp";
import { formatMoney } from "../api/format";
import Avatar from "./Avatar";
import SearchBar from "./SearchBar";
import NotificationDropdown from "./NotificationDropdown";
import showupBannerWine from "../assets/showup-banner-wine-cropped.png";
import showupBanner from "../assets/showup-banner-white-cropped.png";

const LINKS = [
  { to: "/", label: "Home", icon: House, end: true },
  { to: "/community", label: "Community", icon: Users },
  { to: "/memories", label: "Memories", icon: Images },
  { to: "/profile", label: "Profile", icon: User },
];

const STORAGE_KEY = "showup.sidebar.pinned";
const HOVER_OPEN_DELAY = 120; // ms: ignore the mouse just passing by
const HOVER_CLOSE_DELAY = 220; // ms: forgive small slips (e.g. crossing to a dropdown)

function readPinned() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export default function NavBar() {
  const { me, logout } = useApp();
  const navigate = useNavigate();

  const [isPinned, setIsPinned] = useState(readPinned);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const hoverTimer = useRef(null);
  const searchRef = useRef(null);
  // After unpinning, the pointer is still over the sidebar. Ignore hover until
  // it leaves, otherwise the peek keeps the sidebar open and only the page moves.
  const suppressHover = useRef(false);

  const isExpanded = isPinned || isHovered || isFocused;

  // The toggle is authoritative: unpinning closes the sidebar straight away.
  const togglePinned = () => {
    if (isPinned) {
      clearTimeout(hoverTimer.current);
      suppressHover.current = true;
      setIsHovered(false);
      setIsFocused(false);
    }
    setIsPinned(!isPinned);
  };
  const togglePinnedRef = useRef(togglePinned);
  useEffect(() => {
    togglePinnedRef.current = togglePinned;
  });

  // Remember the pinned state between visits.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, isPinned ? "1" : "0");
    } catch {
      // storage unavailable: the pin simply won't persist
    }
  }, [isPinned]);

  // "[" toggles the pin (ignored while typing or with modifier keys).
  useEffect(() => {
    const onKeyDown = (e) => {
      const el = e.target;
      const typing =
        el instanceof HTMLElement &&
        (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "[") togglePinnedRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Don't leave a pending hover timer running after unmount.
  useEffect(() => {
    return () => clearTimeout(hoverTimer.current);
  }, []);

  const handlePointerEnter = (e) => {
    if (e.pointerType === "touch") return; // a tap must not leave the sidebar stuck open
    if (suppressHover.current) return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setIsHovered(true), HOVER_OPEN_DELAY);
  };

  const handlePointerLeave = (e) => {
    if (e.pointerType === "touch") return;
    suppressHover.current = false;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(
      () => setIsHovered(false),
      HOVER_CLOSE_DELAY,
    );
  };

  // Keyboard users tabbing into the rail should see the labels.
  const handleFocus = (e) => {
    if (e.target.matches(":focus-visible")) setIsFocused(true);
  };

  const handleBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setIsFocused(false);
  };

  // Tapping the search icon on the collapsed rail (e.g. a tablet) opens it
  // and focuses the field. Focus keeps it open until focus leaves the sidebar.
  const handleSearchClick = () => {
    if (isExpanded) return;
    setIsFocused(true);
    searchRef.current?.querySelector("input")?.focus();
  };

  return (
    <div className={`sidebar-slot${isPinned ? " is-pinned" : ""}`}>
      <aside
        id="app-sidebar"
        className={`sidebar${isExpanded ? " is-expanded" : ""}${isPinned ? " is-pinned" : ""}`}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <button
          type="button"
          className="sidebar__toggle"
          onClick={togglePinned}
          aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar open"}
          aria-pressed={isPinned}
          aria-controls="app-sidebar"
          title={isPinned ? "Unpin sidebar  [" : "Pin sidebar open  ["}
        >
          {isPinned ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        <button
          type="button"
          className="sidebar__brand"
          onClick={() => navigate("/")}
          aria-label="show up! home"
        >
          <picture className="sidebar__brand-reveal">
            <source media="(max-width: 900px)" srcSet={showupBannerWine} />
            <img
              className="sidebar__brand-image"
              src={showupBanner}
              alt="show up!"
            />
          </picture>
        </button>

        <div
          className="sidebar__search"
          ref={searchRef}
          onClick={handleSearchClick}
        >
          <SearchBar />
        </div>

        <nav className="sidebar__nav" aria-label="Main">
          <ul className="sidebar__links">
            {LINKS.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `sidebar__link${isActive ? " is-active" : ""}`
                  }
                >
                  <Icon size={20} />
                  <span className="sidebar__label">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar__bottom">
          <button
            type="button"
            className="sidebar__balance"
            onClick={() =>
              navigate(
                me.starling ? "/profile?tab=wallet" : "/profile?tab=banking",
              )
            }
          >
            {me.starling ? <Wallet size={18} /> : <Landmark size={18} />}
            <span className="sidebar__balance-text">
              <small>
                {me.starling ? "Starling balance" : "No bank connected"}
              </small>
              <strong>
                {me.starling ? formatMoney(me.balance) : "Connect Starling"}
              </strong>
            </span>
          </button>

          <NotificationDropdown />

          <div className="sidebar__profile">
            <button
              type="button"
              className="sidebar__me"
              onClick={() => navigate("/profile")}
            >
              <Avatar user={me} size={40} />
              <span className="sidebar__me-text">
                <strong>{me.name}</strong>
                <small>@{me.username}</small>
              </span>
            </button>
            <button
              type="button"
              className="sidebar__logout"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              aria-label="Log out"
              title="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
