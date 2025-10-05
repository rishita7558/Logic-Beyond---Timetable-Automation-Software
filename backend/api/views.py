from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
import csv
from io import TextIOWrapper

from django.http import HttpResponse

from . import models, serializers, services, calendar as cal, pdf as pdf_utils


class ProfessorViewSet(viewsets.ModelViewSet):
    queryset = models.Professor.objects.all().order_by("name")
    serializer_class = serializers.ProfessorSerializer


class LabAssistantViewSet(viewsets.ModelViewSet):
    queryset = models.LabAssistant.objects.all().order_by("name")
    serializer_class = serializers.LabAssistantSerializer


class StudentViewSet(viewsets.ModelViewSet):
    queryset = models.Student.objects.all().order_by("roll_number")
    serializer_class = serializers.StudentSerializer


class RoomViewSet(viewsets.ModelViewSet):
    queryset = models.Room.objects.all().order_by("code")
    serializer_class = serializers.RoomSerializer


class CourseViewSet(viewsets.ModelViewSet):
    queryset = models.Course.objects.all().order_by("code")
    serializer_class = serializers.CourseSerializer


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = models.Enrollment.objects.all()
    serializer_class = serializers.EnrollmentSerializer


class ProfessorAvailabilityViewSet(viewsets.ModelViewSet):
    queryset = models.ProfessorAvailability.objects.all()
    serializer_class = serializers.ProfessorAvailabilitySerializer


class RoomAvailabilityViewSet(viewsets.ModelViewSet):
    queryset = models.RoomAvailability.objects.all()
    serializer_class = serializers.RoomAvailabilitySerializer


class MessHoursViewSet(viewsets.ModelViewSet):
    queryset = models.MessHours.objects.all()
    serializer_class = serializers.MessHoursSerializer


class SlotViewSet(viewsets.ModelViewSet):
    queryset = models.Slot.objects.all().order_by("code")
    serializer_class = serializers.SlotSerializer




class ClassSessionViewSet(viewsets.ModelViewSet):
    queryset = models.ClassSession.objects.all()
    serializer_class = serializers.ClassSessionSerializer


