/**
 * Category Collaboration Hooks
 *
 * Provides hooks for category collaboration features including:
 * - Category suggestions
 * - Category comments
 * - Category votes
 * - Category locking
 * - Real-time synchronization
 */

import { useQuery } from '@rocicorp/zero/react';
import { nanoid } from 'nanoid';
import { useMemo } from 'react';
import { getZeroInstance } from '../zero-store';
import type {
  CategorySuggestion,
  CreateCategorySuggestionInput,
  ReviewCategorySuggestionInput,
  CategoryComment,
  CreateCategoryCommentInput,
  CategoryVote,
  CastCategoryVoteInput,
  CategorySuggestionVote,
  VoteSuggestionInput,
} from '../types';

/**
 * Hook to query category suggestions for a list
 */
export function useCategorySuggestions(listId: string, status?: 'pending' | 'approved' | 'rejected') {
  const zero = getZeroInstance();

  let baseQuery = zero.query.category_suggestions.where('list_id', listId);

  if (status) {
    baseQuery = baseQuery.where('status', status) as any;
  }

  const query = useQuery(baseQuery as any);

  const suggestions = useMemo(() => {
    return (query as any[]).map((s: any) => ({
      id: s.id,
      listId: s.list_id,
      suggestedBy: s.suggested_by,
      name: s.name,
      color: s.color || undefined,
      icon: s.icon || undefined,
      reason: s.reason || undefined,
      status: s.status,
      reviewedBy: s.reviewed_by || undefined,
      reviewedAt: s.reviewed_at || undefined,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }, [query]);

  return suggestions;
}

/**
 * Hook for category suggestion mutations
 */
export function useCategorySuggestionMutations() {
  const zero = getZeroInstance();

  const getCurrentUserId = (): string => {
    return (zero as any).userID || 'demo-user';
  };

  /**
   * Create a new category suggestion
   */
  const suggestCategory = async (input: CreateCategorySuggestionInput): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to suggest categories');
    }

    if (!input.name || input.name.trim() === '') {
      throw new Error('Category name is required');
    }

    if (!input.listId || input.listId.trim() === '') {
      throw new Error('List ID is required');
    }

    const id = nanoid();
    const now = Date.now();

    try {
      await zero.mutate.category_suggestions.create({
        id,
        list_id: input.listId,
        suggested_by: currentUserId,
        name: input.name.trim(),
        color: input.color || '',
        icon: input.icon || '',
        reason: input.reason || '',
        status: 'pending',
        reviewed_by: '',
        reviewed_at: 0,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      console.error('[useCategorySuggestionMutations] Error creating suggestion:', error);
      throw new Error('Failed to create category suggestion');
    }
  };

  /**
   * Review a category suggestion (approve or reject)
   */
  const reviewSuggestion = async (input: ReviewCategorySuggestionInput): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to review suggestions');
    }

    if (!input.suggestionId || input.suggestionId.trim() === '') {
      throw new Error('Suggestion ID is required');
    }

    const now = Date.now();

    try {
      await zero.mutate.category_suggestions.update({
        id: input.suggestionId,
        status: input.action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: currentUserId,
        reviewed_at: now,
        updatedAt: now,
      });
    } catch (error) {
      console.error('[useCategorySuggestionMutations] Error reviewing suggestion:', error);
      throw new Error('Failed to review category suggestion');
    }
  };

  /**
   * Delete a category suggestion
   */
  const deleteSuggestion = async (suggestionId: string): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to delete suggestions');
    }

    if (!suggestionId || suggestionId.trim() === '') {
      throw new Error('Suggestion ID is required');
    }

    try {
      await zero.mutate.category_suggestions.delete({ id: suggestionId });
    } catch (error) {
      console.error('[useCategorySuggestionMutations] Error deleting suggestion:', error);
      throw new Error('Failed to delete category suggestion');
    }
  };

  return {
    suggestCategory,
    reviewSuggestion,
    deleteSuggestion,
  };
}

/**
 * Hook to query category comments
 */
