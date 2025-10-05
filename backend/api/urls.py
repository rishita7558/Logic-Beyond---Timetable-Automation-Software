from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views


router = DefaultRouter()
router.register(r'professors', views.ProfessorViewSet)
router.register(r'lab-assistants', views.LabAssistantViewSet)
router.register(r'students', views.StudentViewSet)
router.register(r'rooms', views.RoomViewSet)
router.register(r'courses', views.CourseViewSet)
router.register(r'enrollments', views.EnrollmentViewSet)
router.register(r'professor-availability', views.ProfessorAvailabilityViewSet)
router.register(r'room-availability', views.RoomAvailabilityViewSet)
router.register(r'mess-hours', views.MessHoursViewSet)
router.register(r'slots', views.SlotViewSet)
router.register(r'timetables', views.TimetableViewSet)
router.register(r'class-sessions', views.ClassSessionViewSet)
router.register(r'exams', views.ExamViewSet)
router.register(r'exam-room-allocations', views.ExamRoomAllocationViewSet)
router.register(r'seating-assignments', views.SeatingAssignmentViewSet)
router.register(r'invigilation-duties', views.InvigilationDutyViewSet)


urlpatterns = [
    path('', include(router.urls)),
    path('csv/courses/', views.CSVImportViewSet.as_view({'post': 'import_courses'})),
    path('csv/students/', views.CSVImportViewSet.as_view({'post': 'import_students'})),
    path('csv/professors/', views.CSVImportViewSet.as_view({'post': 'import_professors'})),
    path('csv/rooms/', views.CSVImportViewSet.as_view({'post': 'import_rooms'})),
]


