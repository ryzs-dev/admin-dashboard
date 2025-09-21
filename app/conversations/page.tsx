/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion } from "motion/react";
import { useWhatsapp, useWhatsappMessages } from "@/hooks/useWhatsapp";
import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Send,
  MoreVertical,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  Archive,
  Filter,
  Settings,
  MessageSquare,
  Paperclip,
  Smile,
  Circle,
  RefreshCw,
} from "lucide-react";

export default function SharedInbox() {
  const { data, error } = useWhatsappMessages();
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Group messages by phone number to create conversations
  const conversations = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    const grouped = data.reduce((acc: any, msg: any) => {
      // Always tie the conversation to the customer (recipient in outbound, sender in inbound)
      const phone = msg.direction === "inbound" ? msg.from : msg.to || msg.from;

      if (!acc[phone]) {
        acc[phone] = {
          phone_number: phone,
          customer_name: msg.profileName || phone,
          messages: [],
          last_message_at: msg.timestamp,
          unread_count: 0,
        };
      }

      acc[phone].messages.push(msg);

      if (parseInt(msg.timestamp) > parseInt(acc[phone].last_message_at)) {
        acc[phone].last_message_at = msg.timestamp;
      }

      return acc;
    }, {});

    return Object.values(grouped).sort(
      (a: any, b: any) =>
        parseInt(b.last_message_at) - parseInt(a.last_message_at)
    );
  }, [data]);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(
    (conv: any) =>
      conv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.phone_number.includes(searchQuery)
  );

  // Get messages for selected conversation
  const selectedMessages = React.useMemo(() => {
    if (!selectedConversation) return [];
    const conversation = conversations.find(
      (c: any) => c.phone_number === selectedConversation
    );

    console.log("Selected conversation:", conversation);
    return conversation || [];
  }, [selectedConversation, conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedMessages]);

  const { sendMessage } = useWhatsapp();

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);
      console.log("Sending Text");
      console.log(
        "Sending message to:",
        selectedConversation,
        "Message:",
        newMessage
      );

      setNewMessage("");

      await sendMessage({
        to: selectedConversation,
        type: "text",
        message: newMessage,
      });
    } catch (err) {
      console.error("❌ Failed to send:", err);
    } finally {
      setSending(false);
    }
  };

  //   const sendMessage = async () => {
  //     if (!newMessage.trim() || !selectedConversation || sending) return;

  //     try {
  //       setSending(true);
  //       // Here you would integrate with your existing send message API
  //       console.log(
  //         "Sending message to:",
  //         selectedConversation,
  //         "Message:",
  //         newMessage
  //       );

  //       // For now, just clear the input
  //       setNewMessage("");

  //       // TODO: Integrate with your actual send message endpoint
  //       // const response = await fetch('/api/send-whatsapp-message', {
  //       //   method: 'POST',
  //       //   headers: { 'Content-Type': 'application/json' },
  //       //   body: JSON.stringify({ to: selectedConversation, message: newMessage })
  //       // });
  //     } catch (error) {
  //       console.error("Error sending message:", error);
  //     } finally {
  //       setSending(false);
  //     }
  //   };

  const formatTime = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  const getMessageStatus = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      case "sent":
        return <CheckCircle2 className="w-3 h-3 text-blue-500" />;
      default:
        return <Circle className="w-3 h-3 text-gray-400" />;
    }
  };

  if (error)
    return <div className="p-4 text-red-600">❌ Failed to load messages</div>;
  if (!data) return <div className="p-4">⏳ Loading...</div>;

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar - Conversation List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-gray-900">Inbox</h1>
            <div className="flex items-center gap-2">
              <button className="p-1.5 hover:bg-gray-100 rounded-md">
                <Settings className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded-md">
                <Filter className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No conversations yet...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredConversations.map((conv: any) => (
                <motion.div
                  key={conv.phone_number}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedConversation === conv.phone_number
                      ? "bg-blue-50 border-r-2 border-blue-500"
                      : ""
                  }`}
                  onClick={() => setSelectedConversation(conv.phone_number)}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-5">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {conv.customer_name}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatTime(conv.last_message_at)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 truncate mb-1">
                        {conv.phone_number}
                      </p>

                      <p className="text-sm text-gray-500 truncate">
                        {conv.messages[conv.messages.length - 1]?.body ||
                          "No messages"}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {conv.unread_count > 0 && (
                      <div className="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                        {conv.unread_count}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-medium text-gray-900">
                      {
                        conversations.find(
                          (c: any) => c.phone_number === selectedConversation
                        )?.customer_name
                      }
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedConversation}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-md">
                    <Phone className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-md">
                    <Archive className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-md">
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-4">
                {selectedMessages.messages?.map((msg: any, idx: number) => (
                  <motion.div
                    key={`${msg.timestamp}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-end gap-2 ${
                      msg.direction === "outbound"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`rounded-lg p-3 shadow-sm max-w-xs ${
                        msg.direction === "outbound"
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-900"
                      }`}
                    >
                      <p>{msg.body}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 gap-2">
                        <span className="text-xs opacity-70">
                          {new Date(
                            parseInt(msg.timestamp) * 1000
                          ).toLocaleTimeString()}
                        </span>
                        {getMessageStatus(msg.status)}
                      </div>
                    </div>
                  </motion.div>
                ))}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 resize-none outline-none text-sm"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <div className="flex items-center gap-1">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Paperclip className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Smile className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  className={`p-3 rounded-lg transition-colors ${
                    newMessage.trim() && !sending
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {sending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Welcome to your Shared Inbox
              </h3>
              <p className="text-gray-500">
                Select a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
