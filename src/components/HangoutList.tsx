import React from 'react';
import { Link } from 'react-router-dom';
import { format, parse } from 'date-fns';
import { MessageSquare, Clock, Check, X, Calendar } from 'lucide-react';

interface Hangout {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  status: 'pending' | 'accepted' | 'declined' | 'rescheduled';
  group_chat_id: string | null;
  creator?: {
    username: string;
    full_name: string;
  };
  participants?: {
    id: string;
    user_id: string;
    status: 'pending' | 'accepted' | 'declined' | 'rescheduled';
    user?: {
      username: string;
      full_name: string;
    };
  }[];
}

interface HangoutListProps {
  hangouts: Hangout[];
  onAccept?: (hangoutId: string) => void;
  onDecline?: (hangoutId: string) => void;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const HangoutList: React.FC<HangoutListProps> = ({ hangouts, onAccept, onDecline }) => {
  // Format time for display
  const formatTime = (timeString: string) => {
    return format(parse(timeString, 'HH:mm:ss', new Date()), 'h:mm a');
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Pending</span>;
      case 'accepted':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Accepted</span>;
      case 'declined':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Declined</span>;
      case 'rescheduled':
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Rescheduled</span>;
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-4">
      {hangouts.length > 0 ? (
        hangouts.map((hangout) => (
          <div key={hangout.id} className="border rounded-lg overflow-hidden bg-white">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium">
                    Hangout with {hangout.participants?.map(p => p.user?.full_name).join(', ')}
                  </h3>
                  <div className="flex items-center text-gray-500 text-sm mt-1">
                    <Calendar size={16} className="mr-1" />
                    <span>
                      {DAYS_OF_WEEK[hangout.day_of_week]}, {formatTime(hangout.start_time)} - {formatTime(hangout.end_time)}
                    </span>
                  </div>
                </div>
                {getStatusBadge(hangout.status)}
              </div>
              
              <div className="text-sm">
                <p className="mb-2">Participants:</p>
                <ul className="space-y-1">
                  {hangout.participants?.map((participant) => (
                    <li key={participant.id} className="flex justify-between items-center">
                      <span>{participant.user?.full_name}</span>
                      {getStatusBadge(participant.status)}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-4 flex justify-between">
                {hangout.status === 'accepted' && hangout.group_chat_id ? (
                  <Link 
                    to={`/chat/${hangout.group_chat_id}`}
                    className="flex items-center text-blue-500 hover:text-blue-700"
                  >
                    <MessageSquare size={18} className="mr-1" />
                    <span>Open Chat</span>
                  </Link>
                ) : (
                  <div className="flex items-center text-gray-500">
                    <Clock size={18} className="mr-1" />
                    <span>Waiting for responses</span>
                  </div>
                )}
                
                {hangout.status === 'pending' && onAccept && onDecline && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onAccept(hangout.id)}
                      className="flex items-center text-green-500 hover:text-green-700"
                    >
                      <Check size={18} className="mr-1" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => onDecline(hangout.id)}
                      className="flex items-center text-red-500 hover:text-red-700"
                    >
                      <X size={18} className="mr-1" />
                      <span>Decline</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center p-6 text-gray-500 bg-white rounded-lg border">
          No hangouts found
        </div>
      )}
    </div>
  );
};

export default HangoutList;