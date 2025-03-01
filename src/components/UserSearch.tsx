import React, { useState, useEffect } from 'react';
import { useUserStore } from '../stores/userStore';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserSearchProps {
  onSelectUser?: (userId: string) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ onSelectUser }) => {
  const [query, setQuery] = useState('');
  const { searchUsers, searchResults, loading } = useUserStore();
  
  useEffect(() => {
    if (query.trim()) {
      const debounce = setTimeout(() => {
        searchUsers(query);
      }, 300);
      
      return () => clearTimeout(debounce);
    }
  }, [query, searchUsers]);
  
  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
      </div>
      
      {query.trim() && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : searchResults.length > 0 ? (
            <ul>
              {searchResults.map((user) => (
                <li key={user.id} className="border-b last:border-b-0">
                  {onSelectUser ? (
                    <button
                      onClick={() => {
                        onSelectUser(user.id);
                        setQuery('');
                      }}
                      className="w-full p-3 text-left hover:bg-gray-50 flex items-center"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                        {user.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </div>
                    </button>
                  ) : (
                    <Link
                      to={`/profile/${user.username}`}
                      className="block p-3 hover:bg-gray-50 flex items-center"
                      onClick={() => setQuery('')}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                        {user.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </div>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500">No users found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearch;