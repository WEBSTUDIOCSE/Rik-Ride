'use client';

/**
 * Chat Component
 * Real-time chat between student and driver during booking
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageCircle, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatService } from '@/lib/firebase/services/chat.service';
import type { ChatMessage, MessageSender } from '@/lib/types/chat.types';
import { QUICK_REPLIES } from '@/lib/types/chat.types';
import { cn } from '@/lib/utils';

interface ChatProps {
  bookingId: string;
  currentUserId: string;
  currentUserType: MessageSender;
  currentUserName: string;
  otherUserName: string;
  isActive?: boolean; // Whether chat is enabled
}

export function Chat({
  bookingId,
  currentUserId,
  currentUserType,
  currentUserName,
  otherUserName,
  isActive = true,
}: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatActive, setChatActive] = useState(isActive);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Subscribe to messages
  useEffect(() => {
    const unsubscribe = ChatService.subscribeToMessages(bookingId, (msgs) => {
      setMessages(msgs);
      
      // Count unread messages from other user when chat is closed
      if (!isOpen) {
        const unread = msgs.filter(
          (m) => m.senderId !== currentUserId && m.status !== 'read'
        ).length;
        setUnreadCount(unread);
      }
    });

    return () => unsubscribe();
  }, [bookingId, currentUserId, isOpen]);

  // Check if chat is active
  useEffect(() => {
    const checkChatStatus = async () => {
      const active = await ChatService.isChatActive(bookingId);
      setChatActive(active);
    };

    checkChatStatus();
    
    // Poll every 30 seconds to check if chat is still active
    const interval = setInterval(checkChatStatus, 30000);
    return () => clearInterval(interval);
  }, [bookingId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      ChatService.markMessagesAsRead(bookingId, currentUserId);
      setUnreadCount(0);
    }
  }, [isOpen, bookingId, currentUserId, messages.length]);

  // Focus input when opening chat
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || isSending || !chatActive) return;

    setIsSending(true);
    try {
      await ChatService.sendMessage(
        bookingId,
        currentUserId,
        currentUserType,
        currentUserName,
        newMessage.trim()
      );
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [newMessage, isSending, chatActive, bookingId, currentUserId, currentUserType, currentUserName]);

  const handleQuickReply = (reply: string) => {
    setNewMessage(reply);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const quickReplies = QUICK_REPLIES[currentUserType];

  // Chat Toggle Button (FAB)
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
    );
  }

  // Chat Window
  return (
    <Card className="fixed bottom-4 right-4 w-[calc(100vw-2rem)] sm:w-96 h-[70vh] max-h-[500px] shadow-xl z-50 flex flex-col">
      {/* Header */}
      <CardHeader className="p-3 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-medium">
              Chat with {otherUserName}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {!chatActive && (
              <Badge variant="secondary" className="text-xs">
                Disabled
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
              <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
              <p>No messages yet</p>
              <p className="text-xs">Start a conversation</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isOwn = message.senderId === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={cn(
                      'flex flex-col max-w-[80%]',
                      isOwn ? 'ml-auto items-end' : 'items-start'
                    )}
                  >
                    <div
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm',
                        isOwn
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-muted rounded-bl-none'
                      )}
                    >
                      {message.message}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Quick Replies */}
      {chatActive && (
        <div className="px-3 py-2 border-t flex-shrink-0">
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
            {quickReplies.map((reply, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs whitespace-nowrap flex-shrink-0"
                onClick={() => handleQuickReply(reply)}
              >
                {reply}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t flex-shrink-0">
        {chatActive ? (
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
              disabled={isSending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-2">
            <p>Chat disabled after ride started</p>
            <p className="text-xs">For safety, please focus on the ride</p>
          </div>
        )}
      </div>
    </Card>
  );
}

export default Chat;
