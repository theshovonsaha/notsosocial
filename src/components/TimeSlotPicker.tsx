import React, { useState } from 'react';
import { format, parse } from 'date-fns';

interface TimeSlotPickerProps {
  dayOfWeek: number;
  onSelect: (dayOfWeek: number, startTime: string, endTime: string) => void;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_SLOTS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ dayOfWeek, onSelect }) => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStartTime = e.target.value;
    setStartTime(newStartTime);
    
    // If end time is before start time or not set, update it
    if (!endTime || compareTimeStrings(newStartTime, endTime) >= 0) {
      // Set end time to 1 hour after start time
      const startDate = parse(newStartTime, 'HH:mm', new Date());
      startDate.setHours(startDate.getHours() + 1);
      const newEndTime = format(startDate, 'HH:mm');
      setEndTime(newEndTime);
    }
  };
  
  const handleEndTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEndTime(e.target.value);
  };
  
  const handleAddTimeSlot = () => {
    if (startTime && endTime && compareTimeStrings(startTime, endTime) < 0) {
      onSelect(dayOfWeek, startTime, endTime);
      setStartTime('');
      setEndTime('');
    }
  };
  
  // Helper function to compare time strings
  const compareTimeStrings = (time1: string, time2: string) => {
    const [hours1, minutes1] = time1.split(':').map(Number);
    const [hours2, minutes2] = time2.split(':').map(Number);
    
    if (hours1 !== hours2) {
      return hours1 - hours2;
    }
    return minutes1 - minutes2;
  };
  
  // Filter end time options to only show times after the selected start time
  const filteredEndTimeOptions = TIME_SLOTS.filter(
    time => !startTime || compareTimeStrings(time, startTime) > 0
  );
  
  return (
    <div className="p-4 border rounded-lg bg-white">
      <h3 className="font-medium mb-3">{DAYS_OF_WEEK[dayOfWeek]}</h3>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
          <select
            value={startTime}
            onChange={handleStartTimeChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select start time</option>
            {TIME_SLOTS.map((time) => (
              <option key={`start-${time}`} value={time}>
                {format(parse(time, 'HH:mm', new Date()), 'h:mm a')}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
          <select
            value={endTime}
            onChange={handleEndTimeChange}
            disabled={!startTime}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">Select end time</option>
            {filteredEndTimeOptions.map((time) => (
              <option key={`end-${time}`} value={time}>
                {format(parse(time, 'HH:mm', new Date()), 'h:mm a')}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <button
        onClick={handleAddTimeSlot}
        disabled={!startTime || !endTime || compareTimeStrings(startTime, endTime) >= 0}
        className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Add Time Slot
      </button>
    </div>
  );
};

export default TimeSlotPicker;