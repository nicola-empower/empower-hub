// src/app/admin/[clientId]/messages/page.tsx
'use client';

import { useState, useEffect, Fragment, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/app/components/HelperComponents';
import { FaPaperPlane, FaArrowLeft } from 'react-icons/fa';

type Message = {
  message_id: string;
  sender_type: 'client' | 'admin';
  content: string;
  created_at: string;
};

export default function AdminMessagesPage() {
    const { clientId } = useParams<{ clientId: string }>();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const { showToast, Toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!clientId) return;
            setLoading(true);
            const { data, error } = await supabase.from('messages').select('*').eq('client_id', clientId).order('created_at', { ascending: true });
            if (error) {
                showToast('Could not load messages.', 'error');
            } else {
                setMessages(data as Message[]);
            }
            setLoading(false);
        };
        fetchMessages();

        const channel = supabase
            .channel(`realtime-messages-for-${clientId}`)
            .on<Message>(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `client_id=eq.${clientId}` },
                (payload) => setMessages(current => [...current, payload.new])
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    // THE FIX: Dependency array now only contains clientId
    }, [clientId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !clientId) return;
        setSending(true);
        const content = messageInput.trim();
        setMessageInput('');

        const { error } = await supabase.from('messages').insert({
            client_id: clientId,
            sender_type: 'admin',
            content
        });

        if (error) {
            showToast('Failed to send message.', 'error');
            setMessageInput(content);
        }
        setSending(false);
    };

    if (loading) return <div>Loading messages...</div>;

    return (
        <Fragment>
            <Toast />
             <div className="flex items-center gap-4 mb-6">
                 <button onClick={() => router.back()} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-all">
                    <FaArrowLeft />
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            </div>

            <section className="bg-white rounded-2xl shadow-md flex flex-col" style={{ height: '70vh' }}>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map(msg => (
                        <div key={msg.message_id} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 max-w-lg rounded-2xl ${msg.sender_type === 'admin' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                <p className="text-base">{msg.content}</p>
                                <p className={`text-xs mt-1 ${msg.sender_type === 'admin' ? 'text-purple-200' : 'text-gray-500'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 flex gap-4 items-center">
                    <input type="text" value={messageInput} onChange={e => setMessageInput(e.target.value)} placeholder="Type your message..." className="flex-1 p-4 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200" disabled={sending} />
                    <button type="submit" className="p-4 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 disabled:opacity-50" disabled={sending || !messageInput.trim()}>
                        <FaPaperPlane />
                    </button>
                </form>
            </section>
        </Fragment>
    );
}
