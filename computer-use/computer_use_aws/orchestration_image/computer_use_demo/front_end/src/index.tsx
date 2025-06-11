import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://0.0.0.0:3002';

type MessageContent = {
  type: string;
  text?: string;
  source?: {
    type?: string;
    id?: string;
    data?: string;
    media_type?: string;
  };
  content?: Array<MessageContent>;
  tool_use_id?: string;
  id?: string;
  name?: string;
  input?: any;
  is_error?: boolean;
};

type Message = {
  role: 'user' | 'assistant';
  content: MessageContent[];
};

type Tab = {
  id: string;
  name: string;
  messages: Message[];
  status?: string; // Added status field
  public_ip?: string; // Added public_ip field
  settings: {
    fontSize: 'small' | 'medium' | 'large';
    systemPromptSuffix?: string;
  };
};

const generateId = () => Math.random().toString(36).substring(2, 15);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

export default function Home() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [isAddTabModalOpen, setIsAddTabModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tabToDelete, setTabToDelete] = useState<string | null>(null);
  const [newTabName, setNewTabName] = useState('');
  const [newTabIframeSrc, setNewTabIframeSrc] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('us.anthropic.claude-3-5-sonnet-20241022-v2:0');
  const [provider, setProvider] = useState('bedrock');
  const [systemPromptSuffix, setSystemPromptSuffix] = useState('');
  
  // Replace single isStreaming state with a Set of streaming tab IDs
  const [streamingTabs, setStreamingTabs] = useState<Set<string>>(new Set());
  
  // Ref for auto-scrolling the chat
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add new state for tracking loading tabs
  const [loadingTabs, setLoadingTabs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEnvironments();
  }, []);

  // Add a new effect to refetch messages when the active tab changes
  useEffect(() => {
    if (activeTabId) {
      fetchMessages(activeTabId);
    }
  }, [activeTabId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tabs, activeTabId]);

  const fetchEnvironments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/environments`);
      const data = await response.json();
      const envs = data.environments.map((env: any) => ({
        id: env.environment_id,
        name: `Chat ${env.environment_id.slice(0, 6)}`,
        messages: [],
        status: env.status, // Store the environment status
        settings: {
          fontSize: 'medium',
          systemPromptSuffix: '',
        }
      }));
      setTabs(envs);
      if (envs.length > 0) {
        setActiveTabId(envs[0].id);
        envs.forEach((env: Tab) => {
          fetchMessages(env.id);
          // Fetch status for each environment to get the public_ip
          fetchEnvironmentStatus(env.id);
          // If environment is not in running state, add it to loading tabs
          if (env.status !== 'running') {
            setLoadingTabs(prev => new Set(prev).add(env.id));
            // Start polling for status
            pollEnvironmentStatus(env.id);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching environments:', error);
    }
  };
  
  // Add a function to fetch environment status including public_ip
  const fetchEnvironmentStatus = async (envId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/environments/${envId}/status`);
      const data = await response.json();
      
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === envId ? { 
            ...tab, 
            status: data.status,
            public_ip: data.public_ip 
          } : tab
        )
      );
      
      // Also fetch config to get system_prompt_suffix
      fetchEnvironmentConfig(envId);
    } catch (error) {
      console.error('Error fetching environment status:', error);
    }
  };
  
  const fetchEnvironmentConfig = async (envId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/environments/${envId}/config`);
      const data = await response.json();
      
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === envId ? { 
            ...tab, 
            settings: {
              ...tab.settings,
              systemPromptSuffix: data.system_prompt_suffix || '',
            }
          } : tab
        )
      );
    } catch (error) {
      console.error('Error fetching environment config:', error);
    }
  };

  const fetchMessages = async (envId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/environments/${envId}/messages`);
      const messages = await response.json();
      
      console.log(`[fetchMessages] Fetched messages for env ${envId}:`, messages);
      
      // Make sure we're not losing any messages during refresh
      setTabs(prevTabs => {
        const currentTab = prevTabs.find(tab => tab.id === envId);
        const currentMessages = currentTab?.messages || [];
        const newMessages = messages || [];
        
        console.log(`[fetchMessages] Current messages count: ${currentMessages.length}, New messages count: ${newMessages.length}`);
        
        // Only process if we have more messages than before
        if (newMessages.length < currentMessages.length) {
          console.log(`[fetchMessages] Keeping existing messages as they contain more items`);
          return prevTabs;
        }
        
        // Process messages similar to handleSendMessage
        const processedMessages: Message[] = [];
        
        // Track already seen content to avoid duplicates
        const seenTextContents = new Set<string>();
        const seenToolUses = new Set<string>();
        const seenToolResults = new Set<string>();
        
        for (const message of newMessages) {
          // Ensure role is properly set for each message
          const processedMessage: Message = {
            role: message.role,
            content: []
          };
          
          console.log(`[fetchMessages] Processing message with role: ${message.role}`);
          
          if (message.content && Array.isArray(message.content)) {
            for (const item of message.content) {
              // Ensure all items inherit the correct role from their parent message
              if (item.type === 'text') {
                if (!seenTextContents.has(item.text || '')) {
                  seenTextContents.add(item.text || '');
                  processedMessage.content.push(item);
                  console.log(`[fetchMessages] Added text content: ${item.text?.substring(0, 50)}...`);
                }
              } else if (item.type === 'tool_use') {
                if (item.id && !seenToolUses.has(item.id)) {
                  seenToolUses.add(item.id);
                  processedMessage.content.push(item);
                  console.log(`[fetchMessages] Added tool use with id: ${item.id}`);
                }
              } else if (item.type === 'image' && item.source) {
                // Handle direct image content - maintaining parent message's role
                console.log(`[fetchMessages] Added image from message with role: ${message.role}`);
                processedMessage.content.push(item);
              } else if (item.type === 'tool_result' && item.tool_use_id) {
                if (!seenToolResults.has(item.tool_use_id)) {
                  seenToolResults.add(item.tool_use_id);
                  processedMessage.content.push(item);
                  console.log(`[fetchMessages] Added tool result for tool use id: ${item.tool_use_id}`);
                }
              }
            }
          }
          
          // Only add the message if it has content
          if (processedMessage.content.length > 0) {
            processedMessages.push(processedMessage);
          }
        }
        
        console.log(`[fetchMessages] Final processed messages:`, processedMessages);
        
        return prevTabs.map(tab => 
          tab.id === envId ? { ...tab, messages: processedMessages } : tab
        );
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  
  // Function to poll environment status until it's running
  const pollEnvironmentStatus = async (envId: string) => {
    const pollInterval = 3000; // Poll every 3 seconds
    const maxAttempts = 60; // Maximum polling attempts (3 minutes)
    let attempts = 0;
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/environments/${envId}/status`);
        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`);
        }
        
        const data = await response.json();
        const status = data.status;
        
        // Update the tab with the latest status and public_ip
        setTabs(prevTabs => 
          prevTabs.map(tab => 
            tab.id === envId ? { 
              ...tab, 
              status,
              public_ip: data.public_ip 
            } : tab
          )
        );
        
        if (status === 'running') {
          // Environment is ready, remove from loading tabs
          setLoadingTabs(prev => {
            const next = new Set(prev);
            next.delete(envId);
            return next;
          });
          return true; // Done polling
        } else if (status === 'failed' || status === 'deleted' || status === 'deleting') {
          // Terminal states - stop polling
          return true;
        }
        
        return false; // Continue polling
      } catch (error) {
        console.error(`Error checking environment status for ${envId}:`, error);
        return attempts >= maxAttempts; // Stop polling on max attempts
      }
    };
    
    // Start polling
    while (attempts < maxAttempts) {
      attempts++;
      const done = await checkStatus();
      if (done) break;
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    // If we exit due to max attempts, show error state
    if (attempts >= maxAttempts) {
      setTabs(prevTabs =>
        prevTabs.map(tab =>
          tab.id === envId ? { ...tab, status: 'timeout' } : tab
        )
      );
    }
  };

  const handleSendMessage = async (text: string) => {
    // Check if environment is in running state
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (activeTab?.status !== 'running') {
      console.error('Cannot send message: environment is not in running state');
      return;
    }
    
    console.log(`[handleSendMessage] Sending message for env ${activeTabId}: ${text}`);
    
    // Update streaming state for just this tab
    setStreamingTabs(prev => new Set(prev).add(activeTabId));
    
    // First add the user message to UI immediately for better UX
    const userMessage: Message = {
      role: 'user',
      content: [{ type: 'text', text }]
    };
    
    // Add only the user message initially
    console.log(`[handleSendMessage] Adding user message to UI`);
    setTabs(prevTabs => {
      const updatedTabs = prevTabs.map(tab => 
        tab.id === activeTabId ? 
        { ...tab, messages: [...tab.messages, userMessage] } : 
        tab
      );
      console.log(`[handleSendMessage] Updated tabs after adding user message:`, 
        updatedTabs.find(tab => tab.id === activeTabId)?.messages);
      return updatedTabs;
    });
    
    try {
      console.log(`[handleSendMessage] Fetching from API: ${API_BASE_URL}/api/v1/environments/${activeTabId}/messages`);
      const response = await fetch(`${API_BASE_URL}/api/v1/environments/${activeTabId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body reader could not be created");
      }
  
      const decoder = new TextDecoder();
      let buffer = '';
      
      // Track already seen content to avoid duplicates
      const seenTextContents = new Set<string>();
      const seenToolUses = new Set<string>();
      const seenToolResults = new Set<string>();
      
      // The assistant message we'll build up
      let assistantMessage: Message = {
        role: 'assistant',
        content: []
      };
      
      console.log(`[handleSendMessage] Starting to read stream`);
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log(`[handleSendMessage] Stream complete`);
          break;
        }
  
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep incomplete chunk in buffer
        
        for (const line of lines) {
          if (line.trim() === '' || !line.startsWith('data: ')) continue;
          
          try {
            let data = JSON.parse(line.slice(6));
            console.log(`[handleSendMessage] Received data (raw):`, data);
            
            // Check if data is a string (and potentially another JSON string)
            if (typeof data === 'string') {
              try {
                // Try to parse it again
                data = JSON.parse(data);
                console.log(`[handleSendMessage] Parsed string data into JSON:`, data);
              } catch (innerError) {
                console.warn(`[handleSendMessage] Received data is a string but not valid JSON:`, data);
                // Continue with the string as is or handle this case differently
              }
            }
            
            if (data.error) {
              console.error('[handleSendMessage] Error:', data.error);
              continue;
            }
            
            for (const item of data.content) {
              if (item.type === 'text') {
                if (!seenTextContents.has(item.text || '')) {
                  seenTextContents.add(item.text || '');
                  assistantMessage.content.push(item);
                  console.log(`[handleSendMessage] Added text content: ${item.text?.substring(0, 50)}...`);
                }
              } else if (item.type === 'tool_use') {
                if (item.id && !seenToolUses.has(item.id)) {
                  seenToolUses.add(item.id);
                  assistantMessage.content.push(item);
                  console.log(`[handleSendMessage] Added tool use with id: ${item.id}`);
                }
              } else if (item.type === 'image' && item.source) {
                // Handle direct image content from assistant
                console.log(`[handleSendMessage] Added image from assistant`);
                assistantMessage.content.push(item);
              } else if (item.type === 'tool_result' && item.tool_use_id) {
                if (!seenToolResults.has(item.tool_use_id)) {
                  seenToolResults.add(item.tool_use_id);
                  assistantMessage.content.push(item);
                  console.log(`[handleSendMessage] Added tool result for tool use id: ${item.tool_use_id}`);
                }
              }
            }
            
            // Update the UI with our assistant message
            setTabs(prevTabs => {
              const updatedTabs = prevTabs.map(tab => {
                if (tab.id !== activeTabId) return tab;
                
                const messages = [...tab.messages];
                const lastMessage = messages[messages.length - 1];
                
                // If the last message is from the assistant, update it
                // Otherwise, add a new assistant message
                if (lastMessage.role === 'assistant') {
                  messages[messages.length - 1] = {
                    ...lastMessage,
                    content: [...assistantMessage.content]
                  };
                  console.log(`[handleSendMessage] Updated existing assistant message, now has ${assistantMessage.content.length} content items`);
                } else {
                  messages.push({
                    role: 'assistant',
                    content: [...assistantMessage.content]
                  });
                  console.log(`[handleSendMessage] Added new assistant message with ${assistantMessage.content.length} content items`);
                }
                
                return {
                  ...tab,
                  messages
                };
              });
              
              return updatedTabs;
            });
          } catch (e) {
            console.error('[handleSendMessage] Error parsing SSE data:', e, line);
          }
        }
      }
    } catch (error) {
      console.error('[handleSendMessage] Error sending message:', error);
    } finally {
      // Remove this tab from streaming state
      setStreamingTabs(prev => {
        const next = new Set(prev);
        next.delete(activeTabId);
        return next;
      });
      
      console.log(`[handleSendMessage] Stream ended, will fetch messages after delay`);
      
      // Add a short delay before fetching messages to ensure the database has time to save
      // This helps avoid race conditions where we fetch before the database transaction completes
      setTimeout(() => {
        console.log(`[handleSendMessage] Delayed fetch starting now for env ${activeTabId}`);
        fetchMessages(activeTabId);
      }, 1000); // 1 second delay
    }
  };

  const handleAddTab = () => {
    setIsAddTabModalOpen(true);
  };

  const confirmAddTab = async () => {
    setIsAddTabModalOpen(false); // Close dialog immediately
    const tempId = generateId(); // Generate temporary ID
    const tempTab: Tab = {
      id: tempId,
      name: newTabName || `Creating new environment...`,
      messages: [],
      status: 'creating', // Initial status
      settings: {
        fontSize: 'medium',
        systemPromptSuffix: '',
      },
    };
    
    setTabs(prev => [...prev, tempTab]);
    setLoadingTabs(prev => new Set(prev).add(tempId));
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/environments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          api_key: apiKey,
          model,
          system_prompt_suffix: systemPromptSuffix,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Replace temporary tab with real one
        const envId = data.environment_id;
        setTabs(prev => prev.map(tab => 
          tab.id === tempId ? {
            ...tab,
            id: envId,
            name: newTabName || `Chat ${envId.slice(0, 6)}`,
            status: data.status || 'creating',
          } : tab
        ));
        setActiveTabId(envId);
        
        // Start polling for status updates
        pollEnvironmentStatus(envId);
      } else {
        // Remove temporary tab on error
        setTabs(prev => prev.filter(tab => tab.id !== tempId));
        console.error('Error creating environment:', data.error);
        // Show error to user (you might want to add a toast notification system)
      }
    } catch (error) {
      // Remove temporary tab on error
      setTabs(prev => prev.filter(tab => tab.id !== tempId));
      console.error('Error creating environment:', error);
    } finally {
      // Note: We don't remove the tab from loadingTabs here as we need to wait for the environment to be ready
      // Instead, the polling function will remove it from loadingTabs when status changes to 'running'
      setNewTabName('');
      setApiKey('');
    }
  };

  const handleDeleteTab = (tabId: string) => {
    setTabToDelete(tabId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteTab = async () => {
    if (tabToDelete) {
      try {
        await fetch(`${API_BASE_URL}/api/v1/environments/${tabToDelete}`, {
          method: 'DELETE',
        });
        setTabs(tabs.filter((tab) => tab.id !== tabToDelete));
        if (activeTabId === tabToDelete) {
          setActiveTabId(tabs[0]?.id || '');
        }
        setIsDeleteModalOpen(false);
        setTabToDelete(null);
      } catch (error) {
        console.error('Error deleting environment:', error);
      }
    }
  };

  const updateTabSettings = async (setting: keyof Tab['settings'], value: any) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeTabId
          ? { ...tab, settings: { ...tab.settings, [setting]: value } }
          : tab
      )
    );
    
    // If we're updating system prompt suffix, save it to the server
    if (setting === 'systemPromptSuffix') {
      try {
        await fetch(`${API_BASE_URL}/api/v1/environments/${activeTabId}/config`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            system_prompt_suffix: value
          }),
        });
      } catch (error) {
        console.error('Error updating system prompt suffix:', error);
      }
    }
  };

  // Get the active tab's font size setting
  const activeTabFontSize = tabs.find(tab => tab.id === activeTabId)?.settings.fontSize || 'medium';
  const fontSizeClass = {
    'small': 'text-xs',
    'medium': 'text-sm',
    'large': 'text-base',
  }[activeTabFontSize];

  // Update this to properly handle provider changes
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value;
    setProvider(newProvider);
    
    // Update model to appropriate default based on provider
    if (newProvider === 'bedrock') {
      setModel('us.anthropic.claude-3-5-sonnet-20241022-v2:0');
    } else if (newProvider === 'anthropic') {
      setModel('claude-3-5-sonnet-latest');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono">
      <nav className="bg-gray-800 shadow">
        <div className="container mx-auto px-4">
          <ul className="flex space-x-4 overflow-x-auto py-2">
            {tabs.map((tab, index) => (
              <li key={tab.id} className="flex items-center">
                <button
                  className={`px-4 py-2 rounded-t-md whitespace-nowrap ${
                    activeTabId === tab.id
                      ? 'border-b-2 border-amber-500 text-amber-300'
                      : 'text-gray-300 hover:text-amber-300'
                  } ${loadingTabs.has(tab.id) ? 'opacity-50 cursor-wait' : ''} focus:outline-none font-mono`}
                  onClick={() => !loadingTabs.has(tab.id) && setActiveTabId(tab.id)}
                  disabled={loadingTabs.has(tab.id)}
                >
                  {loadingTabs.has(tab.id) ? (
                    <span className="flex items-center">
                      <span className="animate-pulse mr-2">⟳</span>
                      {tab.name}
                    </span>
                  ) : (
                    tab.name
                  )}
                </button>
                <div className="flex items-center">
                  {!loadingTabs.has(tab.id) && (
                    <button
                      onClick={() => handleDeleteTab(tab.id)}
                      className="ml-2 text-red-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              </li>
            ))}
            <li>
              <button
                className="px-4 py-2 rounded-t-md text-gray-300 hover:text-amber-300 focus:outline-none font-mono"
                onClick={handleAddTab}
              >
                +
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div className="container mx-auto mt-8 p-4">
        {tabs.length > 0 || loadingTabs.size > 0 ? (
          // Show chat interface when there are tabs or loading tabs
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Mobile Buttons */}
            <div className="lg:hidden flex space-x-2 mb-4">
              {/* DVC Link Button (Mobile) */}
              {tabs.find((tab) => tab.id === activeTabId)?.status === 'running' && 
               tabs.find((tab) => tab.id === activeTabId)?.public_ip && (
                <a
                  href={`https://${tabs.find((tab) => tab.id === activeTabId)?.public_ip}:8443`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-700 rounded-md hover:bg-blue-600 text-white"
                  title="Open DVC session"
                >
                  🖥️ DVC
                </a>
              )}
              {/* Settings Button (Mobile) */}
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 text-white"
              >
                ⚙️ Settings
              </button>
            </div>

            {/* Chat & Iframe Container */}
            <div
              className={`flex-1 bg-gray-800 rounded shadow p-4 ${
                isSettingsOpen ? 'lg:w-2/3' : 'lg:w-full'
              } order-1 lg:order-2`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-amber-300">
                  {tabs.find((tab) => tab.id === activeTabId)?.name}
                </h2>
                <div className="flex items-center space-x-2">
                  {/* DVC Link Button */}
                  {tabs.find((tab) => tab.id === activeTabId)?.status === 'running' && 
                   tabs.find((tab) => tab.id === activeTabId)?.public_ip && (
                    <a
                      href={`https://${tabs.find((tab) => tab.id === activeTabId)?.public_ip}:8443`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden lg:block px-4 py-2 bg-blue-700 rounded-md hover:bg-blue-600 text-white"
                      title="Open DVC session"
                    >
                      🖥️ Open DVC
                    </a>
                  )}
                  {/* Settings Button (Widescreen) */}
                  <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="hidden lg:block px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 text-white"
                  >
                    ⚙️ Settings
                  </button>
                </div>
              </div>

              <div className={`h-96 overflow-y-auto border rounded p-2 bg-gray-900 mb-4 ${fontSizeClass}`}>
                {activeTabId && 
                tabs.find((tab) => tab.id === activeTabId)?.messages.map((message, messageIndex) => {
                  const isAssistant = message.role === 'assistant';
                  
                  // Track tool use IDs to avoid showing tool_results separately
                  const toolUseIds = new Set(
                    message.content
                      .filter(item => item.type === 'tool_use' && item.id)
                      .map(item => item.id as string)
                  );
                  
                  return (
                    <div key={messageIndex} className="mb-4">
                      {message.content
                        // Filter out tool_result items that belong to a tool_use
                        .filter(contentItem => 
                          contentItem.type !== 'tool_result' || 
                          !contentItem.tool_use_id || 
                          !toolUseIds.has(contentItem.tool_use_id)
                        )
                        .map((contentItem, contentIndex) => {
                          // Skip items that should not be rendered
                          const shouldRender = 
                            contentItem.type === 'text' || 
                            contentItem.type === 'tool_use' || 
                            contentItem.type === 'image' ||
                            (contentItem.type === 'tool_result' && contentItem.content?.some(c => c.type === 'image'));
                          
                          if (!shouldRender) return null;
                          
                          return (
                            <div
                              key={`${messageIndex}-${contentIndex}`}
                              className={`mb-2 ${
                                isAssistant ? 'text-left' : 'text-right'
                              }`}
                            >
                              <div
                                className={`inline-block px-3 py-2 rounded-lg ${
                                  isAssistant
                                    ? 'bg-amber-900 text-amber-300'
                                    : 'bg-gray-700 text-gray-200 border border-gray-600'
                                } max-w-[80%]`}
                              >
                                <MessageContent content={contentItem} isAssistant={isAssistant} message={message} />
                                
                                {/* If this is a tool_use, look for corresponding tool_result */}
                                {contentItem.type === 'tool_use' && contentItem.id && 
                                  message.content
                                    .filter(item => 
                                      item.type === 'tool_result' && 
                                      item.tool_use_id === contentItem.id
                                    )
                                    .map((toolResult, idx) => (
                                      <div key={`result-${idx}`} className="mt-2">
                                        <MessageContent content={toolResult} isAssistant={isAssistant} message={message} />
                                      </div>
                                    ))
                                }
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  );
                })
              }
                <div ref={messagesEndRef} />
                {streamingTabs.has(activeTabId) && (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-pulse flex space-x-1">
                      <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                      <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                      <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
              <ChatInput 
                onSendMessage={handleSendMessage} 
                isDisabled={loadingTabs.has(activeTabId) || tabs.find(tab => tab.id === activeTabId)?.status !== 'running'} 
                isStreaming={streamingTabs.has(activeTabId)} 
                status={tabs.find(tab => tab.id === activeTabId)?.status}
              />
            </div>

            {/* Settings Panel (Mobile & Widescreen) */}
            {isSettingsOpen && (
              <div
                className={`bg-gray-800 p-4 rounded-lg order-2 lg:order-1 ${
                  isSettingsOpen ? 'lg:w-1/3' : 'lg:w-1/2'
                }`}
              >
                <h3 className="text-lg font-semibold mb-4">Tab Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Font Size
                    </label>
                    <select
                      value={tabs.find((tab) => tab.id === activeTabId)?.settings.fontSize}
                      onChange={(e) =>
                        updateTabSettings('fontSize', e.target.value)
                      }
                      className="w-full p-2 border rounded bg-gray-700 text-white"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      System Prompt Suffix
                    </label>
                    <textarea
                      value={tabs.find((tab) => tab.id === activeTabId)?.settings.systemPromptSuffix || ''}
                      onChange={(e) =>
                        updateTabSettings('systemPromptSuffix', e.target.value)
                      }
                      className="w-full p-2 border rounded bg-gray-700 text-white h-32"
                      placeholder="Add custom instructions to append to the system prompt..."
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Additional instructions to append to the system prompt. Changes take effect on the next message.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Show welcome screen only when there are no tabs and no loading tabs
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold text-amber-300 mb-6">Welcome to the Computer Use Interface</h1>
            <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
              <p className="text-lg mb-4">To get started:</p>
              <ol className="text-left list-decimal list-inside space-y-3">
                <li>Click the <span className="text-amber-300">+</span> button in the top navigation bar to create a new environment</li>
                <li>Choose your preferred model</li>
                <li>Enter an API key if required</li>
                <li>Start chatting!</li>
              </ol>
              <div className="mt-6 text-gray-400">
                <p>Each chat tab maintains its own computer environment, conversation history, and settings.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Tab Modal */}
      {isAddTabModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md text-white">
            <h3 className="text-lg font-medium mb-4">Add New Environment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Environment Name (optional):</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border p-2 bg-gray-700 text-white"
                  value={newTabName}
                  onChange={(e) => setNewTabName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Provider:</label>
                <select
                  className="mt-1 block w-full rounded-md border p-2 bg-gray-700 text-white"
                  value={provider}
                  onChange={handleProviderChange}
                >
                  <option value="bedrock">AWS Bedrock</option>
                  <option value="anthropic">Anthropic</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">API Key {provider === 'anthropic' && '(required)'}:</label>
                <input
                  type="password"
                  className="mt-1 block w-full rounded-md border p-2 bg-gray-700 text-white"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required={provider === 'anthropic'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Model:</label>
                <select
                  className="mt-1 block w-full rounded-md border p-2 bg-gray-700 text-white"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  {provider === 'bedrock' ? (
                    <>
                      <option value="us.anthropic.claude-3-7-sonnet-20250219-v1:0">Claude 3.7 Sonnet (Bedrock)</option>
                      <option value="us.anthropic.claude-3-5-sonnet-20241022-v2:0">Claude 3.5 Sonnet (Bedrock)</option>
                    </>
                  ) : (
                    <>
                      <option value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet (Anthropic)</option>
                      <option value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet (Anthropic)</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">System Prompt Suffix:</label>
                <textarea
                  className="mt-1 block w-full rounded-md border p-2 bg-gray-700 text-white h-24"
                  value={systemPromptSuffix}
                  onChange={(e) => setSystemPromptSuffix(e.target.value)}
                  placeholder="Add custom instructions to append to the system prompt..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  Additional instructions to append to the system prompt.
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={confirmAddTab}
                  className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
                >
                  Add
                </button>
                <button
                  onClick={() => setIsAddTabModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md text-white">
            <h3 className="text-lg font-medium mb-4">Confirm Delete</h3>
            <p className="mb-4">Are you sure you want to delete this tab?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={confirmDeleteTab}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type ChatInputProps = {
  onSendMessage: (text: string) => void;
  isDisabled: boolean;
  isStreaming: boolean;
  status?: string;
};

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isDisabled, isStreaming, status }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isStreaming && !isDisabled) {
      onSendMessage(message);
      setMessage('');
    }
  };
  
  // Generate appropriate placeholder text based on environment status
  const getPlaceholderText = () => {
    if (status === 'creating') return "Environment is being created...";
    if (status === 'initializing') return "Environment is initializing...";
    if (status === 'failed') return "Environment creation failed";
    if (status === 'timeout') return "Timed out waiting for environment";
    if (status === 'deleting') return "Environment is being deleted...";
    if (status !== 'running') return "Environment is not ready...";
    return "Type your message...";
  };
  
  // Generate appropriate button text based on environment status
  const getButtonText = () => {
    if (isStreaming) return "Thinking...";
    if (status === 'creating') return "Creating...";
    if (status === 'initializing') return "Initializing...";
    if (status === 'failed') return "Failed";
    if (status === 'timeout') return "Timed Out";
    if (status !== 'running') return "Waiting...";
    return "Send";
  };

  return (
    <form onSubmit={handleSubmit} className="flex mt-4">
      <input
        type="text"
        className="block w-full rounded-md border p-2 bg-gray-700 text-white focus:border-amber-500 focus:ring-amber-500"
        placeholder={getPlaceholderText()}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={isStreaming || isDisabled}
      />
      <button
        type="submit"
        className={`ml-2 px-4 py-2 rounded-md ${
          isStreaming || isDisabled
            ? 'bg-gray-500 cursor-not-allowed' 
            : 'bg-amber-500 hover:bg-amber-600'
        } text-white focus:outline-none`}
        disabled={isStreaming || isDisabled}
      >
        {getButtonText()}
      </button>
    </form>
  );
};

type MessageContentProps = {
  content: MessageContent;
  isAssistant?: boolean;
  message?: Message;
};

const MessageContent: React.FC<MessageContentProps> = ({ content, isAssistant, message }) => {
  if (!content) return null;

  console.log(`[MessageContent] Rendering content of type: ${content.type}`, content);
  
  if (content.type === 'text') {
    return (
      <span className="whitespace-pre-wrap">{content.text}</span>
    );
  } else if (content.type === 'image') {
    if (content.source?.data) {
      const mediaType = content.source.media_type || 'image/png';
      console.log(`[MessageContent] Rendering image, media type: ${mediaType}`);
      return (
        <div className="mt-2 mb-2">
          <img 
            src={`data:${mediaType};base64,${content.source.data}`} 
            alt="Generated content" 
            className="max-w-[300px] lg:max-w-[500px] h-auto rounded" 
            onLoad={() => console.log(`[MessageContent] Image loaded successfully`)}
            onError={(e) => console.error(`[MessageContent] Image failed to load:`, e)}
          />
        </div>
      );
    }
    return <div className="w-24 h-24 bg-gray-700 animate-pulse rounded"></div>;
  } else if (content.type === 'tool_use') {
    console.log(`[MessageContent] Rendering tool_use: ${content.name}`);
    return (
      <div className="tool-use p-2 my-1 bg-gray-800 rounded border border-gray-700">
        <div className="text-sm font-bold text-blue-400">Tool: {content.name}</div>
        {content.input && <div className="text-xs text-gray-400 mt-1">{JSON.stringify(content.input)}</div>}
      </div>
    );
  } else if (content.type === 'tool_result') {
    console.log(`[MessageContent] Rendering tool_result with content:`, content.content);
    
    // Handle image directly in tool result
    // Only show images for computer screenshot actions
    const hasImage = Array.isArray(content.content) && 
      content.content?.some(item => item.type === 'image' && item.source?.data);
    
    // This is a screenshot-specific feature - we need to check if this tool result
    // is from a computer tool with screenshot action
    const isComputerScreenshot = 
      content.tool_use_id && 
      content.name === 'computer' && 
      message?.content?.some(item => 
        item.type === 'tool_use' && 
        item.id === content.tool_use_id && 
        item.name === 'computer' && 
        item.input?.action === 'screenshot'
      );
    
    console.log(`[MessageContent] Tool result - hasImage: ${hasImage}, isComputerScreenshot: ${isComputerScreenshot}`);
    
    if (hasImage && isComputerScreenshot && content.content) {
      const imageItem = content.content.find(item => item.type === 'image' && item.source?.data);
      if (imageItem && imageItem.source && imageItem.source.data) {
        const mediaType = imageItem.source.media_type || 'image/png';
        return (
          <div className={`tool-result p-2 my-1 rounded ${content.is_error ? 'border border-red-500' : ''}`}>
            <div className="text-xs text-gray-400 mb-2">Tool result:</div>
            <img 
              src={`data:${mediaType};base64,${imageItem.source.data}`} 
              alt="Tool result" 
              className="max-w-[300px] lg:max-w-[500px] h-auto rounded" 
            />
            {content.is_error && <span className="text-red-500 text-sm">(Error)</span>}
          </div>
        );
      }
    }
    
    return (
      <div className={`tool-result p-2 my-1 rounded ${content.is_error ? 'border border-red-500' : ''}`}>
        {Array.isArray(content.content) ? (
          content.content.map((item, idx) => (
            <div key={idx} className="mb-2">
              <MessageContent content={item} isAssistant={isAssistant} message={message} />
            </div>
          ))
        ) : (
          typeof content.content === 'string' ? (
            <span className="whitespace-pre-wrap">{content.content}</span>
          ) : (
            <span className="text-gray-400">Tool result received</span>
          )
        )}
        {content.is_error && <span className="text-red-500 text-sm">(Error)</span>}
      </div>
    );
  } else {
    console.log(`[MessageContent] Unknown content type: ${content.type}`);
    return <div className="text-yellow-400 italic">Unknown content type: {content.type}</div>;
  }
};