import React from 'react';
import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react';
import ChatInterface from '../components/ChatInterface';
import { useLocation } from 'react-router-dom';

const ChatPage: React.FC = () => {
  const location = useLocation();
  const aiReport = location.state?.aiReport;

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>
            Chat with a Dermatologist
          </Heading>
          <Text color="gray.600" mb={4}>
            Please describe your symptoms and concerns. You can also share your medical history and upload any relevant documents or previous AI analysis reports.
          </Text>
          {aiReport && (
            <Text color="blue.600" mb={4}>
              Your AI analysis report has been automatically attached to this conversation.
            </Text>
          )}
        </Box>
        
        <ChatInterface aiReport={aiReport} />
      </VStack>
    </Container>
  );
};

export default ChatPage; 