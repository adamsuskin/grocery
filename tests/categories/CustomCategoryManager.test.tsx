/**
 * Unit Tests for CustomCategoryManager Component
 *
 * Tests the CustomCategoryManager React component including:
 * - Rendering categories
 * - Adding new categories
 * - Editing existing categories
 * - Deleting categories
 * - Validation and error handling
 * - User interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomCategoryManager } from '../../src/components/CustomCategoryManager';
import type { CustomCategory } from '../../src/types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock custom category hooks
const mockAddCustomCategory = vi.fn();
const mockUpdateCustomCategory = vi.fn();
const mockDeleteCustomCategory = vi.fn();
const mockUseCustomCategories = vi.fn();

vi.mock('../../src/hooks/useCustomCategories', () => ({
  useCustomCategories: () => mockUseCustomCategories(),
  useCustomCategoryMutations: () => ({
    addCustomCategory: mockAddCustomCategory,
    updateCustomCategory: mockUpdateCustomCategory,
    deleteCustomCategory: mockDeleteCustomCategory,
  }),
}));

// =============================================================================
// TEST DATA
// =============================================================================

const mockCategories: CustomCategory[] = [
  {
    id: 'cat-1',
    name: 'Snacks',
    listId: 'list-123',
    createdBy: 'user-1',
    color: '#FF5733',
    icon: '🍿',
    createdAt: 1000,
    updatedAt: 1000,
  },
  {
    id: 'cat-2',
    name: 'Cleaning',
    listId: 'list-123',
    createdBy: 'user-1',
    color: '#2196F3',
    icon: '🧹',
    createdAt: 2000,
    updatedAt: 2000,
  },
  {
    id: 'cat-3',
    name: 'Pet Supplies',
    listId: 'list-123',
    createdBy: 'user-1',
    createdAt: 3000,
    updatedAt: 3000,
  },
];

// =============================================================================
// TEST SETUP
// =============================================================================

const defaultProps = {
  listId: 'list-123',
  onClose: vi.fn(),
};

function renderComponent(props = {}) {
  return render(<CustomCategoryManager {...defaultProps} {...props} />);
}

// =============================================================================
// TESTS: Component Rendering
// =============================================================================

describe('CustomCategoryManager - Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCustomCategories.mockReturnValue(mockCategories);
  });

  it('should render the component', () => {
    renderComponent();

    expect(
      screen.getByRole('heading', { name: /manage custom categories/i })
    ).toBeInTheDocument();
  });

  it('should display predefined categories section', () => {
    renderComponent();

    expect(
      screen.getByRole('heading', { name: /predefined categories/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/built-in categories/i)).toBeInTheDocument();
  });

  it('should display all predefined categories', () => {
    renderComponent();

    const predefinedCategories = [
      'Produce',
      'Dairy',
      'Meat',
      'Bakery',
      'Pantry',
      'Frozen',
      'Beverages',
      'Other',
    ];

    predefinedCategories.forEach((category) => {
      expect(screen.getByText(category)).toBeInTheDocument();
    });
  });

  it('should display custom categories section', () => {
    renderComponent();

    expect(
      screen.getByRole('heading', { name: /your custom categories/i })
    ).toBeInTheDocument();
  });

  it('should display all custom categories', () => {
    renderComponent();

    expect(screen.getByText('Snacks')).toBeInTheDocument();
    expect(screen.getByText('Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Pet Supplies')).toBeInTheDocument();
  });

  it('should display category icons and colors', () => {
    renderComponent();

    expect(screen.getByText('🍿')).toBeInTheDocument();
    expect(screen.getByText('🧹')).toBeInTheDocument();
  });

  it('should show empty state when no custom categories', () => {
    mockUseCustomCategories.mockReturnValue([]);
    renderComponent();

    expect(screen.getByText(/no custom categories yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/create your first custom category/i)
    ).toBeInTheDocument();
  });

  it('should display add category form', () => {
    renderComponent();

    expect(
      screen.getByRole('heading', { name: /add new category/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/category name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/icon/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/color/i)).toBeInTheDocument();
  });

  it('should have close button', () => {
    renderComponent();

    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });
});

// =============================================================================
// TESTS: Adding Categories
// =============================================================================

describe('CustomCategoryManager - Adding Categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCustomCategories.mockReturnValue(mockCategories);
    mockAddCustomCategory.mockResolvedValue(undefined);
  });

  it('should add a new category with name only', async () => {
    const user = userEvent.setup();
    renderComponent();

    const nameInput = screen.getByLabelText(/category name/i);
    await user.type(nameInput, 'Spices');

    const addButton = screen.getByRole('button', { name: /add category/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(mockAddCustomCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Spices',
          listId: 'list-123',
        })
      );
    });
  });

  it('should add a category with name, color, and icon', async () => {
    const user = userEvent.setup();
    renderComponent();

    const nameInput = screen.getByLabelText(/category name/i);
    const iconInput = screen.getByLabelText(/icon/i);
    const colorInput = screen.getByLabelText(/color/i);

    await user.type(nameInput, 'Spices');
    await user.type(iconInput, '🌶️');
    await user.clear(colorInput);
    await user.type(colorInput, '#FF5733');

    const addButton = screen.getByRole('button', { name: /add category/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(mockAddCustomCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Spices',
          listId: 'list-123',
          color: '#FF5733',
          icon: '🌶️',
        })
      );
    });
  });

  it('should clear form after successful addition', async () => {
    const user = userEvent.setup();
    renderComponent();

    const nameInput = screen.getByLabelText(/category name/i) as HTMLInputElement;
    const iconInput = screen.getByLabelText(/icon/i) as HTMLInputElement;

    await user.type(nameInput, 'Spices');
    await user.type(iconInput, '🌶️');

    const addButton = screen.getByRole('button', { name: /add category/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(nameInput.value).toBe('');
      expect(iconInput.value).toBe('');
    });
  });

  it('should show success message after adding', async () => {
    const user = userEvent.setup();
    renderComponent();

    const nameInput = screen.getByLabelText(/category name/i);
    await user.type(nameInput, 'Spices');

    const addButton = screen.getByRole('button', { name: /add category/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(
        screen.getByText(/category added successfully/i)
      ).toBeInTheDocument();
    });
  });

  it('should show error for empty name', async () => {
    const user = userEvent.setup();
    mockAddCustomCategory.mockRejectedValue(
      new Error('Category name cannot be empty')
    );
    renderComponent();

    const addButton = screen.getByRole('button', { name: /add category/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(
        screen.getByText(/category name cannot be empty/i)
      ).toBeInTheDocument();
    });
  });

  it('should show error for duplicate name', async () => {
    const user = userEvent.setup();
    mockAddCustomCategory.mockRejectedValue(
      new Error('A category with this name already exists')
    );
    renderComponent();

    const nameInput = screen.getByLabelText(/category name/i);
    await user.type(nameInput, 'Snacks');

    const addButton = screen.getByRole('button', { name: /add category/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(
        screen.getByText(/a category with this name already exists/i)
      ).toBeInTheDocument();
    });
  });

  it('should show error for predefined category name', async () => {
    const user = userEvent.setup();
    mockAddCustomCategory.mockRejectedValue(
      new Error('Cannot use predefined category names')
    );
    renderComponent();

    const nameInput = screen.getByLabelText(/category name/i);
    await user.type(nameInput, 'Produce');

    const addButton = screen.getByRole('button', { name: /add category/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(
        screen.getByText(/cannot use predefined category names/i)
      ).toBeInTheDocument();
    });
  });

  it('should disable form while adding', async () => {
    const user = userEvent.setup();
    mockAddCustomCategory.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    renderComponent();

    const nameInput = screen.getByLabelText(/category name/i);
    const addButton = screen.getByRole('button', { name: /add category/i });

    await user.type(nameInput, 'Spices');
    await user.click(addButton);

    expect(nameInput).toBeDisabled();
    expect(addButton).toBeDisabled();
    expect(screen.getByText(/adding\.\.\./i)).toBeInTheDocument();

    await waitFor(() => {
      expect(nameInput).not.toBeDisabled();
    });
  });
});

// =============================================================================
// TESTS: Editing Categories
// =============================================================================

describe('CustomCategoryManager - Editing Categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCustomCategories.mockReturnValue(mockCategories);
    mockUpdateCustomCategory.mockResolvedValue(undefined);
  });

  it('should enter edit mode when clicking edit button', async () => {
    const user = userEvent.setup();
    renderComponent();

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    expect(screen.getByDisplayValue('Snacks')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should exit edit mode when clicking cancel', async () => {
    const user = userEvent.setup();
    renderComponent();

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(screen.queryByDisplayValue('Snacks')).not.toBeInTheDocument();
  });

  it('should update category name', async () => {
    const user = userEvent.setup();
    renderComponent();

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    const nameInput = screen.getByDisplayValue('Snacks');
    await user.clear(nameInput);
    await user.type(nameInput, 'Healthy Snacks');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateCustomCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'cat-1',
          name: 'Healthy Snacks',
        })
      );
    });
  });

  it('should update category color', async () => {
    const user = userEvent.setup();
    renderComponent();

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    // Find the color input in edit mode
    const colorInputs = screen.getAllByDisplayValue('#FF5733');
    const editColorInput = colorInputs[0]; // First one should be in edit form
    await user.clear(editColorInput);
    await user.type(editColorInput, '#4CAF50');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateCustomCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'cat-1',
          color: '#4CAF50',
        })
      );
    });
  });

  it('should update category icon', async () => {
    const user = userEvent.setup();
    renderComponent();

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    const iconInput = screen.getByDisplayValue('🍿');
    await user.clear(iconInput);
    await user.type(iconInput, '🥜');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateCustomCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'cat-1',
          icon: '🥜',
        })
      );
    });
  });

  it('should show success message after updating', async () => {
    const user = userEvent.setup();
    renderComponent();

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    const nameInput = screen.getByDisplayValue('Snacks');
    await user.clear(nameInput);
    await user.type(nameInput, 'Healthy Snacks');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText(/category updated successfully/i)
      ).toBeInTheDocument();
    });
  });

  it('should show error for empty name during edit', async () => {
    const user = userEvent.setup();
    renderComponent();

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    const nameInput = screen.getByDisplayValue('Snacks');
    await user.clear(nameInput);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText(/category name cannot be empty/i)
      ).toBeInTheDocument();
    });
  });

  it('should show error for duplicate name during edit', async () => {
    const user = userEvent.setup();
    renderComponent();

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    const nameInput = screen.getByDisplayValue('Snacks');
    await user.clear(nameInput);
    await user.type(nameInput, 'Cleaning'); // Duplicate with cat-2

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText(/a category with this name already exists/i)
      ).toBeInTheDocument();
    });
  });

  it('should exit edit mode after successful update', async () => {
    const user = userEvent.setup();
    renderComponent();

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    const nameInput = screen.getByDisplayValue('Snacks');
    await user.clear(nameInput);
    await user.type(nameInput, 'Healthy Snacks');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.queryByDisplayValue('Healthy Snacks')).not.toBeInTheDocument();
    });
  });
});

// =============================================================================
// TESTS: Deleting Categories
// =============================================================================

describe('CustomCategoryManager - Deleting Categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCustomCategories.mockReturnValue(mockCategories);
    mockDeleteCustomCategory.mockResolvedValue(undefined);
  });

  it('should show confirmation dialog when clicking delete', async () => {
    const user = userEvent.setup();
    renderComponent();

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/delete category\?/i)).toBeInTheDocument();
      expect(
        screen.getByText(/are you sure you want to delete/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/"Snacks"/)).toBeInTheDocument();
    });
  });

  it('should cancel delete when clicking cancel', async () => {
    const user = userEvent.setup();
    renderComponent();

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText(/delete category\?/i)).not.toBeInTheDocument();
    });
    expect(mockDeleteCustomCategory).not.toHaveBeenCalled();
  });

  it('should delete category when confirming', async () => {
    const user = userEvent.setup();
    renderComponent();

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    const confirmButton = screen.getByRole('button', {
      name: /delete category/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteCustomCategory).toHaveBeenCalledWith('cat-1');
    });
  });

  it('should show success message after deleting', async () => {
    const user = userEvent.setup();
    renderComponent();

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    const confirmButton = screen.getByRole('button', {
      name: /delete category/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(
        screen.getByText(/category deleted successfully/i)
      ).toBeInTheDocument();
    });
  });

  it('should show warning about items using the category', async () => {
    const user = userEvent.setup();
    renderComponent();

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(
      screen.getByText(/items using this category will still be visible/i)
    ).toBeInTheDocument();
  });

  it('should disable buttons while deleting', async () => {
    const user = userEvent.setup();
    mockDeleteCustomCategory.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    renderComponent();

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    const confirmButton = screen.getByRole('button', {
      name: /delete category/i,
    });
    await user.click(confirmButton);

    expect(confirmButton).toBeDisabled();
    expect(screen.getByText(/deleting\.\.\./i)).toBeInTheDocument();

    await waitFor(() => {
      expect(confirmButton).not.toBeDisabled();
    });
  });

  it('should show error if delete fails', async () => {
    const user = userEvent.setup();
    mockDeleteCustomCategory.mockRejectedValue(
      new Error('Failed to delete category')
    );
    renderComponent();

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    const confirmButton = screen.getByRole('button', {
      name: /delete category/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(
        screen.getByText(/failed to delete category/i)
      ).toBeInTheDocument();
    });
  });
});

// =============================================================================
// TESTS: Modal Interactions
// =============================================================================

describe('CustomCategoryManager - Modal Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCustomCategories.mockReturnValue(mockCategories);
  });

  it('should call onClose when clicking close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CustomCategoryManager listId="list-123" onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when clicking overlay', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CustomCategoryManager listId="list-123" onClose={onClose} />);

    const overlay = screen.getByText(/manage custom categories/i).parentElement
      ?.parentElement;
    if (overlay) {
      await user.click(overlay);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('should not close when clicking inside modal', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CustomCategoryManager listId="list-123" onClose={onClose} />);

    const modal = screen.getByText(/manage custom categories/i).parentElement;
    if (modal) {
      await user.click(modal);
      expect(onClose).not.toHaveBeenCalled();
    }
  });

  it('should handle escape key to close modal', () => {
    const onClose = vi.fn();
    renderComponent({ onClose });

    // Simulate Escape key
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escapeEvent);

    expect(onClose).toHaveBeenCalled();
  });

  it('should not close on escape when delete dialog is open', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderComponent({ onClose });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    // Simulate Escape key
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escapeEvent);

    expect(onClose).not.toHaveBeenCalled();
  });
});

// =============================================================================
// TESTS: Message Handling
// =============================================================================

describe('CustomCategoryManager - Message Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCustomCategories.mockReturnValue(mockCategories);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should auto-hide success message after 5 seconds', async () => {
    const user = userEvent.setup({ delay: null });
    mockAddCustomCategory.mockResolvedValue(undefined);
    renderComponent();

    const nameInput = screen.getByLabelText(/category name/i);
    await user.type(nameInput, 'Spices');

    const addButton = screen.getByRole('button', { name: /add category/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(
        screen.getByText(/category added successfully/i)
      ).toBeInTheDocument();
    });

    // Fast-forward time by 5 seconds
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(
        screen.queryByText(/category added successfully/i)
      ).not.toBeInTheDocument();
    });
  });

  it('should auto-hide error message after 5 seconds', async () => {
    const user = userEvent.setup({ delay: null });
    mockAddCustomCategory.mockRejectedValue(new Error('Test error'));
    renderComponent();

    const nameInput = screen.getByLabelText(/category name/i);
    await user.type(nameInput, 'Invalid');

    const addButton = screen.getByRole('button', { name: /add category/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/test error/i)).toBeInTheDocument();
    });

    // Fast-forward time by 5 seconds
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(screen.queryByText(/test error/i)).not.toBeInTheDocument();
    });
  });
});
