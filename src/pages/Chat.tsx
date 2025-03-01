import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import { useUserStore } from '../stores/userStore';
import ChatBox from '../components/ChatBox';
import UserSearch from '../components/UserSearch';
import { ArrowLeft, UserPlus } from 'lucide-react';

const Chat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { 
    fetchChatById, 
    currentChat, 
    messages, 
    sendMessage, 
    toggleKeepChat, 
    addParticipant,
    subscribeToMessages,
    loading, 
    error 
  } = useChatStore();
  const { profile } = useAuthStore();
  const { getUserById } = useUserStore();
  
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchChatById(id);
    }
  }, [id, fetchChatById]);
  
  useEffect(() => {
    if (id) {
      // Subscribe to real-time updates
      const unsubscribe = subscribeToMessages(id);
      
      // Cleanup subscription on unmount
      return () => {
        unsubscribe();
      };
    }
  }, [id, subscribeToMessages]);
  
  const handleSendMessage = (content: string) => {
    if (id) {
      sendMessage(id, content);
    }
  };
  
  const handleToggleKeepChat = (keep: boolean) => {
    if (id) {
      toggleKeepChat(id, keep);
    }
  };
  
  const handleAddParticipant = async (userId: string) => {
    if (id) {
      await addParticipant(id, userId);
      setShowAddParticipant(false);
    }
  };
  
  // Check if current user is a pro user
  const isProUser = profile?.is_pro || false;
  
  // Check if current user is keeping the chat
  const currentParticipant = currentChat?.participants?.find(
    p => p.user_id === profile?.id
  );
  
  const isKeepingChat = currentParticipant?.keep_chat || false;
  
  if (loading && !currentChat) {
    return (
      <div className="p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }
  
  if (error || !currentChat) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error || 'Chat not found'}
        </div>
        <div className="mt-4">
          <Link to="/hangouts" className="text-blue-500 hover:text-blue-700 flex items-center">
            <ArrowLeft size={18} className="mr-1" />
            Back to Hangouts
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <Link to="/hangouts" className="text-blue-500 hover:text-blue-700 flex items-center">
          <ArrowLeft size={18} className="mr-1" />
          Back to Hangouts
        </Link>
        
        <button
          onClick={() => setShowAddParticipant(!showAddParticipant)}
          className="flex items-center text-blue-500 hover:text-blue-700"
        >
          <UserPlus size={18} className="mr-1" />
          <span>Add Participant</span>
        </button>
      </div>
      
      {showAddParticipant && (
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium mb-2">Add a Participant</h3>
          <UserSearch onSelectUser={handleAddParticipant} />
        </div>
      )}
      
      <div className="flex-1 overflow-hidden">
        <ChatBox
          messages={messages}
          onSendMessage={handleSendMessage}
          expiresAt={currentChat.expires_at}
          isPermanent={currentChat.is_permanent}
          canKeep={isProUser}
          isKeeping={isKeepingChat}
          onToggleKeep={handleToggleKeepChat}
        />
      </div>
    </div>
  );
};

export default Chat;