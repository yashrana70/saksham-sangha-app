-- WhatsApp-like Messaging System for Saksham
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages sent TO them or BY them
CREATE POLICY "Users can view their own messages" ON direct_messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can insert messages if they are the sender
CREATE POLICY "Users can send messages" ON direct_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can update message read status if they are the receiver
CREATE POLICY "Receivers can mark messages as read" ON direct_messages
    FOR UPDATE USING (auth.uid() = receiver_id);

-- Create index for faster querying
CREATE INDEX idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX idx_direct_messages_receiver ON direct_messages(receiver_id);
CREATE INDEX idx_direct_messages_created_at ON direct_messages(created_at);
