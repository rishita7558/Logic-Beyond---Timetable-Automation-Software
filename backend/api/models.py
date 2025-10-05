from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Professor(TimeStampedModel):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    department = models.CharField(max_length=255, blank=True)

    def __str__(self) -> str:
        return f"{self.name} ({self.department})"


class LabAssistant(TimeStampedModel):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)

    def __str__(self) -> str:
        return self.name


class Student(TimeStampedModel):
    roll_number = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=255)
    program = models.CharField(max_length=128, blank=True)
    batch = models.CharField(max_length=64, help_text="Batch or graduation year, e.g., 2026")
    section = models.CharField(max_length=10, help_text="Section like A, B, C, etc.")

    def __str__(self) -> str:
        return f"{self.roll_number} - {self.name} ({self.section})"


class RoomType(models.TextChoices):
    CLASSROOM = "CLASSROOM", "Classroom"
    LAB = "LAB", "Laboratory"
    HALL = "HALL", "Examination Hall"


class Room(TimeStampedModel):
    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=255)
    building = models.CharField(max_length=128, blank=True)
    capacity = models.PositiveIntegerField(default=0)
    room_type = models.CharField(max_length=16, choices=RoomType.choices, default=RoomType.CLASSROOM)

    def __str__(self) -> str:
        return f"{self.code} ({self.capacity})"


class Course(TimeStampedModel):
    code = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=255)
    lecture_hours = models.PositiveSmallIntegerField(default=0)
    tutorial_hours = models.PositiveSmallIntegerField(default=0)
    practical_hours = models.PositiveSmallIntegerField(default=0)
    self_study_hours = models.PositiveSmallIntegerField(default=0)
    credits = models.PositiveSmallIntegerField(default=0)
    is_half_semester = models.BooleanField(default=False)
    is_elective = models.BooleanField(default=False)
    instructors = models.ManyToManyField(Professor, related_name="courses")

    def __str__(self) -> str:
        return f"{self.code} - {self.name}"


class Enrollment(TimeStampedModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="enrollments")

    class Meta:
        unique_together = ("course", "student")


class DayOfWeek(models.IntegerChoices):
    MONDAY = 0, "Mon"
    TUESDAY = 1, "Tue"
    WEDNESDAY = 2, "Wed"
    THURSDAY = 3, "Thu"
    FRIDAY = 4, "Fri"
    SATURDAY = 5, "Sat"
    SUNDAY = 6, "Sun"


class ProfessorAvailability(TimeStampedModel):
    professor = models.ForeignKey(Professor, on_delete=models.CASCADE, related_name="availabilities")
    day_of_week = models.IntegerField(choices=DayOfWeek.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        ordering = ["professor", "day_of_week", "start_time"]


class RoomAvailability(TimeStampedModel):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="availabilities")
    day_of_week = models.IntegerField(choices=DayOfWeek.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        ordering = ["room", "day_of_week", "start_time"]


class MessHours(TimeStampedModel):
    day_of_week = models.IntegerField(choices=DayOfWeek.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()


class Slot(TimeStampedModel):
    code = models.CharField(max_length=16, unique=True)
    day_of_week = models.IntegerField(choices=DayOfWeek.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self) -> str:
        return f"{self.code} {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"


class Timetable(TimeStampedModel):
    name = models.CharField(max_length=128, default="Default")
    effective_from = models.DateField(null=True, blank=True)
    effective_to = models.DateField(null=True, blank=True)

    def __str__(self) -> str:
        return self.name


class ClassSession(TimeStampedModel):
    timetable = models.ForeignKey(Timetable, on_delete=models.CASCADE, related_name="sessions")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="class_sessions")
    slot = models.ForeignKey(Slot, on_delete=models.PROTECT, related_name="class_sessions")
    room = models.ForeignKey(Room, on_delete=models.PROTECT, related_name="class_sessions")
    instructor = models.ForeignKey(Professor, on_delete=models.PROTECT, related_name="class_sessions")
    section = models.CharField(max_length=10, help_text="Section like A, B, C for this session")
    is_tutorial = models.BooleanField(default=False)
    is_practical = models.BooleanField(default=False)
    color_code = models.CharField(max_length=7, default="#3498db", help_text="Hex color for timetable display")

    class Meta:
        unique_together = ("timetable", "course", "slot", "section")


class Exam(TimeStampedModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="exams")
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        unique_together = ("course", "date")
        ordering = ["date", "start_time"]


class ExamRoomAllocation(TimeStampedModel):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="room_allocations")
    room = models.ForeignKey(Room, on_delete=models.PROTECT, related_name="exam_allocations")
    capacity_used = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("exam", "room")


class SeatingAssignment(TimeStampedModel):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="seating_assignments")
    room = models.ForeignKey(Room, on_delete=models.PROTECT, related_name="seating_assignments")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="seating_assignments")
    row_index = models.PositiveIntegerField(default=0)
    col_index = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("exam", "room", "row_index", "col_index")


class InvigilationDuty(TimeStampedModel):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="invigilation_duties")
    professor = models.ForeignKey(Professor, on_delete=models.PROTECT, related_name="invigilation_duties")
    room = models.ForeignKey(Room, on_delete=models.PROTECT, related_name="invigilation_duties")

    class Meta:
        unique_together = ("exam", "professor", "room")


