import React from 'react';
import { useLocation } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';

const ChatPage: React.FC = () => {
  const location = useLocation();
  const aiReport = location.state?.aiReport;

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">
            Chat with a Dermatologist
          </h1>
          <p className="text-muted-foreground mb-4">
            Please describe your symptoms and concerns. You can also share your medical history and upload any relevant documents or previous AI analysis reports.
          </p>
          {aiReport && (
            <p className="text-blue-600 mb-4">
              Your AI analysis report has been automatically attached to this conversation.
            </p>
          )}
        </div>
        
        <ChatInterface aiReport={aiReport} />
      </div>
    </div>
  );
};

export default ChatPage; 