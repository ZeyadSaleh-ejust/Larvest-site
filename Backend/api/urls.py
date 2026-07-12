from django.urls import path
from . import views

urlpatterns = [
    path('generate-tiles/', views.TileGenerationView.as_view(), name='generate-tiles'),
    path('tile-map/', views.TileMapView.as_view(), name='tile-map'),
    path('time_series/', views.TimeSeriesView.as_view(), name='time_series'),
    path('windy-access/', views.WindyAccessView.as_view(), name='windy-access'),
]