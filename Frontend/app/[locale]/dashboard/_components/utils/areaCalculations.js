/**
 * Utility functions for area calculations
 */

export const calculateAreaMeasurements = (L, coordinates) => {
  const areaInSqMeters = L.GeometryUtil.geodesicArea(coordinates);
  return {
    acres: (areaInSqMeters / 4046.856).toFixed(2),
    hectares: (areaInSqMeters / 10000).toFixed(2),
    squareKilometers: (areaInSqMeters / 1000000).toFixed(2),
    squareMeters: areaInSqMeters.toFixed(2)
  };
};

export const calculateCenter = (coordinates) => {
  const centerLat = coordinates.reduce((sum, point) => sum + point.lat, 0) / coordinates.length;
  const centerLng = coordinates.reduce((sum, point) => sum + point.lng, 0) / coordinates.length;
  return { lat: centerLat, lng: centerLng };
};