import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import ChatContainer from './components/ChatContainer';
import ChatList from './components/ChatList';

const AppContainer = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  -webkit-overflow-scrolling: touch;
`;

const App = () => {
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('chats');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [collections, setCollections] = useState(() => {
    const saved = localStorage.getItem('collections');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeChatId, setActiveChatId] = useState(() => {
    const saved = localStorage.getItem('activeChatId');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [selectedModel, setSelectedModel] = useState(() => {
    const saved = localStorage.getItem('selectedModel');
    return saved || 'opencoder:latest';
  });
  
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('settings');
    return saved ? JSON.parse(saved) : {
      darkMode: true,
      sendOnEnter: true,
      showTimestamps: true,
      userMessageColor: '#4a9eff',
      assistantMessageColor: '#3a3a3a'
    };
  });

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('collections', JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    if (activeChatId !== null) {
      localStorage.setItem('activeChatId', JSON.stringify(activeChatId));
    }
  }, [activeChatId]);

  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem('selectedModel', selectedModel);
      // Update the model for the active chat
      if (activeChatId) {
        setChats(prevChats => prevChats.map(chat => 
          chat.id === activeChatId 
            ? { ...chat, model: selectedModel }
            : chat
        ));
      }
    }
  }, [selectedModel, activeChatId]);

  const handleUpdateChat = (update) => {
    if (update.model) {
      setSelectedModel(update.model);
      return;
    }

    if (update.messages !== undefined) {
      setChats(prevChats => prevChats.map(chat => 
        chat.id === activeChatId 
          ? { ...chat, messages: update.messages }
          : chat
      ));
      return;
    }

    setChats(prevChats => {
      const currentChat = prevChats.find(chat => chat.id === update.id);
      if (currentChat) {
        return prevChats.map(chat => 
          chat.id === update.id 
            ? { ...chat, ...update }
            : chat
        );
      }
      return prevChats;
    });
  };

  const handleNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: 'New Chat',
      messages: [],
      model: selectedModel
    };
    setChats(prevChats => [...prevChats, newChat]);
    setActiveChatId(newChat.id);
  };

  const handleNewCollection = () => {
    const newCollection = {
      id: Date.now(),
      name: 'New Collection',
      order: collections.length
    };
    setCollections(prevCollections => [...prevCollections, newCollection]);
  };

  const handleDeleteChat = (chatId) => {
    setChats(prevChats => {
      const remainingChats = prevChats.filter(chat => chat.id !== chatId);
      if (activeChatId === chatId) {
        setActiveChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
      }
      return remainingChats;
    });
  };

  const handleDeleteCollection = (collectionId) => {
    // Move all chats from this collection to root level
    setChats(prevChats => prevChats.map(chat => 
      chat.collectionId === collectionId 
        ? { ...chat, collectionId: null }
        : chat
    ));
    setCollections(prevCollections => 
      prevCollections.filter(collection => collection.id !== collectionId)
    );
  };

  const handleUpdateCollection = (collectionId, update) => {
    setCollections(prevCollections => prevCollections.map(collection =>
      collection.id === collectionId
        ? { ...collection, ...update }
        : collection
    ));
  };

  const handleMoveChat = (chatId, collectionId) => {
    setChats(prevChats => prevChats.map(chat =>
      chat.id === chatId
        ? { ...chat, collectionId }
        : chat
    ));
  };

  const activeChat = chats.find(chat => chat.id === activeChatId);

  return (
    <AppContainer>
      <ChatList
        chats={chats}
        collections={collections}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onNewCollection={handleNewCollection}
        onSelectChat={setActiveChatId}
        onDeleteChat={handleDeleteChat}
        onDeleteCollection={handleDeleteCollection}
        onUpdateChat={handleUpdateChat}
        onUpdateCollection={handleUpdateCollection}
        onMoveChat={handleMoveChat}
        settings={settings}
      />
      <ChatContainer
        messages={activeChat?.messages || []}
        selectedModel={activeChat?.model || selectedModel}
        onUpdateChat={handleUpdateChat}
        settings={settings}
        onUpdateSettings={setSettings}
      />
    </AppContainer>
  );
};

export default App;
