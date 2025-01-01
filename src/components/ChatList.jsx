import { useState } from 'react';
import styled from '@emotion/styled';

const Container = styled.div`
  width: 260px;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${props => props.darkMode ? '#333' : '#e0e0e0'};
  background: ${props => props.darkMode ? '#1e1e1e' : '#fff'};
  color: ${props => props.darkMode ? '#fff' : '#000'};
  overflow: hidden;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  padding: 20px;
  flex-shrink: 0;
`;

const Button = styled.button`
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 6px;
  background: #4a9eff;
  color: white;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.2s;

  &:hover {
    background: #3a8eef;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 10px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  -webkit-overflow-scrolling: touch;
`;

const ChatItem = styled.div`
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: ${props => {
    if (props.active) {
      return props.darkMode ? '#3a3a3a' : '#e6f4ff';
    }
    if (props.empty) {
      return props.darkMode ? '#332b00' : '#fff8e0';
    }
    return 'transparent';
  }};
  color: ${props => props.darkMode ? '#fff' : '#000'};

  &:hover {
    background: ${props => props.darkMode ? '#333' : '#f0f0f0'};
  }
`;

const ChatTitle = styled.div`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  opacity: ${props => props.empty ? 0.7 : 1};
`;

const EditableInput = styled.input`
  flex: 1;
  background: ${props => props.darkMode ? '#2a2a2a' : '#fff'};
  color: ${props => props.darkMode ? '#fff' : '#000'};
  border: 1px solid ${props => props.darkMode ? '#444' : '#ddd'};
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #4a9eff;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 4px;
`;

const ActionButton = styled.button`
  padding: 4px;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  color: ${props => props.darkMode ? '#fff' : '#000'};

  &:hover {
    opacity: 1;
    background: ${props => props.darkMode ? '#444' : '#e0e0e0'};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const CollectionItem = styled.div`
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  background: ${props => {
    if (props.empty) {
      return props.darkMode ? '#332b00' : '#fff8e0';
    }
    return props.darkMode ? '#2a2a2a' : '#f5f5f5';
  }};
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: ${props => props.darkMode ? '#fff' : '#000'};
  cursor: move;
  user-select: none;
  position: relative;

  &:hover {
    background: ${props => props.darkMode ? '#333' : '#f0f0f0'};
  }
`;

const CollectionTitle = styled.div`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: ${props => props.empty ? 0.7 : 1};
`;

const CollectionChats = styled.div`
  padding: 4px 0 0 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CollectionWrapper = styled.div`
  position: relative;
  
  &.dragging {
    opacity: 0.5;
  }

  &.drag-over-top {
    border-top: 2px solid #4a9eff;
    margin-top: -2px;
  }

  &.drag-over-bottom {
    border-bottom: 2px solid #4a9eff;
    margin-bottom: -2px;
  }
`;

