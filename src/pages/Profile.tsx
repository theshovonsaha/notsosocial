import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { useAuthStore } from '../stores/authStore';
import { useAvailabilityStore } from '../stores/availabilityStore';
import { useHangoutStore } from '../stores/hangoutStore';
import TimeSlotList from '../components/TimeSlotList';
import HangoutRequestForm from '../components/HangoutRequestForm';

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { getUserByUsername } = useUserStore();
  const { user } = useAuthStore();
  const { 
    fetchTimeSlots, 
    findOverlappingTimeSlots, 
    timeSlots, 
    loading: loadingTimeSlots 
  } = useAvailabilityStore();
  const { createHangout } = useHangoutStore();

  const [profileUser, setProfileUser] = useState<any>(null);
  const [overlappingTimeSlots, setOverlappingTimeSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const isOwnProfile = user?.id === profileUser?.id;
  
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!username) {
          setError('Username is required');
          return;
        }
        
        const userData = await getUserByUsername(username);
        setProfileUser(userData);
        
        if (userData) {
          // Fetch the profile user's time slots
          await fetchTimeSlots(userData.id);
          
          // If viewing someone else's profile, find overlapping time slots
          if (user?.id !== userData.id) {
            const overlapping = await findOverlappingTimeSlots(user?.id || '', userData.id);
            setOverlappingTimeSlots(overlapping);
          }
        }
      } catch (err: any) {
        console.error('Error loading profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [username, getUserByUsername, fetchTimeSlots, findOverlappingTimeSlots, user?.id]);
  
  const handleCreateHangout = async (dayOfWeek: number, startTime: string, endTime: string, participantIds: string[]) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Create a unique set of participants, ensuring the profile user is included
      // but avoiding adding them twice if they're already in participantIds
      const uniqueParticipantIds = new Set([profileUser.id, ...participantIds]);
      
      const hangoutId = await createHangout(
        {
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
        },
        Array.from(uniqueParticipantIds)
      );
      
      if (hangoutId) {
        setSuccess('Hangout request sent successfully!');
      } else {
        setError('Failed to create hangout request');
      }
    } catch (err: any) {
      console.error('Error creating hangout:', err);
      setError(err.message || 'Failed to create hangout request');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading profile...</p>
      </div>
    );
  }
  
  if (error || !profileUser) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error || 'User not found'}
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl">
            {profileUser.full_name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profileUser.full_name}</h1>
            <p className="text-gray-600">@{profileUser.username}</p>
            {profileUser.is_pro && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1 inline-block">
                PRO
              </span>
            )}
          </div>
        </div>
      </div>
      
      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">
          {success}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {isOwnProfile ? 'Your Availability' : `${profileUser.full_name}'s Availability`}
          </h2>
          
          {loadingTimeSlots ? (
            <div className="text-center p-4">Loading availability...</div>
          ) : (
            <TimeSlotList timeSlots={timeSlots} />
          )}
        </div>
        
        {!isOwnProfile && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Matching Free Times</h2>
            
            {overlappingTimeSlots.length > 0 ? (
              <>
                <TimeSlotList 
                  timeSlots={overlappingTimeSlots} 
                  isOverlapping={true} 
                />
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Request a Hangout</h3>
                  <HangoutRequestForm 
                    timeSlots={overlappingTimeSlots}
                    onSubmit={(dayOfWeek, startTime, endTime, participantIds) => 
                      handleCreateHangout(dayOfWeek, startTime, endTime, [profileUser.id, ...participantIds])
                    }
                  />
                </div>
              </>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-yellow-700">
                  No overlapping free times found. Update your availability to find matching times.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;