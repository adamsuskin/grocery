// Re-export meal plan hooks from zero-store to maintain the same API
// Replaced mock hooks with real Zero integration
export {
  useMealPlans,
  useMealPlanMutations,
  useMealPlansByDate,
} from '../zero-store';
