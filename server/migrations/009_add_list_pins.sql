-- Migration: Add List Pins Table
-- Description: Add support for pinning favorite lists for quick access
-- Date: 2025-10-26

-- Create list_pins table
CREATE TABLE IF NOT EXISTS list_pins (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Primary key: composite of user_id and list_id
  PRIMARY KEY (user_id, list_id),

  -- Constraints
  CONSTRAINT unique_user_list_pin UNIQUE (user_id, list_id)
);

-- Create indexes for list_pins table
CREATE INDEX IF NOT EXISTS idx_list_pins_user_id ON list_pins(user_id);
CREATE INDEX IF NOT EXISTS idx_list_pins_list_id ON list_pins(list_id);
CREATE INDEX IF NOT EXISTS idx_list_pins_user_pinned_at ON list_pins(user_id, pinned_at DESC);

-- Add comments
COMMENT ON TABLE list_pins IS 'User pinned lists for quick access';
COMMENT ON COLUMN list_pins.user_id IS 'User who pinned the list';
COMMENT ON COLUMN list_pins.list_id IS 'List that was pinned';
COMMENT ON COLUMN list_pins.pinned_at IS 'When the list was pinned';
