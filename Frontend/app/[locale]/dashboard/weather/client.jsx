"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useGetFarmAreasQuery } from '@/app/[locale]/lib/api/farmAreasSlice';
import WeatherDashboard from '../_components/WeatherDashboard';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CustomSelect from '../_components/CustomSelect';


export default function WeatherPageClient() {
  const { t, i18n } = useTranslation('dashboard');
  const router = useRouter();
  const searchParams = useSearchParams();
  const areaId = searchParams.get('areaId');

  const { data: farmAreas, isLoading, isError } = useGetFarmAreasQuery();

  const [selectedArea, setSelectedArea] = useState(null);

  useEffect(() => {
    if (farmAreas) {
      if (areaId) {
        const area = farmAreas.find(a => String(a.id) === String(areaId));
        setSelectedArea(area);
      } else if (farmAreas.length > 0) {
        setSelectedArea(farmAreas[0]);
        router.replace(`/${i18n.language}/dashboard/weather?areaId=${farmAreas[0].id}`);
      }
    }
  }, [farmAreas, areaId, router, i18n.language]);

  const handleAreaChange = (newAreaId) => {
    const area = farmAreas.find(a => String(a.id) === String(newAreaId));
    setSelectedArea(area);
    router.push(`/${i18n.language}/dashboard/weather?areaId=${newAreaId}`);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></div>;
  }

  if (isError) {
    return <div className="text-center text-red-500">{t('weatherDashboard.loadError')}</div>;
  }

  if (!farmAreas || farmAreas.length === 0) {
    return <div className="text-center text-gray-500">{t('weatherDashboard.noAreas')}</div>;
  }

  return (
    <div>
      <div className="mb-8 max-w-sm">
        <CustomSelect
          label={`${t('weatherDashboard.selectArea')}:`}
          options={farmAreas.map(area => ({ value: area.id, label: area.name }))}
          selected={{ value: selectedArea?.id, label: selectedArea?.name }}
          onChange={(option) => handleAreaChange(option.value)}
          placeholder={t('weatherDashboard.selectArea')}
        />
      </div>

      {selectedArea ? (
        <WeatherDashboard selectedArea={selectedArea} />
      ) : (
        <div className="text-center text-gray-500">{t('weatherDashboard.noAreaSelected')}</div>
      )}
    </div>
  );
} 