export function useCategoryComments(categoryId: string) {
  const zero = getZeroInstance();

  const query = useQuery(
    zero.query.category_comments.where('category_id', categoryId) as any
  );

  const comments = useMemo(() => {
    return (query as any[])
      .map((c: any) => ({
        id: c.id,
        categoryId: c.category_id,
        userId: c.user_id,
        commentText: c.comment_text,
        parentId: c.parent_id || undefined,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }))
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [query]);

  return comments;
}

/**
 * Hook for category comment mutations
 */
export function useCategoryCommentMutations() {
  const zero = getZeroInstance();

  const getCurrentUserId = (): string => {
    return (zero as any).userID || 'demo-user';
  };

  /**
   * Add a comment to a category
   */
  const addComment = async (input: CreateCategoryCommentInput): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to add comments');
    }

    if (!input.commentText || input.commentText.trim() === '') {
      throw new Error('Comment text is required');
    }

    if (input.commentText.length > 1000) {
      throw new Error('Comment text must be 1000 characters or less');
    }

    const id = nanoid();
    const now = Date.now();

    try {
      await zero.mutate.category_comments.create({
        id,
        category_id: input.categoryId,
        user_id: currentUserId,
        comment_text: input.commentText.trim(),
        parent_id: input.parentId || '',
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      console.error('[useCategoryCommentMutations] Error creating comment:', error);
      throw new Error('Failed to add comment');
    }
  };

  /**
   * Update a comment
   */
  const updateComment = async (commentId: string, commentText: string): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to update comments');
    }

    if (!commentText || commentText.trim() === '') {
      throw new Error('Comment text is required');
    }

    if (commentText.length > 1000) {
      throw new Error('Comment text must be 1000 characters or less');
    }

    try {
      await zero.mutate.category_comments.update({
        id: commentId,
        comment_text: commentText.trim(),
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('[useCategoryCommentMutations] Error updating comment:', error);
      throw new Error('Failed to update comment');
    }
  };

  /**
   * Delete a comment
   */
  const deleteComment = async (commentId: string): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to delete comments');
    }

    try {
      await zero.mutate.category_comments.delete({ id: commentId });
    } catch (error) {
      console.error('[useCategoryCommentMutations] Error deleting comment:', error);
      throw new Error('Failed to delete comment');
    }
  };

  return {
    addComment,
    updateComment,
    deleteComment,
  };
}

/**
 * Hook to query category votes
 */
export function useCategoryVotes(categoryId: string) {
  const zero = getZeroInstance();

  const query = useQuery(
    zero.query.category_votes.where('category_id', categoryId) as any
  );

  const votes = useMemo(() => {
    const allVotes = (query as any[]).map((v: any) => ({
      id: v.id,
      categoryId: v.category_id,
      userId: v.user_id,
      voteType: v.vote_type,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    }));

    const keepVotes = allVotes.filter(v => v.voteType === 'keep').length;
    const removeVotes = allVotes.filter(v => v.voteType === 'remove').length;

    return {
      votes: allVotes,
      keepVotes,
      removeVotes,
      totalVotes: allVotes.length,
    };
  }, [query]);

  return votes;
}

/**
 * Hook for category vote mutations
 */
export function useCategoryVoteMutations() {
  const zero = getZeroInstance();

  const getCurrentUserId = (): string => {
    return (zero as any).userID || 'demo-user';
  };

  /**
   * Cast a vote on a category
   */
  const castVote = async (input: CastCategoryVoteInput): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to vote');
    }

    // Check if user already voted
    const existingVotes = await (zero.query.category_votes
      .where('category_id', input.categoryId)
      .where('user_id', currentUserId) as any).run();

    const now = Date.now();

    try {
      if (existingVotes.length > 0) {
        // Update existing vote
        await zero.mutate.category_votes.update({
          id: existingVotes[0].id,
          vote_type: input.voteType,
          updatedAt: now,
        });
      } else {
        // Create new vote
        const id = nanoid();
        await zero.mutate.category_votes.create({
          id,
          category_id: input.categoryId,
          user_id: currentUserId,
          vote_type: input.voteType,
          createdAt: now,
          updatedAt: now,
        });
      }
    } catch (error) {
      console.error('[useCategoryVoteMutations] Error casting vote:', error);
      throw new Error('Failed to cast vote');
    }
  };

  /**
   * Remove a vote
   */
  const removeVote = async (categoryId: string): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to remove votes');
    }

    const existingVotes = await (zero.query.category_votes
      .where('category_id', categoryId)
      .where('user_id', currentUserId) as any).run();

    if (existingVotes.length === 0) {
      return; // No vote to remove
    }

    try {
      await zero.mutate.category_votes.delete({ id: existingVotes[0].id });
    } catch (error) {
      console.error('[useCategoryVoteMutations] Error removing vote:', error);
      throw new Error('Failed to remove vote');
    }
  };

  return {
    castVote,
    removeVote,
  };
}

