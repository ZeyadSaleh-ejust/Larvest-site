"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import { API_URL } from '@/utils/constants';

// Create the API slice for farm areas
export const farmAreasApi = createApi({
  reducerPath: 'farmAreasApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers) => {
      const token = Cookies.get('accessToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['FarmAreas'],
  endpoints: (builder) => ({
    // Get all farm areas
    getFarmAreas: builder.query({
      query: () => '/farm-areas/',
      providesTags: ['FarmAreas'],
      transformResponse: (response) => {
        // Transform the response to match the frontend structure
        return response.map(area => {
          // Calculate measurements if coordinates are available
          let measurements = {};
          if (area.area_coordinates && area.area_coordinates.length > 0) {
            // Convert coordinates to the format expected by the measurement function
            const coordinates = area.area_coordinates.map(coord => ({
              lat: coord[0],
              lng: coord[1]
            }));

            // Calculate area in square meters
            const areaInSquareMeters = calculateArea(coordinates);

            // Convert to acres (1 square meter = 0.000247105 acres)
            const areaInAcres = areaInSquareMeters * 0.000247105;

            measurements = {
              acres: areaInAcres.toFixed(2),
              squareMeters: areaInSquareMeters.toFixed(2),
              hectares: (areaInSquareMeters / 10000).toFixed(2)
            };
          }

          return {
            id: area.id,
            name: area.name,
            coordinates: area.area_coordinates,
            center: area.center_coordinates,
            measurements,
            primaryCrop: area.primaryCrop,
            secondaryCrops: area.secondaryCrops,
            soilType: area.soilType,
            irrigationSystem: area.irrigationSystem,
            fertilizers: area.fertilizers,
            fertilizationFrequency: area.fertilizationFrequency,
            fertilizationMethod: area.fertilizationMethod,
            commonPests: area.commonPests,
            pesticides: area.pesticides,
            previousYield: area.previousYield,
            soilTestResults: area.soilTestResults,
            yieldLosses: area.yieldLosses,
            additionalNotes: area.additionalNotes,
            files: {
              soilReports: area.soilReports,
              yieldData: area.yieldData,
              cropPhotos: area.cropPhotos,
              otherDocuments: area.otherDocuments
            },
            timestamp: area.created_at,
            lastEdited: area.updated_at
          };
        });
      }
    }),

    // Add new farm area
    addFarmArea: builder.mutation({
      query: (farmAreaData) => {
        const hasFiles = farmAreaData.files && Object.values(farmAreaData.files).some(file => file);

        // Transform coordinates to [latitude, longitude] format
        const transformedCoordinates = farmAreaData.coordinates?.map(coord => [coord.lat, coord.lng]);
        const transformedCenter = farmAreaData.center ? [farmAreaData.center.lat, farmAreaData.center.lng] : null;

        if (hasFiles) {
          // If there are files, use FormData
          const formData = new FormData();

          // Add basic fields
          Object.keys(farmAreaData).forEach(key => {
            if (key !== 'files' && key !== 'coordinates' && key !== 'center') {
              formData.append(key, farmAreaData[key]);
            }
          });

          // Add coordinates
          if (transformedCoordinates) {
            formData.append('area_coordinates', JSON.stringify(transformedCoordinates));
          }
          if (transformedCenter) {
            formData.append('center_coordinates', JSON.stringify(transformedCenter));
          }

          // Add files
          if (farmAreaData.files) {
            // Handle each file type
            if (farmAreaData.files.soilReports) {
              const blob = new Blob([farmAreaData.files.soilReports], { type: farmAreaData.files.soilReports.type });
              formData.append('soilReports', blob, farmAreaData.files.soilReports.name);
            }
            if (farmAreaData.files.yieldData) {
              const blob = new Blob([farmAreaData.files.yieldData], { type: farmAreaData.files.yieldData.type });
              formData.append('yieldData', blob, farmAreaData.files.yieldData.name);
            }
            if (farmAreaData.files.cropPhotos) {
              const blob = new Blob([farmAreaData.files.cropPhotos], { type: farmAreaData.files.cropPhotos.type });
              formData.append('cropPhotos', blob, farmAreaData.files.cropPhotos.name);
            }
            if (farmAreaData.files.otherDocuments) {
              const blob = new Blob([farmAreaData.files.otherDocuments], { type: farmAreaData.files.otherDocuments.type });
              formData.append('otherDocuments', blob, farmAreaData.files.otherDocuments.name);
            }
          }

          return {
            url: '/farm-areas/',
            method: 'POST',
            body: formData,
            formData: true
          };
        } else {
          // If no files, use JSON
          const jsonData = {
            ...farmAreaData,
            area_coordinates: transformedCoordinates,
            center_coordinates: transformedCenter
          };
          delete jsonData.files;
          delete jsonData.coordinates;
          delete jsonData.center;

          return {
            url: '/farm-areas/',
            method: 'POST',
            body: jsonData,
            headers: {
              'Content-Type': 'application/json'
            }
          };
        }
      },
      invalidatesTags: ['FarmAreas'],
    }),

    // Update farm area
    updateFarmArea: builder.mutation({
      query: ({ id, ...farmAreaData }) => {
        const hasFiles = farmAreaData.files && Object.values(farmAreaData.files).some(file => file);

        // Transform coordinates to [latitude, longitude] format
        const transformedCoordinates = farmAreaData.coordinates?.map(coord => [coord.lat, coord.lng]);
        const transformedCenter = farmAreaData.center ? [farmAreaData.center.lat, farmAreaData.center.lng] : null;

        if (hasFiles) {
          // If there are files, use FormData
          const formData = new FormData();

          // Add basic fields
          Object.keys(farmAreaData).forEach(key => {
            if (key !== 'files' && key !== 'coordinates' && key !== 'center') {
              formData.append(key, farmAreaData[key]);
            }
          });

          // Add coordinates
          if (transformedCoordinates) {
            formData.append('area_coordinates', JSON.stringify(transformedCoordinates));
          }
          if (transformedCenter) {
            formData.append('center_coordinates', JSON.stringify(transformedCenter));
          }

          // Add files
          if (farmAreaData.files) {
            // Handle each file type
            if (farmAreaData.files.soilReports) {
              const blob = new Blob([farmAreaData.files.soilReports], { type: farmAreaData.files.soilReports.type });
              formData.append('soilReports', blob, farmAreaData.files.soilReports.name);
            }
            if (farmAreaData.files.yieldData) {
              const blob = new Blob([farmAreaData.files.yieldData], { type: farmAreaData.files.yieldData.type });
              formData.append('yieldData', blob, farmAreaData.files.yieldData.name);
            }
            if (farmAreaData.files.cropPhotos) {
              const blob = new Blob([farmAreaData.files.cropPhotos], { type: farmAreaData.files.cropPhotos.type });
              formData.append('cropPhotos', blob, farmAreaData.files.cropPhotos.name);
            }
            if (farmAreaData.files.otherDocuments) {
              const blob = new Blob([farmAreaData.files.otherDocuments], { type: farmAreaData.files.otherDocuments.type });
              formData.append('otherDocuments', blob, farmAreaData.files.otherDocuments.name);
            }
          }

          return {
            url: `/farm-areas/${id}/`,
            method: 'PUT',
            body: formData,
            formData: true
          };
        } else {
          // If no files, use JSON
          const jsonData = {
            ...farmAreaData,
            area_coordinates: transformedCoordinates,
            center_coordinates: transformedCenter
          };
          delete jsonData.files;
          delete jsonData.coordinates;
          delete jsonData.center;

          return {
            url: `/farm-areas/${id}/`,
            method: 'PUT',
            body: jsonData,
            headers: {
              'Content-Type': 'application/json'
            }
          };
        }
      },
      invalidatesTags: ['FarmAreas'],
    }),

    // Delete farm area
    deleteFarmArea: builder.mutation({
      query: (id) => ({
        url: `/farm-areas/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FarmAreas'],
    }),
  }),
});

// Helper function to calculate area from coordinates
function calculateArea(coordinates) {
  if (!coordinates || coordinates.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    area += coordinates[i].lat * coordinates[j].lng;
    area -= coordinates[j].lat * coordinates[i].lng;
  }
  area = Math.abs(area) / 2;

  // Convert to square meters (approximate)
  return area * 111319.9; // 1 degree is approximately 111.32 km at the equator
}

// Export the auto-generated hooks
export const {
  useGetFarmAreasQuery,
  useAddFarmAreaMutation,
  useUpdateFarmAreaMutation,
  useDeleteFarmAreaMutation,
} = farmAreasApi;