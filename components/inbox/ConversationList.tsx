'use client';

import { useState } from 'react';
import { useConversations } from '@/hooks/useConversations';
import { useConversationMessages } from '@/hooks/useConversationMessages';
import {
  formatChatTimestamp,
  renderMessage,
  unixToGMT8,
} from '@/lib/utils/metaWhatsapp';
import MediaPreview from './media/MediaPreview';
import { MessageInput } from '@/types/message';

export default function WhatsAppInbox() {
  const { conversations: convData, isLoading: convLoading } =
    useConversations();
  const [selectedId, setSelectedId] = useState<string>('');
  const {
    messages: msgData,
    isLoading: msgLoading,
    sendMessage,
    refresh,
  } = useConversationMessages(selectedId);
  const [text, setText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewMedia, setPreviewMedia] = useState<{
    mediaId: string;
    fileName?: string;
  } | null>(null);

  const selectedConversation = convData.data?.find(
    (c: any) => c.id === selectedId
  );

  const filteredConversations =
    convData.data?.filter((c: any) => {
      const nameMatch = c.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const phoneMatch = c.phone_number?.includes(searchTerm);
      return nameMatch || phoneMatch;
    }) || [];

  const handleSelectConversation = (id: string) => setSelectedId(id);

  const handleSendMessage = async () => {
    if (!text.trim() || !selectedConversation) return;

    const message: MessageInput = {
      to_number: selectedConversation.phone_number,
      body: { text: text.trim() },
      direction: 'outbound',
      type: 'text',
    };

    await sendMessage(message);
    setText('');
  };

  return (
    <div className="flex max-h-[93vh] bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100">
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
        </div>

        <div className="px-4 py-2 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {convLoading ? (
            <div className="flex justify-center items-center h-32">
              Loading...
            </div>
          ) : (
            filteredConversations.map((c: any) => (
              <div
                key={c.id}
                onClick={() => handleSelectConversation(c.id)}
                className={`px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                  selectedId === c.id
                    ? 'bg-blue-100 pl-3'
                    : 'border-l-3 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {c.name.toUpperCase()} ({c.phone_number})
                      </h3>
                      {c.last_message_at && (
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatChatTimestamp(c.last_message_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate line-clamp-1">
                      Last Sent at {formatChatTimestamp(c.last_message_at)}
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
              <div className="flex-col items-center">
                <h2 className="font-semibold text-gray-900 pb-1">
                  {selectedConversation.name.toUpperCase()}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedConversation?.phone_number}
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col-reverse space-y-reverse space-y-3">
              {msgLoading ? (
                <div className="flex justify-center items-center h-32">
                  Loading messages...
                </div>
              ) : (
                msgData.data?.map((m: any) => {
                  const rendered = renderMessage(m);
                  return (
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
                        {rendered.type === 'image' ? (
                          <button
                            onClick={() =>
                              setPreviewMedia({
                                mediaId: rendered.mediaId,
                                fileName: rendered.fileName,
                              })
                            }
                            className="flex items-center space-x-2 text-sm underline opacity-80 hover:opacity-100"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span>{rendered.fileName || 'View image'}</span>
                          </button>
                        ) : (
                          <p className="text-sm leading-relaxed">
                            {rendered.content}
                          </p>
                        )}
                        {m.timestamp && (
                          <div
                            className={`flex items-center justify-end mt-1 space-x-2 text-xs ${
                              m.direction === 'inbound'
                                ? 'text-gray-400'
                                : 'text-blue-100'
                            }`}
                          >
                            <span>{unixToGMT8(m.timestamp)}</span>

                            <span>•</span>

                            <span className="capitalize">{m.status}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {previewMedia && (
                <MediaPreview
                  mediaId={previewMedia.mediaId}
                  fileName={previewMedia.fileName}
                  onClose={() => setPreviewMedia(null)}
                />
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
