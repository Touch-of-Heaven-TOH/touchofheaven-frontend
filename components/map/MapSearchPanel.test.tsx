import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MapSearchPanel from '@/components/map/MapSearchPanel';
import { EMPTY_DISCOVERY_FILTERS, type DiscoveryFilters } from '@/lib/discovery/types';

// The search bar's Nominatim lookups only fire after 3+ characters and a
// debounce, so these filter-logic tests never trigger a network call -
// none of them touch the search bar itself.

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
  it('renders an enabled search input', () => {
    renderPanel();
    expect(screen.getByPlaceholderText('Search by city or address')).toBeEnabled();
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
