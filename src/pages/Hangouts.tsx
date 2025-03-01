import React, { useEffect } from 'react';
import { useHangoutStore } from '../stores/hangoutStore';
import HangoutList from '../components/HangoutList';

const Hangouts: React.FC = () => {
  const { 
    hangouts, 
    fetchHangouts, 
    loading, 
    error,
    updateParticipantStatus
  } = useHangoutStore();
  
  useEffect(() => {
    fetchHangouts();
  }, [fetchHangouts]);
  
  // Filter hangouts by status
  const pendingHangouts = hangouts.filter(h => h.status === 'pending');
  const acceptedHangouts = hangouts.filter(h => h.status === 'accepted');
  const declinedHangouts = hangouts.filter(h => h.status === 'declined' || h.status === 'rescheduled');
  
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Your Hangouts</h1>
        <p className="text-gray-600">
          Manage your hangout requests and scheduled meetups.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hangouts...</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
            <HangoutList 
              hangouts={pendingHangouts}
              onAccept={handleAcceptHangout}
              onDecline={handleDeclineHangout}
            />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Accepted Hangouts</h2>
            <HangoutList hangouts={acceptedHangouts} />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Past or Declined</h2>
            <HangoutList hangouts={declinedHangouts} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Hangouts;