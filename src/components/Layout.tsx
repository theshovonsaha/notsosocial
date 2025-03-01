import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Calendar, Users, MessageSquare, User, LogOut } from 'lucide-react';

const Layout: React.FC = () => {
  const { profile, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Not So Social Media</h1>
          <p className="text-sm text-gray-500">Schedule real hangouts</p>
        </div>
        
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-medium">{profile?.full_name}</p>
              <p className="text-sm text-gray-500">@{profile?.username}</p>
              {profile?.is_pro && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">PRO</span>
              )}
            </div>
          </div>
          
          <nav className="space-y-1">
            <Link to="/" className="flex items-center space-x-3 p-2 rounded hover:bg-gray-100">
              <Users size={20} />
              <span>Home</span>
            </Link>
            <Link to="/availability" className="flex items-center space-x-3 p-2 rounded hover:bg-gray-100">
              <Calendar size={20} />
              <span>My Availability</span>
            </Link>
            <Link to="/hangouts" className="flex items-center space-x-3 p-2 rounded hover:bg-gray-100">
              <MessageSquare size={20} />
              <span>Hangouts</span>
            </Link>
            <Link to={`/profile/${profile?.username}`} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-100">
              <User size={20} />
              <span>My Profile</span>
            </Link>
          </nav>
        </div>
        
        <div className="absolute bottom-0 w-64 p-4 border-t">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 p-2 w-full text-left rounded hover:bg-gray-100"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;