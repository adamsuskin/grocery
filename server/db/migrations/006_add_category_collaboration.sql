-- =====================================================
-- Migration: Add Category Collaboration Features
-- Description: Adds fields and tables for category collaboration
-- =====================================================

-- =====================================================
-- PHASE 1: Add Collaboration Fields to custom_categories
-- =====================================================

-- Add is_locked field to prevent editing/deletion by non-owners
ALTER TABLE custom_categories
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- Add last_edited_by to track who last modified the category
ALTER TABLE custom_categories
ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_custom_categories_is_locked ON custom_categories(is_locked);
CREATE INDEX IF NOT EXISTS idx_custom_categories_last_edited_by ON custom_categories(last_edited_by);

COMMENT ON COLUMN custom_categories.is_locked IS 'Whether the category is locked (only owner can edit/delete)';
COMMENT ON COLUMN custom_categories.last_edited_by IS 'User who last edited this category (NULL if never edited)';

-- =====================================================
-- PHASE 2: Create Category Suggestions Table
-- =====================================================

-- Category suggestions table for viewers to suggest new categories
CREATE TABLE IF NOT EXISTS category_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  suggested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7),
  icon VARCHAR(50),
  reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT suggestion_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT suggestion_name_max_length CHECK (LENGTH(name) <= 100),
  CONSTRAINT valid_suggestion_status CHECK (
    status IN ('pending', 'approved', 'rejected')
  )
);

-- Create indexes for category_suggestions
CREATE INDEX IF NOT EXISTS idx_category_suggestions_list_id ON category_suggestions(list_id);
CREATE INDEX IF NOT EXISTS idx_category_suggestions_suggested_by ON category_suggestions(suggested_by);
CREATE INDEX IF NOT EXISTS idx_category_suggestions_status ON category_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_category_suggestions_list_status ON category_suggestions(list_id, status);
CREATE INDEX IF NOT EXISTS idx_category_suggestions_created_at ON category_suggestions(created_at DESC);

COMMENT ON TABLE category_suggestions IS 'Category suggestions from viewers for approval by owners/editors';
COMMENT ON COLUMN category_suggestions.id IS 'Unique suggestion identifier (UUID)';
COMMENT ON COLUMN category_suggestions.list_id IS 'List this suggestion belongs to';
COMMENT ON COLUMN category_suggestions.suggested_by IS 'User who suggested the category';
COMMENT ON COLUMN category_suggestions.name IS 'Suggested category name';
COMMENT ON COLUMN category_suggestions.color IS 'Suggested hex color code';
COMMENT ON COLUMN category_suggestions.icon IS 'Suggested emoji or icon identifier';
COMMENT ON COLUMN category_suggestions.reason IS 'Reason for suggesting this category';
COMMENT ON COLUMN category_suggestions.status IS 'Status: pending, approved, or rejected';
COMMENT ON COLUMN category_suggestions.reviewed_by IS 'User who reviewed the suggestion (owner or editor)';
COMMENT ON COLUMN category_suggestions.reviewed_at IS 'When the suggestion was reviewed';

-- Trigger to automatically update updated_at on category_suggestions table
CREATE TRIGGER update_category_suggestions_updated_at
  BEFORE UPDATE ON category_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PHASE 3: Create Category Comments Table
-- =====================================================

-- Category comments table for discussions
CREATE TABLE IF NOT EXISTS category_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES custom_categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  parent_id UUID REFERENCES category_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT comment_text_not_empty CHECK (LENGTH(TRIM(comment_text)) > 0),
  CONSTRAINT comment_text_max_length CHECK (LENGTH(comment_text) <= 1000)
);

-- Create indexes for category_comments
CREATE INDEX IF NOT EXISTS idx_category_comments_category_id ON category_comments(category_id);
CREATE INDEX IF NOT EXISTS idx_category_comments_user_id ON category_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_category_comments_parent_id ON category_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_category_comments_created_at ON category_comments(created_at DESC);

COMMENT ON TABLE category_comments IS 'Comments and discussions on categories';
COMMENT ON COLUMN category_comments.id IS 'Unique comment identifier (UUID)';
COMMENT ON COLUMN category_comments.category_id IS 'Category this comment belongs to';
COMMENT ON COLUMN category_comments.user_id IS 'User who posted the comment';
COMMENT ON COLUMN category_comments.comment_text IS 'Comment text content (max 1000 chars)';
COMMENT ON COLUMN category_comments.parent_id IS 'Parent comment ID for threaded discussions (NULL for top-level)';

-- Trigger to automatically update updated_at on category_comments table
CREATE TRIGGER update_category_comments_updated_at
  BEFORE UPDATE ON category_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PHASE 4: Create Category Votes Table
-- =====================================================

-- Category votes table for voting to keep/remove categories
CREATE TABLE IF NOT EXISTS category_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES custom_categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Unique constraint: one vote per user per category
  CONSTRAINT unique_vote_per_user_category UNIQUE (category_id, user_id),

  -- Constraint: vote_type must be 'keep' or 'remove'
  CONSTRAINT valid_vote_type CHECK (
    vote_type IN ('keep', 'remove')
  )
);

