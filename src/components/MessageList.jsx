import { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';

const MessageListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: ${props => props.darkMode ? '#2a2a2a' : '#f5f5f5'};
  border-radius: 8px;
  margin: 10px 0;
  position: relative;
  scroll-behavior: smooth;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  
  /* Safari-specific fixes */
  @supports (-webkit-touch-callout: none) {
    height: 100%;
    max-height: -webkit-fill-available;
  }
`;

const MessagesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: auto;
  min-height: min-content;
  width: 100%;
`;

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-self: ${props => props.role === 'user' ? 'flex-end' : 'flex-start'};
  max-width: 80%;
  width: fit-content;
`;

const Message = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  background: ${props => {
    if (props.cancelled) return props.darkMode ? '#3a2a2a' : '#ffe5e5';
    switch (props.role) {
      case 'user':
        return props.userMessageColor;
      case 'assistant':
        return props.assistantMessageColor;
      case 'error':
        return '#ff4a4a';
      default:
        return props.darkMode ? '#3a3a3a' : '#e0e0e0';
    }
  }};
  color: ${props => {
    if (props.cancelled) return props.darkMode ? '#ff8080' : '#cc0000';
    if (props.role === 'error') return '#fff';
    const bgColor = props.role === 'user' ? props.userMessageColor : props.assistantMessageColor;
    // Calculate relative luminance
    const r = parseInt(bgColor.slice(1, 3), 16) / 255;
    const g = parseInt(bgColor.slice(3, 5), 16) / 255;
    const b = parseInt(bgColor.slice(5, 7), 16) / 255;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.5 ? '#000' : '#fff';
  }};
  white-space: pre-wrap;
  word-break: break-word;
  width: 100%;
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  margin-top: ${props => props.hasText ? '8px' : '0'};
  width: 100%;
`;

const MessageImage = styled.img`
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
  background: ${props => props.darkMode ? '#1e1e1e' : '#fff'};

  &:hover {
    transform: scale(1.02);
  }
`;

const ImageModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  cursor: pointer;
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
`;

const ModalImage = styled.img`
  max-width: 90%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  background: ${props => props.darkMode ? '#1e1e1e' : '#fff'};
`;

const CancelNotice = styled.div`
  font-size: 12px;
  color: ${props => props.darkMode ? '#ff8080' : '#cc0000'};
  font-style: italic;
  margin-top: 4px;
  padding: 0 16px;
`;

const Timestamp = styled.div`
  font-size: 12px;
  color: ${props => props.darkMode ? '#888' : '#666'};
  align-self: ${props => props.role === 'user' ? 'flex-end' : 'flex-start'};
`;

const EmptyState = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  color: ${props => props.darkMode ? '#666' : '#999'};
  font-size: 16px;
  min-height: 200px;
  user-select: none;
`;

const MessageList = ({ messages, settings }) => {
  const containerRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (containerRef.current) {
      const scrollOptions = {
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      };
      
      // Use requestAnimationFrame to ensure scroll happens after render
      requestAnimationFrame(() => {
        containerRef.current.scrollTo(scrollOptions);
      });
    }
  }, [messages]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to handle legacy message format
  const getMessageContent = (message) => {
    if (typeof message.content === 'string') {
      return { text: message.content, images: [] };
    }
    return message.content;
  };

  return (
    <MessageListContainer ref={containerRef} darkMode={settings.darkMode}>
      {messages.length > 0 ? (
        <MessagesWrapper>
          {messages.map((message, index) => {
            const content = getMessageContent(message);
            return (
              <MessageContainer key={message.id || index} role={message.role}>
                <Message 
                  role={message.role}
                  darkMode={settings.darkMode}
                  userMessageColor={settings.userMessageColor}
                  assistantMessageColor={settings.assistantMessageColor}
                  cancelled={message.cancelled}
                >
                  {content.text}
                  {content.images && content.images.length > 0 && (
                    <ImageGrid hasText={content.text.trim().length > 0}>
                      {content.images.map((image, imgIndex) => (
                        <MessageImage
                          key={imgIndex}
                          src={image}
                          alt={`Image ${imgIndex + 1}`}
                          onClick={() => setSelectedImage(image)}
                          darkMode={settings.darkMode}
                        />
                      ))}
                    </ImageGrid>
                  )}
                </Message>
                {message.cancelled && (
                  <CancelNotice darkMode={settings.darkMode}>
                    Response cancelled
                  </CancelNotice>
                )}
                {settings.showTimestamps && (
                  <Timestamp 
                    role={message.role}
                    darkMode={settings.darkMode}
                  >
                    {formatTimestamp(message.id)}
                  </Timestamp>
                )}
              </MessageContainer>
            );
          })}
        </MessagesWrapper>
      ) : (
        <EmptyState darkMode={settings.darkMode}>
          Start a conversation...
        </EmptyState>
      )}

      {selectedImage && (
        <ImageModal onClick={() => setSelectedImage(null)}>
          <ModalImage 
            src={selectedImage} 
            alt="Full size" 
            onClick={e => e.stopPropagation()} 
            darkMode={settings.darkMode}
          />
        </ImageModal>
      )}
    </MessageListContainer>
  );
};

export default MessageList;
