'use client';

import { useState, useEffect, Fragment, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/app/components/HelperComponents';
import { FaPaperPlane } from 'react-icons/fa';

// --- Type Definitions ---
type Message = {
	message_id: string;
	sender_type: 'client' | 'admin';
	content: string;
	created_at: string;
};

// --- Main Messages Page Component ---
export default function ClientMessagesPage() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [messageInput, setMessageInput] = useState('');
	const [sending, setSending] = useState(false);
	const [loading, setLoading] = useState(true);
	const [userId, setUserId] = useState<string | null>(null);
	const { showToast, Toast } = useToast();
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Scrolls to the bottom whenever messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Initial Data Fetch
	useEffect(() => {
		const setupPage = async () => {
			setLoading(true);
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				const currentUserId = user.id;
				setUserId(currentUserId);
				
				const { data, error } = await supabase
					.from('messages')
					.select('message_id, sender_type, content, created_at')
					.eq('client_id', currentUserId)
					.order('created_at', { ascending: true });
				
				if (error) {
					showToast('Could not fetch messages.', 'error');
				} else {
					setMessages(data as Message[]);
					
					// CRITICAL FIX #2: Mark incoming admin messages as read after fetching
					await supabase
						.from('messages')
						.update({ is_read: true })
						.eq('client_id', currentUserId)
						.eq('sender_type', 'admin')
						.eq('is_read', false); // Only update unread ones
				}
			}
			setLoading(false);
		};
		setupPage();
		// Only run on component mount
	}, []);

	// Real-time Subscription for new messages
	useEffect(() => {
		if (!userId) return;

		const channel = supabase
			.channel(`messages-for-${userId}`)
			.on<Message>(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'messages', filter: `client_id=eq.${userId}` },
				(payload) => {
					// Supabase returns the entire new row on INSERT
					setMessages((currentMessages) => [...currentMessages, payload.new as Message]);
					
					// Optional: If the new message is from the admin, immediately mark it as read 
					// since the user is currently viewing the page. This prevents the badge from briefly incrementing.
					if (payload.new.sender_type === 'admin') {
						supabase
							.from('messages')
							.update({ is_read: true })
							.eq('message_id', payload.new.message_id)
							.then(({ error }) => {
								if (error) console.error("Failed to mark new realtime message as read:", error);
							});
					}
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [userId]);

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!messageInput.trim() || !userId) return;

		setSending(true);
		const content = messageInput.trim();
		setMessageInput('');

		const { error } = await supabase.from('messages').insert({
			client_id: userId,
			sender_type: 'client',
			content: content,
			is_read: true // Client messages are immediately 'read' by the sender (client)
		});

		if (error) {
			showToast('Failed to send message.', 'error');
			setMessageInput(content); // Put the message back in the input on failure
		}
		setSending(false);
	};
	
	if (loading) {
		return <div className="flex justify-center items-center h-full">Loading messages...</div>;
	}

	return (
		<Fragment>
			<Toast />
			 <header className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900">Messages</h1>
				<p className="text-lg text-gray-600 mt-1">Communicate directly with our team.</p>
			</header>
			
			<section className="bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col" style={{height: '70vh'}}>
				<div className="flex-1 overflow-y-auto p-6 space-y-4">
					{messages.length === 0 && (
						<div className="text-center text-gray-500 pt-16">
							No messages yet. Send one to start the conversation!
						</div>
					)}
					{messages.map(msg => (
						<div key={msg.message_id} className={`flex ${msg.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}>
							<div className={`p-3 max-w-lg rounded-2xl ${msg.sender_type === 'client' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
								<p className="text-base">{msg.content}</p>
								<p className={`text-xs mt-1 ${msg.sender_type === 'client' ? 'text-purple-200' : 'text-gray-500'}`}>
									{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</p>
							</div>
						</div>
					))}
					<div ref={messagesEndRef} />
				</div>
				<form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 flex gap-4 items-center">
					<input 
						type="text" 
						value={messageInput}
						onChange={e => setMessageInput(e.target.value)}
						placeholder="Type your message..."
						className="flex-1 p-4 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
						disabled={sending}
					/>
					<button 
						type="submit" 
						className="p-4 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 transition-all disabled:opacity-50"
						disabled={sending || !messageInput.trim()}
					>
						<FaPaperPlane />
					</button>
				</form>
			</section>
		</Fragment>
	);
}
