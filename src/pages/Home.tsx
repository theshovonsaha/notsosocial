import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { useHangoutStore } from '../stores/hangoutStore';
import UserSearch from '../components/UserSearch';
import HangoutList from '../components/HangoutList';

const Home: React.FC = () => {
  const { users, fetchUsers, loading: loadingUsers } = useUserStore();
  const { 
    hangouts, 
    fetchHangouts, 
    loading: loadingHangouts,
    updateParticipantStatus 
  } = useHangoutStore();
  
  useEffect(() => {
    fetchUsers();
    fetchHangouts();
  }, [fetchUsers, fetchHangouts]);
  
  // Filter pending hangouts where the user is a participant
  const pendingHangouts = hangouts.filter(hangout => 
    hangout.status === 'pending' && 
    hangout.participants?.some(p => 
      p.status === 'pending'
    )
  );
  
  // Filter accepted hangouts with active chats
  const activeHangouts = hangouts.filter(hangout => 
    hangout.status === 'accepted' && 
    hangout.group_chat_id
  );
  
  const handleAcceptHangout = async (hangoutId: string) => {
    const hangout = hangouts.find(h => h.id === hangoutId);
    if (!hangout) return;
    
    await updateParticipantStatus(hangoutId, hangout.creator_id, 'accepted');
  };
  
  const handleDeclineHangout = async (hangoutId: string) => {
    const hangout = hangouts.find(h => h.id === hangoutId);
    if (!hangout) return;
    
    await updateParticipantStatus(hangoutId, hangout.creator_id, 'declined');
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Welcome to Not So Social Media</h1>
        <p className="text-gray-600">
          Find people to hang out with in real life instead of endless scrolling.
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Find People</h2>
        <UserSearch />
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Recent Users</h3>
          {loadingUsers ? (
            <div className="text-center p-4">Loading users...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {users.slice(0, 6).map((user) => (
                <Link
                  key={user.id}
                  to={`/profile/${user.username}`}
                  className="block p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      {user.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Pending Hangout Requests</h2>
        {loadingHangouts ? (
          <div className="text-center p-4">Loading hangouts...</div>
        ) : (
          <HangoutList 
            hangouts={pendingHangouts}
            onAccept={handleAcceptHangout}
            onDecline={handleDeclineHangout}
          />
        )}
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Active Hangouts</h2>
        {loadingHangouts ? (
          <div className="text-center p-4">Loading hangouts...</div>
        ) : (
          <HangoutList hangouts={activeHangouts} />
        )}
      </div>
    </div>
  );
};

export default Home;