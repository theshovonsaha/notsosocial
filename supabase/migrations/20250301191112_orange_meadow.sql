/*
  # Initial Schema for Not So Social Media

  1. New Tables
    - `users` - Stores user profiles
    - `availability` - Manages time slots and availability status
    - `hangout_requests` - Tracks hangout requests between users
    - `hangout_participants` - Tracks participants for each hangout request
    - `group_chats` - Stores chat information with expiry timestamp
    - `chat_participants` - Tracks participants in each group chat
    - `messages` - Stores messages for group chats

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  is_pro BOOLEAN DEFAULT false NOT NULL
);

-- Create availability table
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, day_of_week, start_time, end_time)
);

-- Create hangout_requests table
CREATE TABLE IF NOT EXISTS hangout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'rescheduled')) DEFAULT 'pending',
  group_chat_id UUID
);

-- Create hangout_participants table
CREATE TABLE IF NOT EXISTS hangout_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hangout_id UUID NOT NULL REFERENCES hangout_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'rescheduled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (hangout_id, user_id)
);

-- Create group_chats table
CREATE TABLE IF NOT EXISTS group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  hangout_id UUID NOT NULL REFERENCES hangout_requests(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '3 days'),
  is_permanent BOOLEAN DEFAULT false NOT NULL
);

-- Add foreign key constraint to hangout_requests
ALTER TABLE hangout_requests 
ADD CONSTRAINT fk_group_chat 
FOREIGN KEY (group_chat_id) 
REFERENCES group_chats(id) 
ON DELETE SET NULL;

-- Create chat_participants table
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  keep_chat BOOLEAN DEFAULT false NOT NULL,
  UNIQUE (chat_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE hangout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE hangout_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view all users" 
  ON users FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

-- Create policies for availability table
CREATE POLICY "Users can view all availability" 
  ON availability FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can insert their own availability" 
  ON availability FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own availability" 
  ON availability FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own availability" 
  ON availability FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create policies for hangout_requests table
CREATE POLICY "Users can view all hangout requests" 
  ON hangout_requests FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can insert their own hangout requests" 
  ON hangout_requests FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own hangout requests" 
  ON hangout_requests FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own hangout requests" 
  ON hangout_requests FOR DELETE 
  TO authenticated 
  USING (auth.uid() = creator_id);

-- Create policies for hangout_participants table
CREATE POLICY "Users can view all hangout participants" 
  ON hangout_participants FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can insert hangout participants" 
  ON hangout_participants FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hangout_requests 
      WHERE id = hangout_id AND creator_id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Users can update their own participation status" 
  ON hangout_participants FOR UPDATE 
  TO authenticated 
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM hangout_requests 
      WHERE id = hangout_id AND creator_id = auth.uid()
    )
  );

-- Create policies for group_chats table
CREATE POLICY "Users can view group chats they are part of" 
  ON group_chats FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can insert group chats" 
  ON group_chats FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hangout_requests 
      WHERE id = hangout_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "Pro users can update group chat expiry" 
  ON group_chats FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_pro = true
    ) AND 
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_id = id AND user_id = auth.uid()
    )
  );

-- Create policies for chat_participants table
CREATE POLICY "Users can view chat participants for their chats" 
  ON chat_participants FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants cp 
      WHERE cp.chat_id = chat_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chat participants for chats they created" 
  ON chat_participants FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_chats gc
      JOIN hangout_requests hr ON gc.hangout_id = hr.id
      WHERE gc.id = chat_id AND hr.creator_id = auth.uid()
    ) OR 
    user_id = auth.uid()
  );

CREATE POLICY "Users can update their own chat participant settings" 
  ON chat_participants FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Create policies for messages table
CREATE POLICY "Users can view messages in chats they are part of" 
  ON messages FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_id = messages.chat_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in chats they are part of" 
  ON messages FOR INSERT 
  TO authenticated 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_id = messages.chat_id AND user_id = auth.uid()
    )
  );

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'username', REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', '')),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to check if a chat should be deleted
CREATE OR REPLACE FUNCTION check_chat_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- If all participants with is_pro=true have keep_chat=true, make the chat permanent
  IF EXISTS (
    SELECT 1 FROM chat_participants cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.chat_id = NEW.chat_id
    AND u.is_pro = true
    AND cp.keep_chat = true
    GROUP BY cp.chat_id
    HAVING COUNT(*) = (
      SELECT COUNT(*) FROM chat_participants
      WHERE chat_id = NEW.chat_id
    )
  ) THEN
    UPDATE group_chats
    SET is_permanent = true
    WHERE id = NEW.chat_id;
  ELSE
    UPDATE group_chats
    SET is_permanent = false
    WHERE id = NEW.chat_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for chat expiry check
CREATE TRIGGER on_chat_participant_update
  AFTER UPDATE OF keep_chat ON chat_participants
  FOR EACH ROW
  EXECUTE FUNCTION check_chat_expiry();

-- Create function to delete expired chats
CREATE OR REPLACE FUNCTION delete_expired_chats()
RETURNS void AS $$
BEGIN
  DELETE FROM group_chats
  WHERE is_permanent = false AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;