-- Create indexes for category_votes
CREATE INDEX IF NOT EXISTS idx_category_votes_category_id ON category_votes(category_id);
CREATE INDEX IF NOT EXISTS idx_category_votes_user_id ON category_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_category_votes_vote_type ON category_votes(vote_type);

COMMENT ON TABLE category_votes IS 'Votes to keep or remove categories';
COMMENT ON COLUMN category_votes.id IS 'Unique vote identifier (UUID)';
COMMENT ON COLUMN category_votes.category_id IS 'Category being voted on';
COMMENT ON COLUMN category_votes.user_id IS 'User who cast the vote';
COMMENT ON COLUMN category_votes.vote_type IS 'Vote type: keep or remove';

-- Trigger to automatically update updated_at on category_votes table
CREATE TRIGGER update_category_votes_updated_at
  BEFORE UPDATE ON category_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PHASE 5: Create Category Suggestion Votes Table
-- =====================================================

-- Category suggestion votes table for voting on suggestions
CREATE TABLE IF NOT EXISTS category_suggestion_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES category_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Unique constraint: one vote per user per suggestion
  CONSTRAINT unique_vote_per_user_suggestion UNIQUE (suggestion_id, user_id),

  -- Constraint: vote_type must be 'upvote' or 'downvote'
  CONSTRAINT valid_suggestion_vote_type CHECK (
    vote_type IN ('upvote', 'downvote')
  )
);

