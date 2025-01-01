import { useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { supportsVision } from '../utils/modelUtils';

const InputContainer = styled.div`
  display: flex;
  gap: 10px;
  padding: 10px;
  background: ${props => props.darkMode ? '#2a2a2a' : '#f5f5f5'};
  border-radius: 8px;
`;

const TextArea = styled.textarea`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  background: ${props => props.darkMode ? '#3a3a3a' : '#fff'};
  color: ${props => props.darkMode ? '#fff' : '#000'};
  font-size: 16px;
  resize: none;
  min-height: 24px;
  max-height: 150px;
  outline: none;
  
  &::placeholder {
    color: ${props => props.darkMode ? '#888' : '#999'};
  }

  &:disabled {
    background: ${props => props.darkMode ? '#2a2a2a' : '#f0f0f0'};
    cursor: not-allowed;
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const SendButton = styled(Button)`
  background: #4a9eff;
  color: white;

  &:hover {
    background: ${props => props.disabled ? '#666' : '#3a8eef'};
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background: #ff4a4a;
  color: white;

  &:hover {
    background: #ef3a3a;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const ImagePreviewContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

const ImagePreview = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 4px;
  overflow: hidden;
  background: ${props => props.darkMode ? '#3a3a3a' : '#f0f0f0'};
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  padding: 0;
  line-height: 1;

  &:hover {
    background: rgba(0, 0, 0, 0.7);
  }
`;

const UploadButton = styled(Button)`
  background: ${props => props.darkMode ? '#3a3a3a' : '#e0e0e0'};
  color: ${props => props.darkMode ? '#fff' : '#000'};
  padding: 12px;
  min-width: auto;

  &:hover {
    background: ${props => props.darkMode ? '#444' : '#d0d0d0'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const MessageInput = ({ onSendMessage, onCancel, isStreaming, settings, selectedModel }) => {
  const [message, setMessage] = useState('');
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);
  const hasVisionSupport = supportsVision(selectedModel);

  // Debug logging
  useEffect(() => {
    console.log('Selected Model:', selectedModel);
    console.log('Has Vision Support:', hasVisionSupport);
  }, [selectedModel, hasVisionSupport]);

  const handleSubmit = async () => {
    if ((!message.trim() && images.length === 0) || isStreaming) return;
    
    const content = {
      text: message.trim(),
      images: images
    };
    
    await onSendMessage(content);
    setMessage('');
    setImages([]);
  };

  const handleKeyPress = (e) => {
    if (settings.sendOnEnter && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePaste = async (e) => {
    if (!hasVisionSupport) return;

    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    for (const item of imageItems) {
      const file = item.getAsFile();
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImages(prev => [...prev, e.target.result]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleFileSelect = (e) => {
    if (!hasVisionSupport) return;

    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImages(prev => [...prev, e.target.result]);
        };
        reader.readAsDataURL(file);
      }
    });
    // Reset input value so the same file can be selected again
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <InputContainer darkMode={settings.darkMode}>
        <TextArea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onPaste={handlePaste}
          placeholder={isStreaming ? 
            "Waiting for response..." : 
            hasVisionSupport ? 
              "Type a message... (Paste images with Ctrl+V)" :
              "Type a message..."
          }
          disabled={isStreaming}
          darkMode={settings.darkMode}
        />
        <ButtonGroup>
          {hasVisionSupport && (
            <>
              <UploadButton
                onClick={() => fileInputRef.current?.click()}
                title="Upload image"
                darkMode={settings.darkMode}
                disabled={isStreaming}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </UploadButton>
              <HiddenInput
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
              />
            </>
          )}
          {isStreaming ? (
            <CancelButton onClick={onCancel}>
              Cancel
            </CancelButton>
          ) : (
            <SendButton onClick={handleSubmit} disabled={!message.trim() && images.length === 0}>
              Send
            </SendButton>
          )}
        </ButtonGroup>
      </InputContainer>
      {hasVisionSupport && images.length > 0 && (
        <ImagePreviewContainer>
          {images.map((image, index) => (
            <ImagePreview key={index} darkMode={settings.darkMode}>
              <PreviewImage src={image} alt={`Preview ${index + 1}`} />
              <RemoveImageButton onClick={() => removeImage(index)}>
                ×
              </RemoveImageButton>
            </ImagePreview>
          ))}
        </ImagePreviewContainer>
      )}
    </div>
  );
};

export default MessageInput;
