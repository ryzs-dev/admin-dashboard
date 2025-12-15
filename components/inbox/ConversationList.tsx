'use client';

import { useState } from 'react';
import { useConversations } from '@/hooks/useConversations';
import { useConversationMessages } from '@/hooks/useConversationMessages';

export default function WhatsAppInbox() {
  const { conversations: convData, isLoading: convLoading } =
    useConversations();
  const [selectedId, setSelectedId] = useState<string>('');
  const { messages: msgData, isLoading: msgLoading } =
    useConversationMessages(selectedId);
  const [text, setText] = useState('');

  const handleSelectConversation = (id: string) => setSelectedId(id);

  const handleSendMessage = async () => {
    console.log('Send message:', { to: selectedId, body: text });
  };

  const selectedConversation = convData.data?.find(
    (c: any) => c.id === selectedId
  );

  console.log('Selected Conversation:', selectedConversation);
  console.log('Messages:', msgData);

  function convertToGMT8(utcString: string): string {
    const utcDate = new Date(utcString);

    const gmt8Date = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);

    const hours = String(gmt8Date.getHours()).padStart(2, '0');
    const minutes = String(gmt8Date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
  }

  function unixToDate(unixSeconds: number): string {
    // Convert seconds → milliseconds
    const date = new Date(unixSeconds * 1000);

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
  }

  return (
    <div className="flex max-h-[93vh] bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100">
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {convLoading ? (
            <div className="flex justify-center items-center h-32">
              Loading...
            </div>
          ) : (
            convData.data?.map((c: any) => (
              <div
                key={c.id}
                onClick={() => handleSelectConversation(c.id)}
                className={`px-4 py-3 cursor-pointer transition-all duration-200 rounded-lg hover:bg-gray-50 ${
                  selectedId === c.id
                    ? 'bg-blue-50 border-l-3 border-l-blue-500 pl-3'
                    : 'border-l-3 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {c.name ? c.name : c.phone_number}
                      </h3>
                      {c.last_message_at && (
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {convertToGMT8(c.last_message_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate line-clamp-1">
                      {c.last_message?.type === 'image'
                        ? '📷 Image'
                        : c.last_message?.text_body || 'No messages yet'}
                    </p>
                  </div>

                  {/* Optional: Add unread indicator */}
                  {c.unread_count > 0 && (
                    <div className="flex items-center justify-center ml-2">
                      <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {c.unread_count > 9 ? '9+' : c.unread_count}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Side */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedId ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm font-medium text-gray-600"></span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedConversation?.name
                      ? selectedConversation.name
                      : selectedConversation?.phone_number}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {selectedConversation?.status.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col-reverse space-y-reverse space-y-3">
              {msgLoading ? (
                <div className="flex justify-center items-center h-32">
                  Loading messages...
                </div>
              ) : (
                msgData.data?.map((m: any) => (
                  <div
                    key={m.id}
                    className={`flex ${m.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                        m.direction === 'inbound'
                          ? 'bg-white border border-gray-200 text-gray-900'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{m.text_body}</p>
                      {m.timestamp && (
                        <p
                          className={`text-xs mt-1 ${
                            m.direction === 'inbound'
                              ? 'text-gray-400'
                              : 'text-blue-100'
                          }`}
                        >
                          {unixToDate(m.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="px-4 py-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!text.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-full"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