-- Create indexes for category_suggestion_votes
CREATE INDEX IF NOT EXISTS idx_category_suggestion_votes_suggestion_id ON category_suggestion_votes(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_category_suggestion_votes_user_id ON category_suggestion_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_category_suggestion_votes_vote_type ON category_suggestion_votes(vote_type);

COMMENT ON TABLE category_suggestion_votes IS 'Votes on category suggestions';
COMMENT ON COLUMN category_suggestion_votes.id IS 'Unique vote identifier (UUID)';
COMMENT ON COLUMN category_suggestion_votes.suggestion_id IS 'Suggestion being voted on';
COMMENT ON COLUMN category_suggestion_votes.user_id IS 'User who cast the vote';
COMMENT ON COLUMN category_suggestion_votes.vote_type IS 'Vote type: upvote or downvote';

-- =====================================================
-- PHASE 6: Add Category Actions to list_activities
-- =====================================================

-- Update the list_activities constraint to include category actions
ALTER TABLE list_activities DROP CONSTRAINT IF EXISTS valid_activity_action;

ALTER TABLE list_activities ADD CONSTRAINT valid_activity_action CHECK (
  action IN (
    'list_created',
    'list_renamed',
    'list_deleted',
    'list_archived',
    'list_unarchived',
    'list_shared',
    'member_added',
    'member_removed',
    'member_permission_changed',
    'item_added',
    'item_updated',
    'item_deleted',
    'item_checked',
    'item_unchecked',
    'items_cleared',
    'items_bulk_deleted',
    'category_created',
    'category_edited',
    'category_deleted',
    'category_locked',
    'category_unlocked',
    'category_suggested',
    'category_suggestion_approved',
    'category_suggestion_rejected',
    'category_comment_added',
    'category_voted'
  )
);

-- =====================================================
-- PHASE 7: Create Helper Views
-- =====================================================

-- View for category suggestions with details
CREATE OR REPLACE VIEW category_suggestions_with_details AS
SELECT
  cs.id,
  cs.list_id,
  cs.suggested_by,
  cs.name,
  cs.color,
  cs.icon,
  cs.reason,
  cs.status,
  cs.reviewed_by,
  cs.reviewed_at,
  cs.created_at,
  cs.updated_at,
  suggester.name AS suggester_name,
  suggester.email AS suggester_email,
  reviewer.name AS reviewer_name,
  reviewer.email AS reviewer_email,
  l.name AS list_name,
  (SELECT COUNT(*) FROM category_suggestion_votes WHERE suggestion_id = cs.id AND vote_type = 'upvote') AS upvotes,
  (SELECT COUNT(*) FROM category_suggestion_votes WHERE suggestion_id = cs.id AND vote_type = 'downvote') AS downvotes
FROM category_suggestions cs
JOIN users suggester ON cs.suggested_by = suggester.id
LEFT JOIN users reviewer ON cs.reviewed_by = reviewer.id
JOIN lists l ON cs.list_id = l.id;

COMMENT ON VIEW category_suggestions_with_details IS 'Category suggestions with user details and vote counts';

-- View for category votes summary
CREATE OR REPLACE VIEW category_votes_summary AS
SELECT
  cc.id AS category_id,
  cc.name AS category_name,
  cc.list_id,
  (SELECT COUNT(*) FROM category_votes WHERE category_id = cc.id AND vote_type = 'keep') AS keep_votes,
  (SELECT COUNT(*) FROM category_votes WHERE category_id = cc.id AND vote_type = 'remove') AS remove_votes,
  (SELECT COUNT(*) FROM category_votes WHERE category_id = cc.id) AS total_votes
FROM custom_categories cc;

COMMENT ON VIEW category_votes_summary IS 'Summary of votes for each category';

-- =====================================================
-- PHASE 8: Create Helper Functions
-- =====================================================

-- Function to check if user can edit a category (respects locking)
CREATE OR REPLACE FUNCTION user_can_edit_category(
  p_user_id UUID,
  p_category_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_list_id UUID;
  v_is_locked BOOLEAN;
  v_list_owner_id UUID;
  v_permission VARCHAR(20);
BEGIN
  -- Get category details
  SELECT list_id, is_locked INTO v_list_id, v_is_locked
  FROM custom_categories
  WHERE id = p_category_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Get list owner
  SELECT owner_id INTO v_list_owner_id
  FROM lists
  WHERE id = v_list_id;

  -- Owner can always edit
  IF v_list_owner_id = p_user_id THEN
    RETURN TRUE;
  END IF;

  -- If locked, only owner can edit
  IF v_is_locked THEN
    RETURN FALSE;
  END IF;

  -- Check if user has editor permission
  SELECT permission_level INTO v_permission
  FROM list_members
  WHERE list_id = v_list_id AND user_id = p_user_id;

  RETURN v_permission = 'editor' OR v_permission = 'owner';
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION user_can_edit_category IS 'Check if a user can edit a category (respects locking)';

-- Function to approve category suggestion and create category
CREATE OR REPLACE FUNCTION approve_category_suggestion(
  p_suggestion_id UUID,
  p_reviewed_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_suggestion RECORD;
  v_category_id UUID;
  v_has_permission BOOLEAN;
BEGIN
  -- Get suggestion details
  SELECT * INTO v_suggestion
  FROM category_suggestions
  WHERE id = p_suggestion_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Suggestion not found';
  END IF;

  IF v_suggestion.status != 'pending' THEN
    RAISE EXCEPTION 'Suggestion has already been reviewed';
  END IF;

  -- Check if reviewer has owner or editor permission
  SELECT get_user_list_permission(p_reviewed_by, v_suggestion.list_id) IN ('owner', 'editor')
  INTO v_has_permission;

  IF NOT v_has_permission THEN
    RAISE EXCEPTION 'User does not have permission to approve suggestions';
  END IF;

  -- Create the category
  INSERT INTO custom_categories (
    id, name, list_id, created_by, color, icon, display_order, is_archived, archived_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_suggestion.name,
    v_suggestion.list_id,
    v_suggestion.suggested_by,
    v_suggestion.color,
    v_suggestion.icon,
    0,
    FALSE,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_category_id;

  -- Update suggestion status
  UPDATE category_suggestions
  SET status = 'approved',
      reviewed_by = p_reviewed_by,
      reviewed_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_suggestion_id;

  -- Log activity
  PERFORM log_list_activity(
    v_suggestion.list_id,
    p_reviewed_by,
    'category_suggestion_approved',
    jsonb_build_object(
      'suggestion_id', p_suggestion_id,
      'category_id', v_category_id,
      'category_name', v_suggestion.name,
      'suggested_by', v_suggestion.suggested_by
    )
  );

  RETURN v_category_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION approve_category_suggestion IS 'Approve a category suggestion and create the category';

-- Function to reject category suggestion
CREATE OR REPLACE FUNCTION reject_category_suggestion(
  p_suggestion_id UUID,
  p_reviewed_by UUID
)
RETURNS VOID AS $$
DECLARE
  v_suggestion RECORD;
  v_has_permission BOOLEAN;
BEGIN
  -- Get suggestion details
  SELECT * INTO v_suggestion
  FROM category_suggestions
  WHERE id = p_suggestion_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Suggestion not found';
  END IF;

  IF v_suggestion.status != 'pending' THEN
    RAISE EXCEPTION 'Suggestion has already been reviewed';
  END IF;

  -- Check if reviewer has owner or editor permission
  SELECT get_user_list_permission(p_reviewed_by, v_suggestion.list_id) IN ('owner', 'editor')
  INTO v_has_permission;

  IF NOT v_has_permission THEN
    RAISE EXCEPTION 'User does not have permission to reject suggestions';
  END IF;

  -- Update suggestion status
  UPDATE category_suggestions
  SET status = 'rejected',
      reviewed_by = p_reviewed_by,
      reviewed_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_suggestion_id;

  -- Log activity
  PERFORM log_list_activity(
    v_suggestion.list_id,
    p_reviewed_by,
    'category_suggestion_rejected',
    jsonb_build_object(
      'suggestion_id', p_suggestion_id,
      'category_name', v_suggestion.name,
      'suggested_by', v_suggestion.suggested_by
    )
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reject_category_suggestion IS 'Reject a category suggestion';

-- =====================================================
-- Migration Complete
-- =====================================================
