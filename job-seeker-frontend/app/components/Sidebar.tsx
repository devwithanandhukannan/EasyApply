'use client';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  Calendar, 
  Star, 
  Bell, 
  DollarSign,
  Menu,
  X,
  User,
  ChevronDown,
  LogOut,
  Search,
  Settings,
  Home
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();

  // Handle mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

// Update the menuItems array in app/components/Sidebar.tsx
const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: Search, label: 'Browse Jobs', href: '/dashboard/jobs' }, // ADD THIS
  { icon: FileText, label: 'My Resumes', href: '/dashboard/resumes' },
  { icon: Briefcase, label: 'Applied Jobs', href: '/dashboard/applications' },
  { icon: Calendar, label: 'Interviews', href: '/dashboard/interviews' },
  { icon: User, label: 'Profile', href: '/dashboard/profile' },
];

  const handleLogout = () => {
    logout();
  };

  const handleNavClick = () => {
    if (isMobile) {
      setShowMobileMenu(false);
    }
  };

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 bg-[#1c1c1e] border-b border-[#2c2c2e] p-4 flex items-center justify-between z-50 h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-semibold text-sm">J</span>
            </div>
            <span className="text-white font-semibold">JobPortal</span>
          </div>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 hover:bg-[#2c2c2e] rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && showMobileMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-40 top-16"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Desktop/Mobile Sidebar */}
      <div
        className={`${
          isMobile
            ? `fixed top-16 left-0 right-0 h-[calc(100vh-64px)] bg-[#1c1c1e] border-b border-[#2c2c2e] overflow-y-auto z-40 transform transition-transform duration-300 ${
                showMobileMenu ? 'translate-x-0' : '-translate-x-full'
              }`
            : `fixed top-0 left-0 h-screen bg-[#1c1c1e] border-r border-[#2c2c2e] transition-all duration-300 z-50 flex flex-col ${
                isCollapsed ? 'w-20' : 'w-72'
              }`
        }`}
      >
        {/* Desktop Header */}
        {!isMobile && (
          <div className="p-4 border-b border-[#2c2c2e] flex items-center justify-between sticky top-0 bg-[#1c1c1e]">
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-black font-semibold text-sm">J</span>
                </div>
                <span className="text-white font-semibold text-lg">JobPortal</span>
              </div>
            )}
            {isCollapsed && (
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mx-auto">
                <span className="text-black font-semibold text-sm">J</span>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-2 hover:bg-[#2c2c2e] rounded-lg transition-colors text-gray-400 hover:text-white ${
                isCollapsed ? 'absolute top-4 right-2' : ''
              }`}
            >
              {isCollapsed ? <Menu size={20} /> : <X size={20} />}
            </button>
          </div>
        )}

        {/* User Account Info */}
        <div className="p-4 border-b border-[#2c2c2e]">
          <div className="relative">
            <button
              onClick={() => !isCollapsed && !isMobile && setShowUserMenu(!showUserMenu)}
              className={`w-full flex items-center space-x-3 p-3 hover:bg-[#2c2c2e] rounded-xl transition-colors ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title={isCollapsed ? user?.name || 'User' : ''}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User size={20} className="text-white" />
                )}
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex-1 text-left">
                    <p className="text-white text-sm font-medium truncate">
                      {user?.name || 'User Name'}
                    </p>
                    <p className="text-gray-500 text-xs truncate">{user?.email || 'user@email.com'}</p>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform ${
                      showUserMenu ? 'rotate-180' : ''
                    }`}
                  />
                </>
              )}
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && !isCollapsed && !isMobile && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#000000] border border-[#2c2c2e] rounded-xl overflow-hidden shadow-xl z-50">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-[#1c1c1e] transition-colors text-gray-300 hover:text-white"
                >
                  <User size={16} />
                  <span className="text-sm">View Profile</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-[#1c1c1e] transition-colors text-gray-300 hover:text-white"
                >
                  <Settings size={16} />
                  <span className="text-sm">Settings</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-[#1c1c1e] transition-colors text-red-500 hover:text-red-400 border-t border-[#2c2c2e]"
                >
                  <LogOut size={16} />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            )}

            {/* Mobile User Menu */}
            {isMobile && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2c2c2e]">
                <div>
                  <p className="text-white text-xs font-medium">Account</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className={isMobile ? 'space-y-2' : 'space-y-1'}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-white text-black shadow-lg'
                        : 'text-gray-400 hover:bg-[#2c2c2e] hover:text-white'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon size={20} />
                    {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer - App Version (Desktop only) */}
        {!isCollapsed && !isMobile && (
          <div className="p-4 border-t border-[#2c2c2e]">
            <div className="text-center">
              <p className="text-gray-600 text-xs">JobPortal v1.0</p>
              <p className="text-gray-700 text-xs mt-1">© 2024 All rights reserved</p>
            </div>
          </div>
        )}

        {/* Mobile Footer Actions */}
        {isMobile && (
          <div className="p-4 border-t border-[#2c2c2e] space-y-2">
            <Link
              href="/dashboard/profile"
              onClick={handleNavClick}
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-[#2c2c2e] transition-colors text-sm"
            >
              <User size={16} />
              <span>View Profile</span>
            </Link>
            <Link
              href="/dashboard/settings"
              onClick={handleNavClick}
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-[#2c2c2e] transition-colors text-sm"
            >
              <Settings size={16} />
              <span>Settings</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:text-red-400 hover:bg-[#2c2c2e] transition-colors text-sm"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}