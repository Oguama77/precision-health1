import React, { useState, useRef, useEffect } from 'react';
import { Box, VStack, HStack, Input, Button, Text, Textarea, useToast, IconButton } from '@chakra-ui/react';
import { AttachmentIcon, ArrowUpIcon } from '@chakra-ui/icons';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  aiReport?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ aiReport }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Initial greeting message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: 'Hello! I am your virtual dermatology assistant. Please describe your symptoms or concerns, and feel free to share any relevant medical history. You can also upload any previous reports or images.',
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call OpenAI API
      const response = await fetch('https://precision-skin-insights-api.onrender.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: inputMessage,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachedFiles(prev => [...prev, ...Array.from(files)]);
      
      // If AI report was uploaded, send a message about it
      if (aiReport) {
        const userMessage: Message = {
          role: 'user',
          content: 'I have uploaded my AI analysis report for your review.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box
      w="100%"
      h="600px"
      borderWidth="1px"
      borderRadius="lg"
      p={4}
      bg="white"
      boxShadow="md"
    >
      <VStack h="100%" spacing={4}>
        {/* Chat Messages */}
        <Box
          ref={chatContainerRef}
          flex="1"
          w="100%"
          overflowY="auto"
          p={2}
          borderWidth="1px"
          borderRadius="md"
          bg="gray.50"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              mb={4}
              alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'}
            >
              <Box
                maxW="80%"
                bg={message.role === 'user' ? 'blue.500' : 'gray.200'}
                color={message.role === 'user' ? 'white' : 'black'}
                p={3}
                borderRadius="lg"
              >
                <Text>{message.content}</Text>
                <Text fontSize="xs" color={message.role === 'user' ? 'white' : 'gray.500'} mt={1}>
                  {message.timestamp.toLocaleTimeString()}
                </Text>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Attached Files */}
        {attachedFiles.length > 0 && (
          <Box w="100%">
            <Text fontSize="sm" fontWeight="bold" mb={2}>
              Attached Files:
            </Text>
            {attachedFiles.map((file, index) => (
              <Text key={index} fontSize="sm" color="gray.600">
                {file.name}
              </Text>
            ))}
          </Box>
        )}

        {/* Input Area */}
        <HStack w="100%" spacing={2}>
          <IconButton
            aria-label="Attach file"
            icon={<AttachmentIcon />}
            onClick={() => fileInputRef.current?.click()}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            multiple
          />
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            resize="none"
            rows={2}
          />
          <IconButton
            aria-label="Send message"
            icon={<ArrowUpIcon />}
            onClick={handleSendMessage}
            isLoading={isLoading}
            colorScheme="blue"
          />
        </HStack>
      </VStack>
    </Box>
  );
};

export default ChatInterface; 