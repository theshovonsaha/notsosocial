import React, { useState, useEffect } from 'react';
import { format, parse } from 'date-fns';
import { useUserStore } from '../stores/userStore';
import { useAuthStore } from '../stores/authStore';
import UserSearch from './UserSearch';

interface TimeSlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface HangoutRequestFormProps {
  timeSlots: TimeSlot[];
  onSubmit: (dayOfWeek: number, startTime: string, endTime: string, participantIds: string[]) => void;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const HangoutRequestForm: React.FC<HangoutRequestFormProps> = ({ timeSlots, onSubmit }) => {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedParticipants, setSelectedParticipants] = useState<{ id: string; name: string }[]>([]);
  const { getUserById } = useUserStore();
  const { user } = useAuthStore();
  
  const handleAddParticipant = async (userId: string) => {
    // Don't add if this is the current user - they'll be added automatically as creator
    if (user?.id === userId) {
      return;
    }
    
    // Check if user is already added
    if (selectedParticipants.some(p => p.id === userId)) {
      return;
    }
    
    const userDetails = await getUserById(userId);
    if (userDetails) {
      setSelectedParticipants([...selectedParticipants, { id: userId, name: userDetails.full_name }]);
    }
  };
  
  const handleRemoveParticipant = (userId: string) => {
    setSelectedParticipants(selectedParticipants.filter(p => p.id !== userId));
  };
  
  const handleSubmit = () => {
    if (!selectedTimeSlot) return;
    
    const [dayOfWeek, startTime, endTime] = selectedTimeSlot.split('|');
    onSubmit(
      parseInt(dayOfWeek),
      startTime,
      endTime,
      selectedParticipants.map(p => p.id)
    );
    
    // Reset form after submission
    setSelectedTimeSlot('');
    setSelectedParticipants([]);
  };
  
  // Format time for display
  const formatTime = (timeString: string) => {
    return format(parse(timeString, 'HH:mm:ss', new Date()), 'h:mm a');
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Select a Time Slot</h3>
        <select
          value={selectedTimeSlot}
          onChange={(e) => setSelectedTimeSlot(e.target.value)}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a time slot</option>
          {timeSlots.map((slot) => (
            <option 
              key={`${slot.day_of_week}-${slot.start_time}-${slot.end_time}`}
              value={`${slot.day_of_week}|${slot.start_time}|${slot.end_time}`}
            >
              {DAYS_OF_WEEK[slot.day_of_week]}: {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-2">Add More Participants (Optional)</h3>
        <UserSearch onSelectUser={handleAddParticipant} />
        
        {selectedParticipants.length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Participants:</h4>
            <ul className="space-y-2">
              {selectedParticipants.map((participant) => (
                <li 
                  key={participant.id}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded"
                >
                  <span>{participant.name}</span>
                  <button
                    onClick={() => handleRemoveParticipant(participant.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <button
        onClick={handleSubmit}
        disabled={!selectedTimeSlot}
        className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Send Hangout Request
      </button>
    </div>
  );
};

export default HangoutRequestForm;