const ChatList = ({ 
  chats, 
  collections, 
  activeChatId, 
  onNewChat, 
  onNewCollection,
  onSelectChat,
  onDeleteChat,
  onDeleteCollection,
  onUpdateChat,
  onUpdateCollection,
  onMoveChat,
  settings
}) => {
  const [draggedChatId, setDraggedChatId] = useState(null);
  const [draggedCollectionId, setDraggedCollectionId] = useState(null);
  const [dragOverCollectionId, setDragOverCollectionId] = useState(null);
  const [dragOverType, setDragOverType] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingCollectionId, setEditingCollectionId] = useState(null);
  const [editingCollectionName, setEditingCollectionName] = useState('');

  const handleDragStart = (id, type, e) => {
    if (type === 'chat') {
      setDraggedChatId(id);
    } else {
      setDraggedCollectionId(id);
      e.currentTarget.classList.add('dragging');
    }
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragOver = (id, type, e) => {
    e.preventDefault();
    setDragOverCollectionId(id);
    setDragOverType(type);

    if (draggedCollectionId && type === 'collection') {
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const isAbove = e.clientY < midY;
      
      e.currentTarget.classList.remove('drag-over-top', 'drag-over-bottom');
      e.currentTarget.classList.add(isAbove ? 'drag-over-top' : 'drag-over-bottom');
    }
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over-top', 'drag-over-bottom');
  };

  const handleDrop = (targetId, type, e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over-top', 'drag-over-bottom');

    if (draggedChatId && type === 'collection') {
      onMoveChat(draggedChatId, targetId);
    } else if (draggedCollectionId && type === 'collection' && draggedCollectionId !== targetId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const moveAfter = e.clientY > midY;
      
      const sourceIndex = collections.findIndex(c => c.id === draggedCollectionId);
      const targetIndex = collections.findIndex(c => c.id === targetId);
      
      const newCollections = [...collections];
      const [movedCollection] = newCollections.splice(sourceIndex, 1);
      const insertIndex = moveAfter ? targetIndex : targetIndex - (sourceIndex < targetIndex ? 0 : 1);
      newCollections.splice(insertIndex + 1, 0, movedCollection);
      
      // Update all collection orders
      newCollections.forEach((collection, index) => {
        onUpdateCollection(collection.id, { order: index });
      });
    }

    setDraggedChatId(null);
    setDraggedCollectionId(null);
    setDragOverCollectionId(null);
    setDragOverType(null);
  };

  const handleDragEnd = (e) => {
    e.preventDefault();
    if (e.currentTarget.classList.contains('dragging')) {
      e.currentTarget.classList.remove('dragging');
    }
    setDraggedChatId(null);
    setDraggedCollectionId(null);
    setDragOverCollectionId(null);
    setDragOverType(null);
    document.querySelectorAll('.collection-wrapper').forEach(item => {
      item.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  };

  const startEditing = (chat) => {
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const startEditingCollection = (collection) => {
    setEditingCollectionId(collection.id);
    setEditingCollectionName(collection.name);
  };

  const saveEditing = () => {
    if (editingChatId && editingTitle.trim()) {
      onUpdateChat({
        id: editingChatId,
        title: editingTitle.trim()
      });
    }
    setEditingChatId(null);
    setEditingTitle('');
  };

  const saveEditingCollection = () => {
    if (editingCollectionId && editingCollectionName.trim()) {
      onUpdateCollection(editingCollectionId, {
        name: editingCollectionName.trim()
      });
    }
    setEditingCollectionId(null);
    setEditingCollectionName('');
  };

  const handleKeyPress = (e, saveFunction) => {
    if (e.key === 'Enter') {
      saveFunction();
    } else if (e.key === 'Escape') {
      if (editingChatId) {
        setEditingChatId(null);
        setEditingTitle('');
      }
      if (editingCollectionId) {
        setEditingCollectionId(null);
        setEditingCollectionName('');
      }
    }
  };

  const renderChatItem = (chat) => {
    const isEmpty = !chat.messages || chat.messages.length === 0;
    
    return (
      <ChatItem
        key={chat.id}
        active={chat.id === activeChatId}
        empty={isEmpty}
        onClick={() => !editingChatId && onSelectChat(chat.id)}
        draggable={!editingChatId}
        onDragStart={(e) => handleDragStart(chat.id, 'chat', e)}
        onDragEnd={handleDragEnd}
        darkMode={settings.darkMode}
      >
        {editingChatId === chat.id ? (
          <EditableInput
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onKeyDown={(e) => handleKeyPress(e, saveEditing)}
            onBlur={saveEditing}
            autoFocus
            darkMode={settings.darkMode}
          />
        ) : (
          <ChatTitle empty={isEmpty}>{chat.title}</ChatTitle>
        )}
        <ButtonGroup>
          {editingChatId !== chat.id && (
            <ActionButton 
              onClick={(e) => {
                e.stopPropagation();
                startEditing(chat);
              }}
              darkMode={settings.darkMode}
              title="Edit chat name"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
            </ActionButton>
          )}
          <ActionButton 
            onClick={(e) => {
              e.stopPropagation();
              onDeleteChat(chat.id);
            }}
            darkMode={settings.darkMode}
            title="Delete chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </ActionButton>
        </ButtonGroup>
      </ChatItem>
    );
  };

  // Sort collections by order
  const sortedCollections = [...collections].sort((a, b) => {
    return (a.order ?? 0) - (b.order ?? 0);
  });

  // Group chats by collection
  const rootChats = chats.filter(chat => !chat.collectionId);

  return (
    <Container darkMode={settings.darkMode}>
      <ButtonContainer>
        <Button onClick={onNewChat}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Chat
        </Button>
        <Button onClick={onNewCollection}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            <line x1="12" y1="11" x2="12" y2="17"></line>
            <line x1="9" y1="14" x2="15" y2="14"></line>
          </svg>
          Collection
        </Button>
      </ButtonContainer>

      <List>
        {rootChats.map(renderChatItem)}

        {sortedCollections.map(collection => {
          const isEmpty = !collection.chats || collection.chats.length === 0;
          const collectionChats = chats.filter(chat => chat.collectionId === collection.id);
          
          return (
            <CollectionWrapper 
              key={collection.id}
              className="collection-wrapper"
              draggable={!editingCollectionId}
              onDragStart={(e) => handleDragStart(collection.id, 'collection', e)}
              onDragOver={(e) => handleDragOver(collection.id, 'collection', e)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(collection.id, 'collection', e)}
              onDragEnd={handleDragEnd}
            >
              <CollectionItem
                empty={isEmpty}
                darkMode={settings.darkMode}
                style={{
                  background: dragOverCollectionId === collection.id && dragOverType === 'chat'
                    ? (settings.darkMode ? '#3a3a3a' : '#e6f4ff')
                    : undefined
                }}
              >
                {editingCollectionId === collection.id ? (
                  <EditableInput
                    value={editingCollectionName}
                    onChange={(e) => setEditingCollectionName(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, saveEditingCollection)}
                    onBlur={saveEditingCollection}
                    autoFocus
                    darkMode={settings.darkMode}
                  />
                ) : (
                  <CollectionTitle empty={isEmpty}>{collection.name}</CollectionTitle>
                )}
                <ButtonGroup>
                  {editingCollectionId !== collection.id && (
                    <ActionButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingCollection(collection);
                      }}
                      darkMode={settings.darkMode}
                      title="Edit collection name"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                      </svg>
                    </ActionButton>
                  )}
                  <ActionButton 
                    onClick={() => onDeleteCollection(collection.id)}
                    darkMode={settings.darkMode}
                    title="Delete collection"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </ActionButton>
                </ButtonGroup>
              </CollectionItem>

              <CollectionChats>
                {collectionChats.map(renderChatItem)}
              </CollectionChats>
            </CollectionWrapper>
          );
        })}
      </List>
    </Container>
  );
};

export default ChatList;
