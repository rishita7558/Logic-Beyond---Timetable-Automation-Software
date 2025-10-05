from rest_framework import serializers
from . import models


class ProfessorSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Professor
        fields = ["id", "name", "email", "department"]


class LabAssistantSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.LabAssistant
        fields = ["id", "name", "email"]


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Student
        fields = ["id", "roll_number", "name", "program", "batch", "section"]


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Room
        fields = ["id", "code", "name", "building", "capacity", "room_type"]


class CourseSerializer(serializers.ModelSerializer):
    instructors = serializers.PrimaryKeyRelatedField(queryset=models.Professor.objects.all(), many=True)

    class Meta:
        model = models.Course
        fields = [
            "id",
            "code",
            "name",
            "lecture_hours",
            "tutorial_hours",
            "practical_hours",
            "self_study_hours",
            "credits",
            "is_half_semester",
            "is_elective",
            "instructors",
        ]


class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Enrollment
        fields = ["id", "course", "student"]


class ProfessorAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ProfessorAvailability
        fields = ["id", "professor", "day_of_week", "start_time", "end_time"]


class RoomAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.RoomAvailability
        fields = ["id", "room", "day_of_week", "start_time", "end_time"]


class MessHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.MessHours
        fields = ["id", "day_of_week", "start_time", "end_time"]


class SlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Slot
        fields = ["id", "code", "day_of_week", "start_time", "end_time"]


class TimetableSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Timetable
        fields = ["id", "name", "effective_from", "effective_to"]


class ClassSessionSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    instructor_name = serializers.CharField(source='instructor.name', read_only=True)
    room_code = serializers.CharField(source='room.code', read_only=True)
    slot_code = serializers.CharField(source='slot.code', read_only=True)
    day_name = serializers.CharField(source='slot.get_day_of_week_display', read_only=True)
    start_time = serializers.TimeField(source='slot.start_time', read_only=True)
    end_time = serializers.TimeField(source='slot.end_time', read_only=True)

    class Meta:
        model = models.ClassSession
        fields = [
            "id",
            "timetable",
            "course",
            "course_name",
            "course_code",
            "slot",
            "slot_code",
            "room",
            "room_code",
            "instructor",
            "instructor_name",
            "section",
            "is_tutorial",
            "is_practical",
            "color_code",
            "day_name",
            "start_time",
            "end_time",
        ]


class ExamSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Exam
        fields = ["id", "course", "date", "start_time", "end_time"]


class ExamRoomAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ExamRoomAllocation
        fields = ["id", "exam", "room", "capacity_used"]


class SeatingAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.SeatingAssignment
        fields = ["id", "exam", "room", "student", "row_index", "col_index"]


class InvigilationDutySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.InvigilationDuty
        fields = ["id", "exam", "professor", "room"]


# CSV Import DTOs
class CourseCSVSerializer(serializers.Serializer):
    code = serializers.CharField()
    name = serializers.CharField()
    lecture_hours = serializers.IntegerField()
    tutorial_hours = serializers.IntegerField()
    practical_hours = serializers.IntegerField()
    self_study_hours = serializers.IntegerField()
    credits = serializers.IntegerField()
    instructors = serializers.CharField(help_text="Comma-separated instructor emails")


class RoomCSVSerializer(serializers.Serializer):
    code = serializers.CharField()
    name = serializers.CharField()
    building = serializers.CharField(allow_blank=True, required=False)
    capacity = serializers.IntegerField()
    room_type = serializers.ChoiceField(choices=models.RoomType.choices)


class ProfessorCSVSerializer(serializers.Serializer):
    name = serializers.CharField()
    email = serializers.EmailField()
    department = serializers.CharField(allow_blank=True, required=False)


class StudentCSVSerializer(serializers.Serializer):
    roll_number = serializers.CharField()
    name = serializers.CharField()
    program = serializers.CharField(allow_blank=True, required=False)
    batch = serializers.CharField()
    section = serializers.CharField()


