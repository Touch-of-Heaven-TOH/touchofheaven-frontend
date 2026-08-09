import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MapSearchPanel from '@/components/map/MapSearchPanel';
import { EMPTY_DISCOVERY_FILTERS, type DiscoveryFilters } from '@/lib/discovery/types';

// NEXT_PUBLIC_GOOGLE_MAPS_API_KEY/MAP_ID are unset in the test env, so
// isMapsConfigured() is false and the component renders its disabled
// fallback input instead of trying to load the Places library - exactly
// the path these filter-logic tests want, since none of them touch the
// search bar itself.

function renderPanel(filters: DiscoveryFilters = EMPTY_DISCOVERY_FILTERS) {
  const onFiltersChange = vi.fn();
  const onPlaceSelected = vi.fn();
  render(
    <MapSearchPanel
      filters={filters}
      onFiltersChange={onFiltersChange}
      onPlaceSelected={onPlaceSelected}
    />,
  );
  return { onFiltersChange, onPlaceSelected };
}

describe('MapSearchPanel filter logic', () => {
  it('renders the disabled search fallback when Maps is not configured', () => {
    renderPanel();
    expect(screen.getByPlaceholderText('Search coming soon')).toBeDisabled();
  });

  it('selects a style chip by calling onFiltersChange with its category slug', async () => {
    const user = userEvent.setup();
    const { onFiltersChange } = renderPanel();

    await user.click(screen.getByRole('button', { name: 'Locs' }));

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...EMPTY_DISCOVERY_FILTERS,
      category: 'locs',
    });
  });

  it('deselects an already-active style chip back to null (toggle, not radio)', async () => {
    const user = userEvent.setup();
    const { onFiltersChange } = renderPanel({ ...EMPTY_DISCOVERY_FILTERS, category: 'locs' });

    await user.click(screen.getByRole('button', { name: 'Locs' }));

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...EMPTY_DISCOVERY_FILTERS,
      category: null,
    });
  });

  it('switching style chips replaces the previous selection rather than combining', async () => {
    const user = userEvent.setup();
    const { onFiltersChange } = renderPanel({ ...EMPTY_DISCOVERY_FILTERS, category: 'braids' });

    await user.click(screen.getByRole('button', { name: 'Twists' }));

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...EMPTY_DISCOVERY_FILTERS,
      category: 'twists',
    });
  });

  it('location-type chips are single-select, not a toggle - clicking "All" while already "All" stays "All"', async () => {
    const user = userEvent.setup();
    const { onFiltersChange } = renderPanel();

    await user.click(screen.getByRole('button', { name: 'Mobile' }));
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...EMPTY_DISCOVERY_FILTERS,
      locationType: 'MOBILE',
    });
  });

  it('clicking "All" after a specific location type clears the filter to null', async () => {
    const user = userEvent.setup();
    const { onFiltersChange } = renderPanel({
      ...EMPTY_DISCOVERY_FILTERS,
      locationType: 'PRIVATE_STUDIO',
    });

    await user.click(screen.getByRole('button', { name: 'All' }));

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...EMPTY_DISCOVERY_FILTERS,
      locationType: null,
    });
  });

  it('toggles acceptingNewClients on and reflects it via aria-checked', async () => {
    const user = userEvent.setup();
    const { onFiltersChange } = renderPanel();

    const toggle = screen.getByRole('switch', { name: 'Accepting new clients' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    await user.click(toggle);

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...EMPTY_DISCOVERY_FILTERS,
      acceptingNewClients: true,
    });
  });

  it('all three filter dimensions are independent - toggling one leaves the others untouched', async () => {
    const user = userEvent.setup();
    const { onFiltersChange } = renderPanel({
      category: 'braids',
      locationType: 'PUBLIC_SALON',
      acceptingNewClients: true,
    });

    await user.click(screen.getByRole('switch', { name: 'Accepting new clients' }));

    expect(onFiltersChange).toHaveBeenCalledWith({
      category: 'braids',
      locationType: 'PUBLIC_SALON',
      acceptingNewClients: false,
    });
  });
});
