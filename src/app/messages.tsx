'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Message = {
    message_id: string;
    client_id: string;
    sender_type: 'client' | 'admin';
    content: string;
    created_at: string;
}

export default function Messages({ client_id }: { client_id: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [messageInput, setMessageInput] = useState('');

    const fetchMessages = async () => {
        if (!client_id) return;
        setLoadingMessages(true);
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('client_id', client_id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error.message);
        } else {
            setMessages(data as Message[]);
        }
        setLoadingMessages(false);
    };

    useEffect(() => {
        fetchMessages();
    }, [client_id]);
    
    useEffect(() => {
        if (!client_id) return;
        const channel = supabase
            .channel(`realtime-messages-for-${client_id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `client_id=eq.${client_id}` },
                (payload) => {
                    // Only add the message if it's from the client to avoid duplicates
                    if (payload.new.sender_type === 'client') {
                        setMessages((currentMessages) => [...currentMessages, payload.new as Message]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [client_id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !client_id) return;

        const newMessageStub = {
            message_id: `temp-${Date.now()}`, // Temporary ID for the key
            client_id,
            sender_type: 'admin' as const,
            content: messageInput,
            created_at: new Date().toISOString(),
        };

        // THE FIX: Instantly update the UI
        setMessages(currentMessages => [...currentMessages, newMessageStub]);
        setMessageInput('');

        // Send the real message to the database
        const { error } = await supabase.from('messages').insert([{
            client_id: newMessageStub.client_id,
            sender_type: newMessageStub.sender_type,
            content: newMessageStub.content
        }]);

        if (error) {
            console.error('Error sending message:', error.message);
            alert(`Error sending message: ${error.message}`);
            // If there was an error, remove the message we optimistically added
            setMessages(currentMessages => currentMessages.filter(msg => msg.message_id !== newMessageStub.message_id));
        } else {
            // Optional: refetch messages to get the real ID from the server
            fetchMessages();
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">Messages</h3>
            <div className="flex flex-col h-96 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loadingMessages ? (
                        <p className="text-center text-gray-600">Loading messages...</p>
                    ) : messages.length > 0 ? (
                        messages.map(msg => (
                            <div key={msg.message_id} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-3 max-w-xs md:max-w-md rounded-2xl shadow-sm ${
                                    msg.sender_type === 'admin'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white text-gray-800 border'
                                }`}>
                                    <p className="text-sm">{msg.content}</p>
                                    <span className={`block text-xs mt-1 ${
                                        msg.sender_type === 'admin' ? 'text-purple-200 text-right' : 'text-gray-500'
                                    }`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 pt-16">No messages yet. Send one to start the conversation!</p>
                    )}
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 flex gap-2">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                    <button type="submit" disabled={!messageInput.trim()} className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl transition-colors duration-300 shadow-lg disabled:opacity-50">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}