/**
 * Service for fetching location details
 */

export const getLocationDetails = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en-US,en;q=0.9",
          "User-Agent": "AgriSense-App/1.0",
        },
      }
    );
    const data = await response.json();
    return {
      displayName: data.display_name,
      details: {
        country: data.address.country,
        state: data.address.state,
        county: data.address.county,
        city: data.address.city,
        suburb: data.address.suburb,
        road: data.address.road,
        postcode: data.address.postcode,
      },
    };
  } catch (error) {
    console.error("Error fetching location details:", error);
    return null;
  }
};