import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGeolocation } from '@/hooks/useGeolocation';

vi.mock('@/lib/maps/geocoding', () => ({
  reverseGeocodeCoordinates: vi.fn().mockResolvedValue('Kathleen, Georgia'),
}));

type SuccessCallback = (position: GeolocationPosition) => void;
type ErrorCallback = (error: GeolocationPositionError) => void;

function mockPosition(lat: number, lng: number): GeolocationPosition {
  return {
    coords: {
      latitude: lat,
      longitude: lng,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON: () => ({}),
    },
    timestamp: Date.now(),
    toJSON: () => ({}),
  } as GeolocationPosition;
}

function mockError(code: 1 | 2 | 3): GeolocationPositionError {
  return {
    code,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
    message: 'mock geolocation error',
  } as GeolocationPositionError;
}

describe('useGeolocation', () => {
  let getCurrentPosition: ReturnType<typeof vi.fn>;
  let originalGeolocation: Geolocation | undefined;

  beforeEach(() => {
    getCurrentPosition = vi.fn();
    originalGeolocation = navigator.geolocation;
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition, clearWatch: vi.fn(), watchPosition: vi.fn() },
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: originalGeolocation,
      configurable: true,
    });
    vi.clearAllMocks();
  });

  it('starts idle and never calls the browser API until requestLocation() is called', () => {
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.status).toBe('idle');
    expect(result.current.coordinates).toBeNull();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('moves to requesting immediately after requestLocation(), before the browser responds', () => {
    const { result } = renderHook(() => useGeolocation());
    act(() => {
      result.current.requestLocation();
    });
    expect(result.current.status).toBe('requesting');
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('moves to granted with coordinates on a successful fix', async () => {
    const { result } = renderHook(() => useGeolocation());
    act(() => {
      result.current.requestLocation();
    });

    const success = getCurrentPosition.mock.calls[0]?.[0] as SuccessCallback;
    act(() => {
      success(mockPosition(32.694, -83.6185));
    });

    expect(result.current.status).toBe('granted');
    expect(result.current.coordinates).toEqual({ lat: 32.694, lng: -83.6185 });

    // The reverse-geocoded name resolves asynchronously and shouldn't
    // block or revert the already-granted status.
    await waitFor(() => expect(result.current.locationName).toBe('Kathleen, Georgia'));
    expect(result.current.status).toBe('granted');
  });

  it('moves to denied when the browser reports PERMISSION_DENIED', () => {
    const { result } = renderHook(() => useGeolocation());
    act(() => {
      result.current.requestLocation();
    });

    const error = getCurrentPosition.mock.calls[0]?.[1] as ErrorCallback;
    act(() => {
      error(mockError(1));
    });

    expect(result.current.status).toBe('denied');
    expect(result.current.coordinates).toBeNull();
  });

  it('moves to timeout when the browser reports TIMEOUT, distinctly from denied', () => {
    const { result } = renderHook(() => useGeolocation());
    act(() => {
      result.current.requestLocation();
    });

    const error = getCurrentPosition.mock.calls[0]?.[1] as ErrorCallback;
    act(() => {
      error(mockError(3));
    });

    expect(result.current.status).toBe('timeout');
  });

  it('moves to denied (not timeout) when the browser reports POSITION_UNAVAILABLE', () => {
    const { result } = renderHook(() => useGeolocation());
    act(() => {
      result.current.requestLocation();
    });

    const error = getCurrentPosition.mock.calls[0]?.[1] as ErrorCallback;
    act(() => {
      error(mockError(2));
    });

    expect(result.current.status).toBe('denied');
  });

  it('moves to unsupported without ever calling the browser API when geolocation is absent', () => {
    // The hook checks `'geolocation' in navigator` - a browser without
    // support never defines the property at all, so the test has to
    // delete it (not just set it to undefined, which would still leave
    // the key present and defeat the `in` check the hook actually runs).
    delete (navigator as { geolocation?: Geolocation }).geolocation;

    const { result } = renderHook(() => useGeolocation());
    act(() => {
      result.current.requestLocation();
    });

    expect(result.current.status).toBe('unsupported');
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('clearLocation() resets status, coordinates, and locationName back to idle', async () => {
    const { result } = renderHook(() => useGeolocation());
    act(() => {
      result.current.requestLocation();
    });
    const success = getCurrentPosition.mock.calls[0]?.[0] as SuccessCallback;
    act(() => {
      success(mockPosition(32.694, -83.6185));
    });
    await waitFor(() => expect(result.current.locationName).not.toBeNull());

    act(() => {
      result.current.clearLocation();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.coordinates).toBeNull();
    expect(result.current.locationName).toBeNull();
  });
});
