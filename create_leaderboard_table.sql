-- Create leaderboard table for Runic Vine game
CREATE TABLE leaderboard (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    accuracy INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX idx_leaderboard_accuracy ON leaderboard(accuracy DESC);
CREATE INDEX idx_leaderboard_created_at ON leaderboard(created_at ASC);

-- Enable Row Level Security (RLS)
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read leaderboard
CREATE POLICY "Anyone can view leaderboard" ON leaderboard
    FOR SELECT USING (true);

-- Create policy to allow anyone to insert scores
CREATE POLICY "Anyone can insert scores" ON leaderboard
    FOR INSERT WITH CHECK (true);