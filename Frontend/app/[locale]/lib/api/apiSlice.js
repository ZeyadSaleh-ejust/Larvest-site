"use client";
import { API_URL } from '@/utils/constants';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

// Define the base URL for API requests
// const API_URL = 'https://larvest.ai/api';


// Create a custom base query with token refresh logic
const baseQueryWithReauth = async (args, api, extraOptions) => {
  // Create the base query
  const baseQuery = fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers) => {
      // Get the token from cookies
      const token = Cookies.get('accessToken');
      
      // If we have a token, add it to the headers
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  });

  // Execute the base query
  let result = await baseQuery(args, api, extraOptions);

  // If we get a 401 Unauthorized response, try to refresh the token
  if (result.error && result.error.status === 401) {
    // Try to get a new token
    const refreshToken = Cookies.get('refreshToken');
    
    if (!refreshToken) {
      // No refresh token available, logout
      // We need to import the logout function or handle it differently
      // For now, we'll just clear the cookies and redirect
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      Cookies.remove('userData');
      localStorage.removeItem('userData');
      return result;
    }
    
    // Try to refresh the token
    const refreshResult = await fetch(`${API_URL}/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (refreshResult.ok) {
      const data = await refreshResult.json();
      // Store the new token
      Cookies.set('accessToken', data.access, { secure: process.env.NODE_ENV === 'production', sameSite: 'Lax' });
      
      // Retry the original request with the new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed, logout
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      Cookies.remove('userData');
      localStorage.removeItem('userData');
    }
  }

  return result;
};

// Create the API slice with RTK Query
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Profile'],
  endpoints: (builder) => ({
    generateTiles: builder.mutation({
      query: (tileParams) => ({
        url: '/generate-tiles/',
        method: 'POST',
        body: tileParams,
      }),
    }),
    timeSeries: builder.mutation({
      query: (timeSeriesParams) => ({
        url: '/time_series/',
        method: 'POST',
        body: {
          ...timeSeriesParams,
          timeseries: true,
          workers: 16
        },
      }),
    }),
  }),
});

// Export the auto-generated hooks
export const {
  useGenerateTilesMutation,
  useTimeSeriesMutation,
} = apiSlice;