/**
 * Hook to query suggestion votes
 */
export function useSuggestionVotes(suggestionId: string) {
  const zero = getZeroInstance();

  const query = useQuery(
    zero.query.category_suggestion_votes.where('suggestion_id', suggestionId) as any
  );

  const votes = useMemo(() => {
    const allVotes = (query as any[]).map((v: any) => ({
      id: v.id,
      suggestionId: v.suggestion_id,
      userId: v.user_id,
      voteType: v.vote_type,
      createdAt: v.createdAt,
    }));

    const upvotes = allVotes.filter(v => v.voteType === 'upvote').length;
    const downvotes = allVotes.filter(v => v.voteType === 'downvote').length;

    return {
      votes: allVotes,
      upvotes,
      downvotes,
      score: upvotes - downvotes,
    };
  }, [query]);

  return votes;
}

/**
 * Hook for suggestion vote mutations
 */
export function useSuggestionVoteMutations() {
  const zero = getZeroInstance();

  const getCurrentUserId = (): string => {
    return (zero as any).userID || 'demo-user';
  };

  /**
   * Vote on a suggestion
   */
  const voteSuggestion = async (input: VoteSuggestionInput): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to vote');
    }

    // Check if user already voted
    const existingVotes = await (zero.query.category_suggestion_votes
      .where('suggestion_id', input.suggestionId)
      .where('user_id', currentUserId) as any).run();

    const now = Date.now();

    try {
      if (existingVotes.length > 0) {
        // Update existing vote
        await zero.mutate.category_suggestion_votes.update({
          id: existingVotes[0].id,
          vote_type: input.voteType,
        });
      } else {
        // Create new vote
        const id = nanoid();
        await zero.mutate.category_suggestion_votes.create({
          id,
          suggestion_id: input.suggestionId,
          user_id: currentUserId,
          vote_type: input.voteType,
          createdAt: now,
        });
      }
    } catch (error) {
      console.error('[useSuggestionVoteMutations] Error voting on suggestion:', error);
      throw new Error('Failed to vote on suggestion');
    }
  };

  /**
   * Remove a vote from a suggestion
   */
  const removeVote = async (suggestionId: string): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to remove votes');
    }

    const existingVotes = await (zero.query.category_suggestion_votes
      .where('suggestion_id', suggestionId)
      .where('user_id', currentUserId) as any).run();

    if (existingVotes.length === 0) {
      return; // No vote to remove
    }

    try {
      await zero.mutate.category_suggestion_votes.delete({ id: existingVotes[0].id });
    } catch (error) {
      console.error('[useSuggestionVoteMutations] Error removing vote:', error);
      throw new Error('Failed to remove vote');
    }
  };

  return {
    voteSuggestion,
    removeVote,
  };
}

/**
 * Hook for category locking operations
 */
export function useCategoryLocking() {
  const zero = getZeroInstance();

  const getCurrentUserId = (): string => {
    return (zero as any).userID || 'demo-user';
  };

  /**
   * Lock a category (only owner can edit)
   */
  const lockCategory = async (categoryId: string): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to lock categories');
    }

    try {
      await zero.mutate.custom_categories.update({
        id: categoryId,
        is_locked: true,
        last_edited_by: currentUserId,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('[useCategoryLocking] Error locking category:', error);
      throw new Error('Failed to lock category');
    }
  };

  /**
   * Unlock a category
   */
  const unlockCategory = async (categoryId: string): Promise<void> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId || currentUserId === 'demo-user') {
      throw new Error('User must be authenticated to unlock categories');
    }

    try {
      await zero.mutate.custom_categories.update({
        id: categoryId,
        is_locked: false,
        last_edited_by: currentUserId,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('[useCategoryLocking] Error unlocking category:', error);
      throw new Error('Failed to unlock category');
    }
  };

  return {
    lockCategory,
    unlockCategory,
  };
}
