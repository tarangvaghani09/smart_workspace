import { Link, useNavigate, useLocation } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';
import { FiLogOut } from 'react-icons/fi';
import { RiFileList2Line, RiLockPasswordLine } from 'react-icons/ri';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showMobileBar, setShowMobileBar] = useState(true);
  const profileRef = useRef(null);
  const mobileProfileRef = useRef(null);
  const lastScrollY = useRef(0);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };


  useEffect(() => {
    const onDocClick = (e) => {
      const inDesktop = profileRef.current && profileRef.current.contains(e.target);
      const inMobile = mobileProfileRef.current && mobileProfileRef.current.contains(e.target);
      if (!inDesktop && !inMobile) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const minHideOffset = 64;
    const hideDelta = 8;
    const getScrollTop = () => {
      const el = document.scrollingElement || document.documentElement;
      return el ? el.scrollTop : window.scrollY || 0;
    };

    lastScrollY.current = getScrollTop();

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentY = getScrollTop();
        const prevY = lastScrollY.current;

        if (currentY <= 0) {
          setShowMobileBar(true);
          lastScrollY.current = 0;
          ticking = false;
          return;
        }

        if (currentY < prevY) {
          setShowMobileBar(true);
        } else if (currentY > prevY + hideDelta && currentY > minHideOffset) {
          setShowMobileBar(false);
        }

        lastScrollY.current = currentY;
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onScroll, { passive: true });
    window.addEventListener('touchmove', onScroll, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onScroll);
      window.removeEventListener('touchmove', onScroll);
      document.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      setShowMobileBar(true);
    }
  }, [mobileOpen]);


  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-dashboard w-5 h-5 text-primary-foreground"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg> },
    { label: 'My Bookings', path: '/bookings', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-days w-5 h-5 text-muted-foreground group-hover:text-foreground"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path></svg> },
    { label: 'Rooms', path: '/search', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building2 w-5 h-5 text-primary-foreground"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path><path d="M10 6h4"></path><path d="M10 10h4"></path><path d="M10 14h4"></path><path d="M10 18h4"></path></svg> },
    { label: 'Admin Approval', path: '/admin/approvals', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings w-5 h-5 text-primary-foreground"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>, adminOnly: true }
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className={`lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 transition-transform duration-200 ${showMobileBar ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center gap-3 px-3 py-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"
            aria-label="Open navigation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="6" y2="6"></line><line x1="3" x2="21" y1="12" y2="12"></line><line x1="3" x2="21" y1="18" y2="18"></line></svg>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path><path d="M10 6h4"></path><path d="M10 10h4"></path><path d="M10 14h4"></path><path d="M10 18h4"></path></svg>
            </div>
            <div>
              <h1 className="font-display font-bold text-base leading-none tracking-tight">WorkSpace</h1>
              <p className="mt-1 text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                SCHEDULER
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`lg:hidden fixed inset-0 z-40 ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-72 bg-white border-r border-slate-200 flex flex-col transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path><path d="M10 6h4"></path><path d="M10 10h4"></path><path d="M10 14h4"></path><path d="M10 18h4"></path></svg>
              </div>
              <div>
                <h1 className="font-display font-bold text-base leading-none tracking-tight">WorkSpace</h1>
                <p className="mt-1 text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                  SCHEDULER
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"
              aria-label="Close navigation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"></line><line x1="6" x2="18" y1="6" y2="18"></line></svg>
            </button>
          </div>

          <div className="border-t border-slate-200" />

          <nav className="flex-1 px-3 mt-4 flex flex-col gap-1 overflow-y-auto">
            {navItems.map(item => {
              const isActive = item.path === '/admin/approvals'
                ? location.pathname.startsWith('/admin')
                : location.pathname === item.path;
              return (!item.adminOnly || user?.role === 'admin') && (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-md font-semibold transition ${isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-100'
                    }`}
                >
                  <span className="font-medium">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 relative border-t border-slate-200" ref={mobileProfileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="w-full bg-gray-100 rounded-2xl p-4 flex items-center gap-3 cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role || 'Member'}
                </p>
              </div>
            </button>

            {profileOpen && (
              <div
                onMouseLeave={() => setProfileOpen(false)}
                className="static mt-2 rounded-xl border border-gray-200 bg-white p-1 shadow-lg z-20 lg:absolute lg:bottom-[88px] lg:left-4 lg:right-4 lg:mt-0"
              >
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/change-password');
                    setMobileOpen(false);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer flex items-center gap-2"
                >
                  <RiLockPasswordLine className="h-4 w-4" />
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/policies');
                    setMobileOpen(false);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer flex items-center gap-2"
                >
                  <RiFileList2Line className="h-4 w-4" />
                  Policies
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-2"
                >
                  <FiLogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      <aside className="hidden lg:flex w-64 h-screen bg-white border-r border-slate-200 flex-col fixed">

      {/* LOGO */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building2 w-6 h-6"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path><path d="M10 6h4"></path><path d="M10 10h4"></path><path d="M10 14h4"></path><path d="M10 18h4"></path></svg>
        </div>
        <div>
          <h1 className="font-display font-bold text-xl leading-none tracking-tight">WorkSpace</h1>
          <p className="mt-2 text-slate-500 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            SCHEDULER
          </p>
        </div>
      </div>

      <div className='border-t border-slate-200'></div>
      {/* NAV ITEMS */}
      <nav className="flex-1 px-3 space-y-1 mt-6">
        {navItems.map(item => {
          const isActive = item.path === '/admin/approvals'
            ? location.pathname.startsWith('/admin')
            : location.pathname === item.path;
          return (!item.adminOnly || user?.role === 'admin') && (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-md font-semibold transition ${isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-100'
                }`}
            >
              <span className="font-medium">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* USER CARD */}
      <div className="p-4 relative" ref={profileRef}>
        <button
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          onMouseEnter={() => setProfileOpen(true)}
          className="w-full bg-gray-100 rounded-2xl p-4 flex items-center gap-3 mb-2 cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role || 'Member'}
            </p>
          </div>
        </button>

        {profileOpen && (
          <div
            onMouseLeave={() => setProfileOpen(false)}
            className="absolute bottom-[88px] left-4 right-4 rounded-xl border border-gray-200 bg-white p-1 shadow-lg z-20"
          >
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false);
                navigate('/change-password');
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer flex items-center gap-2"
            >
              <RiLockPasswordLine className="h-4 w-4" />
              Change Password
            </button>
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false);
                navigate('/policies');
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer flex items-center gap-2"
            >
              <RiFileList2Line className="h-4 w-4" />
              Policies
            </button>
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false);
                handleLogout();
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-2"
            >
              <FiLogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
