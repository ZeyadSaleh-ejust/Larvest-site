import os
import asyncio
import tempfile
import uuid
from django.http import FileResponse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from .utils import generate_tiles_and_map
from .schemas import tile_generation_schema, TileGenerationSerializer, time_series_schema, TimeSeriesSerializer
from .models import WindyAccessLog

WINDY_DAILY_LIMIT = 2


def get_client_ip(request):
    """Get client IP, supporting proxies/ngrok via X-Forwarded-For."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class WindyAccessView(APIView):
    """Check and record Windy API access — 2 free uses per IP per day."""
    permission_classes = []  # No auth needed

    def get(self, request):
        ip = get_client_ip(request)
        today = timezone.now().date()

        today_count = WindyAccessLog.objects.filter(
            ip_address=ip,
            accessed_at__date=today
        ).count()

        if today_count >= WINDY_DAILY_LIMIT:
            return Response({
                "allowed": False,
                "remaining": 0,
                "message": "Daily limit reached. You can use the forecast map 2 times per day."
            })

        # Record this access
        WindyAccessLog.objects.create(ip_address=ip)

        return Response({
            "allowed": True,
            "remaining": WINDY_DAILY_LIMIT - today_count - 1,
        })



class TileGenerationView(APIView):
    @tile_generation_schema
    def post(self, request):
        serializer = TileGenerationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            results, map_path, map_html = loop.run_until_complete(generate_tiles_and_map(**serializer.validated_data))
            loop.close()
            return Response(
                {
                    "message": "Tile generation and map creation completed successfully",
                    "tiles_generated": len(results) if results else 0,
                    "results": results,
                    "map_url": f"/api/tile-map/?path={os.path.basename(map_path)}" if map_path else None,
                    "map_html": map_html
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to generate tiles and map: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class TileMapView(APIView):
    def get(self, request):
        map_filename = request.GET.get('path')
        if not map_filename:
            return Response(
                {"error": "No map file specified"},
                status=status.HTTP_400_BAD_REQUEST
            )
        map_path = os.path.join(tempfile.gettempdir(), map_filename)
        if not os.path.exists(map_path):
            return Response(
                {"error": "Map file not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        return FileResponse(
            open(map_path, 'rb'),
            content_type='text/html'
        )


class TimeSeriesView(APIView):
    """
    Compute time series using VirtuGhan Python package directly and return GIF and values file.
    """
    @time_series_schema
    def post(self, request):
        serializer = TimeSeriesSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            from vcube.engine import VCubeProcessor
            import mercantile
            payload = serializer.validated_data
            # Create a unique output directory for this request
            unique_id = str(uuid.uuid4())
            base_output_dir = os.path.abspath("media/virtughan_output")
            output_dir = os.path.join(base_output_dir, unique_id)
            os.makedirs(output_dir, exist_ok=True)
            processor = VCubeProcessor(
                bbox=[payload["min_lon"], payload["min_lat"], payload["max_lon"], payload["max_lat"]],
                start_date=payload["start_date"],
                end_date=payload["end_date"],
                cloud_cover=payload["cloud_cover"],
                formula=payload["formula"],
                band1=payload["band1"],
                band2=payload["band2"],
                operation=payload["operation"],
                timeseries=payload["timeseries"],
                output_dir=output_dir,
                workers=payload["workers"]
            )
            result = processor.compute()
            # Find GIF and values file
            gif_file = None
            values_file = None
            gif_filename = None
            values_filename = None
            for f in os.listdir(output_dir):
                if f.endswith('.gif'):
                    gif_file = os.path.abspath(os.path.join(output_dir, f))
                    gif_filename = f
                elif f.startswith('values_over_time'):
                    values_file = os.path.abspath(os.path.join(output_dir, f))
                    values_filename = f
            # Delete all other files in output_dir
            for f in os.listdir(output_dir):
                full_path = os.path.abspath(os.path.join(output_dir, f))
                if full_path != gif_file and full_path != values_file:
                    os.remove(full_path)
            if not gif_file or not values_file:
                return Response({"error": "Required output files not found."}, status=status.HTTP_400_BAD_REQUEST)
            # Return media paths instead of full paths
            gif_media_path = f"media/virtughan_output/{unique_id}/{gif_filename}"
            values_media_path = f"media/virtughan_output/{unique_id}/{values_filename}"
            return Response(
                {
                    "message": "Time series computation completed successfully!",
                    "gif_file_path": gif_media_path,
                    "values_file_path": values_media_path,
                    "output_dir": f"media/virtughan_output/{unique_id}",
                    "request_id": unique_id
                },
                status=status.HTTP_200_OK
            )
        except ImportError:
            return Response(
                {
                    "error": "VirtuGhan package not installed. Install with: pip install VirtuGhan",
                    "detail": "The VirtuGhan package is required for this endpoint to work."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            error_msg = str(e)
            detail_msg = "An error occurred during the time series computation."
            if "list index out of range" in error_msg:
                error_msg = "No satellite scenes found for the selected area and date range."
                detail_msg = "Please try selecting a wider date range in the past (e.g., last 2-6 months) or verifying your coordinates."
            return Response(
                {
                    "error": f"VirtuGhan computation failed: {error_msg}",
                    "detail": detail_msg
                },
                status=status.HTTP_400_BAD_REQUEST
            )
