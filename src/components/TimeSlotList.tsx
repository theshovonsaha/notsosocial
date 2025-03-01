import React from 'react';
import { format, parse } from 'date-fns';
import { Trash2 } from 'lucide-react';

interface TimeSlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface TimeSlotListProps {
  timeSlots: TimeSlot[];
  onDelete?: (id: string) => void;
  isEditable?: boolean;
  isOverlapping?: boolean;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimeSlotList: React.FC<TimeSlotListProps> = ({ 
  timeSlots, 
  onDelete, 
  isEditable = false,
  isOverlapping = false
}) => {
  // Group time slots by day of week
  const groupedTimeSlots = timeSlots.reduce((acc, slot) => {
    const day = slot.day_of_week;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(slot);
    return acc;
  }, {} as Record<number, TimeSlot[]>);
  
  // Format time for display
  const formatTime = (timeString: string) => {
    return format(parse(timeString, 'HH:mm:ss', new Date()), 'h:mm a');
  };
  
  return (
    <div className="space-y-4">
      {Object.entries(groupedTimeSlots).map(([day, slots]) => (
        <div key={day} className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 p-3 font-medium">
            {DAYS_OF_WEEK[parseInt(day)]}
          </div>
          <ul className="divide-y">
            {slots.map((slot) => (
              <li 
                key={slot.id || `${slot.day_of_week}-${slot.start_time}-${slot.end_time}`} 
                className={`p-3 flex justify-between items-center ${isOverlapping ? 'bg-green-50' : ''}`}
              >
                <span>
                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                  {isOverlapping && (
                    <span className="ml-2 text-sm text-green-600 font-medium">
                      ✓ Matching time
                    </span>
                  )}
                </span>
                
                {isEditable && onDelete && slot.id && (
                  <button 
                    onClick={() => onDelete(slot.id!)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
      
      {timeSlots.length === 0 && (
        <div className="text-center p-4 text-gray-500">
          {isOverlapping 
            ? "No overlapping free times found" 
            : "No available time slots"}
        </div>
      )}
    </div>
  );
};

export default TimeSlotList;