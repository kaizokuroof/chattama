import { useState, useRef } from 'react';
import styled from '@emotion/styled';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ModelSelector from './ModelSelector';
import Settings from './Settings';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  flex: 1;
  padding: 20px;
  background: ${props => props.darkMode ? '#1e1e1e' : '#fff'};
  color: ${props => props.darkMode ? '#fff' : '#000'};
  overflow: hidden;
  position: relative;
  -webkit-overflow-scrolling: touch;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
`;

const HeaderControls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
`;

const ClearButton = styled.button`
  padding: 8px 16px;
  background: #ff4a4a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;

  &:hover {
    background: #ef3a3a;
  }
`;

const ConfirmDialog = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  background: ${props => props.darkMode ? '#2a2a2a' : '#f0f0f0'};
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 10;
  color: ${props => props.darkMode ? '#fff' : '#000'};
`;

const ConfirmText = styled.div`
  margin-bottom: 8px;
`;

const ConfirmButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;

  &:hover {
    filter: brightness(90%);
  }
`;

const CancelButton = styled(Button)`
  background: ${props => props.darkMode ? '#4a4a4a' : '#ddd'};
  color: ${props => props.darkMode ? '#fff' : '#000'};
`;

const ConfirmClearButton = styled(Button)`
  background: #ff4a4a;
  color: white;
`;

const InputWrapper = styled.div`
  margin-top: auto;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
`;

const ChatContainer = ({ messages, selectedModel, onUpdateChat, settings, onUpdateSettings }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const abortControllerRef = useRef(null);
  const accumulatedContentRef = useRef('');

  const handleModelSelect = (model) => {
    onUpdateChat({ model });
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleClearChat = () => {
    onUpdateChat({ messages: [] });
    setShowClearConfirm(false);
  };

  const handleSendMessage = async (content) => {
    // Add user message
    const userMessage = { 
      role: 'user', 
      content,
      id: Date.now() 
    };
    onUpdateChat({ 
      messages: [...messages, userMessage]
    });

    try {
      // Add an initial empty assistant message
      const assistantMessageId = Date.now() + 1;
      onUpdateChat({
        messages: [...messages, userMessage, { 
          role: 'assistant', 
          content: { text: '', images: [] },
          id: assistantMessageId 
        }]
      });
      setIsStreaming(true);
      accumulatedContentRef.current = '';

      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(() => abortControllerRef.current.abort(), 30000);

      try {
        // Convert images to base64 if they're not already
        const images = content.images.map(img => {
          if (img.startsWith('data:image')) {
            return img.split(',')[1]; // Remove data URL prefix
          }
          return img;
        });

        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel,
            prompt: content.text,
            images: images,
            stream: true,
            context: []
          }),
          signal: abortControllerRef.current.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(Boolean);

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.error) {
                throw new Error(data.error);
              }
              
              if (data.response) {
                accumulatedContentRef.current += data.response;
                // Update the message content as we receive it
                onUpdateChat({
                  messages: messages.concat([
                    userMessage,
                    { 
                      role: 'assistant', 
                      content: { 
                        text: accumulatedContentRef.current,
                        images: []
                      },
                      id: assistantMessageId 
                    }
                  ])
                });
              }
            } catch (parseError) {
              console.error('Error parsing line:', parseError);
              continue;
            }
          }
        }

        clearTimeout(timeoutId);
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          onUpdateChat({
            messages: messages.concat([
              userMessage,
              { 
                role: 'assistant', 
                content: { 
                  text: accumulatedContentRef.current,
                  images: []
                },
                cancelled: true,
                id: assistantMessageId 
              }
            ])
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.name !== 'AbortError') {
        onUpdateChat({
          messages: messages.concat([
            userMessage,
            { 
              role: 'error', 
              content: { 
                text: 'Failed to get response from Ollama',
                images: []
              },
              id: Date.now() 
            }
          ])
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      accumulatedContentRef.current = '';
    }
  };

  return (
    <Container darkMode={settings.darkMode}>
      <Header>
        <ModelSelector
          selectedModel={selectedModel}
          onSelectModel={handleModelSelect}
          darkMode={settings.darkMode}
        />
        <HeaderControls>
          {messages.length > 0 && (
            <ClearButton onClick={() => setShowClearConfirm(true)}>
              Clear Chat
            </ClearButton>
          )}
          <Settings settings={settings} onUpdateSettings={onUpdateSettings} />
        </HeaderControls>
      </Header>

      <Content>
        {showClearConfirm && (
          <ConfirmDialog darkMode={settings.darkMode}>
            <ConfirmText>Are you sure you want to clear this chat?</ConfirmText>
            <ConfirmButtons>
              <CancelButton 
                onClick={() => setShowClearConfirm(false)}
                darkMode={settings.darkMode}
              >
                Cancel
              </CancelButton>
              <ConfirmClearButton onClick={handleClearChat}>
                Clear
              </ConfirmClearButton>
            </ConfirmButtons>
          </ConfirmDialog>
        )}

        <MessageList 
          messages={messages} 
          settings={settings}
        />
        
        <InputWrapper>
          <MessageInput 
            onSendMessage={handleSendMessage} 
            onCancel={handleCancel}
            isStreaming={isStreaming}
            settings={settings}
            selectedModel={selectedModel}
          />
        </InputWrapper>
      </Content>
    </Container>
  );
};

export default ChatContainer;
