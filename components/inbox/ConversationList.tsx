"use client";

import { useWhatsapp, useWhatsappConversation, useWhatsappConversationMessages } from "@/hooks/useWhatsapp";
import { useState } from "react";
import MediaPreview from "./media/MediaPreview";
import Image from "next/image";

// Utility function to format timestamps
const formatTime = (timestamp: string | Date) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

const formatMessageTime = (timestamp: string | Date) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function WhatsAppInbox() {
  const { data: convData } = useWhatsappConversation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const { sendMessage } = useWhatsapp();
  const [preview, setPreview] = useState<string | null>(null);

  const { data: msgData, loading: msgLoading } = useWhatsappConversationMessages(selectedId);

  const handleSendMessage = async () => {
    if (!text.trim() || !selectedId) return;

    try {
      await sendMessage({
        type: "text",
        conversationId: selectedId,
        message: text,
      });
      setText("");
    } catch (err) {
      console.error("❌ Failed to send:", err);
    }
  };
  
  const handleSelectConversation = async (id: string) => {
    setSelectedId(id);

    // try {
    //     await markRead(); // ✅ now server-only function resets it
    // } catch (err) {
    //     console.error("❌ Failed to mark as read:", err);
    // }
  };

  const selectedConversation = convData?.conversations?.find((c: any) => c.id === selectedId);  

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Sidebar: Conversation List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {convData?.conversations?.map((c: any) => (
            <div
              key={c.id}
              onClick={() => handleSelectConversation(c.id)}
              className={`px-6 py-4 cursor-pointer transition-colors duration-150 border-b border-gray-50 hover:bg-gray-50 ${
                selectedId === c.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm font-medium truncate ${
                      c.unread_count > 0 ? "text-gray-900" : "text-gray-700"
                    }`}>
                      {c.contact?.profile_name || c.contact?.wa_id || "Unknown Contact"}
                    </h3>
                    {c.last_message?.timestamp && (
                      <span className={`text-xs ml-2 flex-shrink-0 ${
                        c.unread_count > 0 ? "text-blue-600 font-medium" : "text-gray-400"
                      }`}>
                        {formatTime(c.last_message.timestamp)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${
                      c.unread_count > 0 ? "text-gray-600 font-medium" : "text-gray-500"
                    }`}>
                      {c.last_message?.type === 'image' ? "Image" : c.last_message?.body || "No messages yet"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side: Chat View */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedId ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm font-medium text-gray-600">
                    {(selectedConversation?.contact?.profile_name || selectedConversation?.contact?.wa_id || "U")
                      .charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedConversation?.contact?.profile_name || selectedConversation?.contact?.wa_id || "Unknown Contact"}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {selectedConversation?.contact?.wa_id}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {msgLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                msgData?.messages?.map((m: any) => (
                  <div
                    key={m.id}
                    className={`flex ${m.direction === "inbound" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                        m.direction === "inbound"
                          ? "bg-white border border-gray-200 text-gray-900"
                          : "bg-blue-500 text-white"
                      }`}
                    >
                      {/* Text message */}
                      {m.body && <p className="text-sm leading-relaxed">{m.body}</p>}

                      {/* Media message */}
                      {m.message_media?.map((media: any) => (
                        <div key={media.id} className="mt-3">
                          {media.mime_type.startsWith("image/") ? (
                            <div className="relative group">
                              {/* Image Thumbnail */}
                              <div
                                onClick={() => setPreview(media.media_id)}
                                className="cursor-pointer rounded-xl overflow-hidden bg-gray-100 relative hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02] max-w-xs"
                              >
                                {/* Loading placeholder that will be replaced by actual image */}
                                <div className="aspect-square w-48 h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                                  {/* Shimmer effect */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite] group-hover:translate-x-full transition-transform duration-1000"></div>
                                  
                                  {/* Thumbnail preview using the actual media endpoint */}
                                  <Image
                                    src={`http://localhost:3001/api/whatsapp/media/${media.media_id}`}
                                    alt={media.caption || "Image"}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    fill
                                  />
                                  
                                  {/* Fallback content */}
                                  <div className="absolute inset-0 hidden items-center justify-center flex-col text-gray-400">
                                    <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-xs">Image</span>
                                  </div>
                                </div>

                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 backdrop-blur-sm rounded-full p-2">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>

                              {/* Caption for images */}
                              {media.caption && (
                                <p className="text-sm mt-2 text-gray-600 leading-relaxed">
                                  {media.caption}
                                </p>
                              )}
                            </div>
                          ) : media.mime_type.startsWith("video/") ? (
                            <div className="relative group">
                              {/* Video Thumbnail */}
                              <div
                                onClick={() => setPreview(media.media_id)}
                                className="cursor-pointer rounded-xl overflow-hidden bg-gray-900 relative hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02] max-w-xs"
                              >
                                <div className="aspect-video w-48 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
                                  {/* Video thumbnail or placeholder */}
                                  <video
                                    className="w-full h-full object-cover"
                                    preload="metadata"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling!.style.display = 'flex';
                                    }}
                                  >
                                    <source src={`/api/whatsapp/media/${media.media_id}#t=1`} type={media.mime_type} />
                                  </video>
                                  
                                  {/* Fallback for video */}
                                  <div className="absolute inset-0 flex items-center justify-center flex-col text-white">
                                    <div className="bg-black/50 rounded-full p-3">
                                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                    </div>
                                    <span className="text-xs mt-2 bg-black/50 px-2 py-1 rounded">Video</span>
                                  </div>
                                </div>

                                {/* Play button overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="bg-black/50 backdrop-blur-sm rounded-full p-4 group-hover:bg-black/70 transition-colors">
                                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>

                              {/* Caption for videos */}
                              {media.caption && (
                                <p className="text-sm mt-2 text-gray-600 leading-relaxed">
                                  {media.caption}
                                </p>
                              )}
                            </div>
                          ) : media.mime_type.startsWith("audio/") ? (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-w-xs">
                              <div className="flex items-center space-x-3">
                                <div className="bg-green-100 rounded-full p-3 flex-shrink-0">
                                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5 15V9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0112.07 4h.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 7H17a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">Voice Message</p>
                                  <audio controls className="w-full mt-2">
                                    <source src={`/api/whatsapp/media/${media.media_id}`} type={media.mime_type} />
                                    Your browser does not support audio playback.
                                  </audio>
                                </div>
                              </div>
                              {media.caption && (
                                <p className="text-sm mt-3 text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                                  {media.caption}
                                </p>
                              )}
                            </div>
                          ) : (
                            /* Generic file download */
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-w-xs hover:bg-gray-100 transition-colors">
                              <div className="flex items-center space-x-3">
                                <div className="bg-blue-100 rounded-full p-3 flex-shrink-0">
                                  {/* File type icon based on mime type */}
                                  {media.mime_type.includes('pdf') ? (
                                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8.267 14.68c-.184 0-.308.018-.372.036v1.178c.076.018.171.023.302.023.479 0 .774-.242.774-.651 0-.366-.254-.586-.704-.586zm3.487.012c-.2 0-.33.018-.407.036v2.61c.077.018.201.018.313.018.817.006 1.349-.444 1.349-1.396.006-.83-.479-1.268-1.255-1.268z"/>
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.498 16.19c-.309.29-.765.42-1.296.42a2.23 2.23 0 0 1-.308-.018v1.426H7.18V14.845c.29-.053.559-.089.885-.089.539 0 .934.18 1.206.499.254.299.369.69.369 1.284 0 .580-.17 1.003-.442 1.251zM12.455 17.994c-.397.094-.841.099-1.242.099V14.845c.185-.018.442-.036.81-.036 1.036 0 1.529.511 1.529 1.545 0 1.251-.538 1.640-1.097 1.640z"/>
                                    </svg>
                                  ) : media.mime_type.includes('document') || media.mime_type.includes('text') ? (
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {media.filename || 'Document'}
                                    </p>
                                    <a
                                      href={`/api/whatsapp/media/${media.media_id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="ml-2 text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0"
                                      title="Download file"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    </a>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {media.mime_type.split('/')[1].toUpperCase()}
                                    {media.file_size && ` • ${(media.file_size / 1024 / 1024).toFixed(1)} MB`}
                                  </p>
                                </div>
                              </div>
                              {media.caption && (
                                <p className="text-sm mt-3 text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                                  {media.caption}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Modal for media preview */}
                          {preview === media.media_id && (
                            <MediaPreview 
                              mediaId={preview} 
                              onClose={() => setPreview(null)}
                              mediaType={media.mime_type}
                              fileName={media.filename || media.caption}
                            />
                          )}
                        </div>
                      ))}

                      {m.timestamp && (
                        <p className={`text-xs mt-1 ${
                          m.direction === "inbound" ? "text-gray-400" : "text-blue-100"
                        }`}>
                          {formatMessageTime(m.timestamp)}
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendMessage();
                    }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!text.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors duration-150 flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
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