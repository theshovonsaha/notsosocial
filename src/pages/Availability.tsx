import React, { useEffect } from 'react';
import { useAvailabilityStore } from '../stores/availabilityStore';
import TimeSlotPicker from '../components/TimeSlotPicker';
import TimeSlotList from '../components/TimeSlotList';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Availability: React.FC = () => {
  const { 
    fetchTimeSlots, 
    addTimeSlot, 
    deleteTimeSlot, 
    timeSlots, 
    loading, 
    error 
  } = useAvailabilityStore();
  
  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);
  
  const handleAddTimeSlot = (dayOfWeek: number, startTime: string, endTime: string) => {
    addTimeSlot({
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
    });
  };
  
  const handleDeleteTimeSlot = (id: string) => {
    deleteTimeSlot(id);
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Manage Your Availability</h1>
        <p className="text-gray-600">
          Set your free time slots to help others find when you're available to hang out.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Add Time Slots</h2>
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day, index) => (
              <TimeSlotPicker
                key={day}
                dayOfWeek={index}
                onSelect={handleAddTimeSlot}
              />
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Time Slots</h2>
          
          {loading ? (
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading your time slots...</p>
            </div>
          ) : (
            <TimeSlotList 
              timeSlots={timeSlots} 
              onDelete={handleDeleteTimeSlot}
              isEditable={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Availability;