class ExamViewSet(viewsets.ModelViewSet):
    queryset = models.Exam.objects.all()
    serializer_class = serializers.ExamSerializer

    @action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request):
        result = services.generate_exam_schedule()
        return Response(result)

    @action(detail=True, methods=["post"], url_path="generate-seating")
    def generate_seating(self, request, pk=None):
        exam = self.get_object()
        result = services.generate_seating_for_exam(exam)
        services.balance_invigilation(exam)
        return Response(result)

    @action(detail=True, methods=["get"], url_path="export-seating-pdf")
    def export_seating_pdf(self, request, pk=None):
        exam = self.get_object()
        pdf_bytes = pdf_utils.seating_chart_pdf(exam)
        resp = HttpResponse(pdf_bytes, content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="seating_{exam.course.code}.pdf"'
        return resp


class TimetableViewSet(viewsets.ModelViewSet):
    queryset = models.Timetable.objects.all().order_by("-created_at")
    serializer_class = serializers.TimetableSerializer

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.filter_queryset(self.get_queryset())
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=["post"], url_path="generate")
    def generate(self, request, pk=None):
        timetable = self.get_object()
        result = services.generate_class_timetable(timetable)
        return Response(result)

    @action(detail=True, methods=["post"], url_path="reschedule")
    def reschedule(self, request, pk=None):
        timetable = self.get_object()
        result = services.reschedule_canceled_classes(timetable)
        return Response(result)

    @action(detail=True, methods=["post"], url_path="sync-calendar")
    def sync_calendar(self, request, pk=None):
        timetable = self.get_object()
        events = []
        for s in models.ClassSession.objects.filter(timetable=timetable).select_related("course", "room", "slot"):
            start_dt = timezone.make_aware(timezone.datetime.combine(timezone.now().date(), s.slot.start_time))
            end_dt = timezone.make_aware(timezone.datetime.combine(timezone.now().date(), s.slot.end_time))
            events.append({
                "summary": f"{s.course.code} {s.course.name} ({s.section})",
                "description": f"Instructor: {s.instructor.name}, Room: {s.room.code}",
                "start": start_dt.isoformat(),
                "end": end_dt.isoformat(),
                "location": s.room.name,
            })
        result = cal.upsert_events(events)
        return Response(result)

    @action(detail=True, methods=["get"], url_path="data")
    def get_timetable_data(self, request, pk=None):
        timetable = self.get_object()
        result = services.get_timetable_data(pk)
        return Response(result)

    @action(detail=True, methods=["get"], url_path="sections")
    def get_timetable_sections(self, request, pk=None):
        """Get all sections in a timetable"""
        sections = models.ClassSession.objects.filter(timetable_id=pk).values_list('section', flat=True).distinct()
        return Response(list(sections))

    @action(detail=True, methods=["get"], url_path="conflicts")
    def check_conflicts(self, request, pk=None):
        """Check for scheduling conflicts in timetable"""
        result = services.check_timetable_conflicts(pk)
        return Response(result)

    @action(detail=True, methods=["post"], url_path="optimize")
    def optimize_timetable(self, request, pk=None):
        """Optimize timetable for better resource utilization"""
        timetable = self.get_object()
        result = services.optimize_timetable(timetable)
        return Response(result)

    @action(detail=True, methods=["get"], url_path="export")
    def export_timetable(self, request, pk=None):
        """Export timetable as PDF"""
        timetable = self.get_object()
        pdf_bytes = pdf_utils.timetable_pdf(timetable)
        resp = HttpResponse(pdf_bytes, content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="timetable_{timetable.name}.pdf"'
        return resp

    @action(detail=True, methods=["delete"], url_path="clear")
    def clear_timetable(self, request, pk=None):
        """Clear all sessions from timetable"""
        timetable = self.get_object()
        deleted_count = models.ClassSession.objects.filter(timetable=timetable).delete()[0]
        return Response({"deleted_sessions": deleted_count})

    @action(detail=True, methods=["get"], url_path="statistics")
    def get_statistics(self, request, pk=None):
        """Get comprehensive timetable statistics"""
        result = services.get_timetable_statistics(pk)
        return Response(result)


class ExamRoomAllocationViewSet(viewsets.ModelViewSet):
    queryset = models.ExamRoomAllocation.objects.all()
    serializer_class = serializers.ExamRoomAllocationSerializer


class SeatingAssignmentViewSet(viewsets.ModelViewSet):
    queryset = models.SeatingAssignment.objects.all()
    serializer_class = serializers.SeatingAssignmentSerializer


class InvigilationDutyViewSet(viewsets.ModelViewSet):
    queryset = models.InvigilationDuty.objects.all()
    serializer_class = serializers.InvigilationDutySerializer


class CSVImportViewSet(viewsets.ViewSet):
    @action(detail=False, methods=["post"], url_path="courses")
    def import_courses(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        reader = csv.DictReader(TextIOWrapper(file, encoding="utf-8"))
        created = 0
        with transaction.atomic():
            for row in reader:
                data = {
                    "code": row.get("code"),
                    "name": row.get("name"),
                    "lecture_hours": int(row.get("lecture_hours", 0)),
                    "tutorial_hours": int(row.get("tutorial_hours", 0)),
                    "practical_hours": int(row.get("practical_hours", 0)),
                    "self_study_hours": int(row.get("self_study_hours", 0)),
                    "credits": int(row.get("credits", 0)),
                    "is_half_semester": row.get("is_half_semester", "false").lower() in ("1", "true", "yes"),
                    "is_elective": row.get("is_elective", "false").lower() in ("1", "true", "yes"),
                }
                instructor_emails = [e.strip() for e in (row.get("instructors") or "").split(",") if e.strip()]
                serializer = serializers.CourseSerializer(data={**data, "instructors": []})
                serializer.is_valid(raise_exception=True)
                course = serializer.save()
                if instructor_emails:
                    profs = list(models.Professor.objects.filter(email__in=instructor_emails))
                    course.instructors.set(profs)
                created += 1
        return Response({"created": created})

    @action(detail=False, methods=["post"], url_path="students")
    def import_students(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        reader = csv.DictReader(TextIOWrapper(file, encoding="utf-8"))
        created = 0
        with transaction.atomic():
            for row in reader:
                models.Student.objects.update_or_create(
                    roll_number=row.get("roll_number"),
                    defaults={
                        "name": row.get("name"),
                        "program": row.get("program", ""),
                        "batch": row.get("batch", ""),
                        "section": row.get("section", "A"),
                    },
                )
                created += 1
        return Response({"created": created})

    @action(detail=False, methods=["post"], url_path="professors")
    def import_professors(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        reader = csv.DictReader(TextIOWrapper(file, encoding="utf-8"))
        created = 0
        with transaction.atomic():
            for row in reader:
                models.Professor.objects.update_or_create(
                    email=row.get("email"),
                    defaults={
                        "name": row.get("name"),
                        "department": row.get("department", ""),
                    },
                )
                created += 1
        return Response({"created": created})

    @action(detail=False, methods=["post"], url_path="rooms")
    def import_rooms(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        reader = csv.DictReader(TextIOWrapper(file, encoding="utf-8"))
        created = 0
        with transaction.atomic():
            for row in reader:
                models.Room.objects.update_or_create(
                    code=row.get("code"),
                    defaults={
                        "name": row.get("name"),
                        "building": row.get("building", ""),
                        "capacity": int(row.get("capacity", 0)),
                        "room_type": row.get("room_type", models.RoomType.CLASSROOM),
                    },
                )
                created += 1
        return Response({"created": created})


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class ProfessorCSVUpload(APIView):
    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        # TODO: process the file here
        return Response({'created': 10}, status=status.HTTP_201_CREATED)


from rest_framework import generics
from .models import Timetable
from .serializers import TimetableSerializer

class TimetableDetailView(generics.DestroyAPIView):
    queryset = Timetable.objects.all()
    serializer_class = TimetableSerializer


class GenerateTimetableView(APIView):
    def post(self, request):
        # Your timetable generation logic here
        # Should create Timetable objects in the database
        return Response({'success': True}, status=status.HTTP_201_CREATED)


