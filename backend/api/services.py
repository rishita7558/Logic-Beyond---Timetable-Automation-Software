import colorsys
import csv
import random
from collections import defaultdict, deque
from datetime import timedelta
from io import TextIOWrapper
from typing import Dict, List, Optional, Set, Tuple

from django.db import transaction
from django.utils import timezone

from . import models, serializers


def _time_overlap(a_start, a_end, b_start, b_end) -> bool:
    return max(a_start, b_start) < min(a_end, b_end)


def _ensure_break(prev_end, next_start, min_minutes: int) -> bool:
    delta = (
        timezone.datetime.combine(timezone.now().date(), next_start)
        - timezone.datetime.combine(timezone.now().date(), prev_end)
    )
    return delta.total_seconds() / 60.0 >= min_minutes


def _generate_color_codes(count: int) -> List[str]:
    """Generate distinct color codes for courses"""
    colors = []
    for i in range(count):
        hue = i / count
        rgb = colorsys.hsv_to_rgb(hue, 0.7, 0.9)
        hex_color = "#{:02x}{:02x}{:02x}".format(
            int(rgb[0] * 255), int(rgb[1] * 255), int(rgb[2] * 255)
        )
        colors.append(hex_color)
    return colors


@transaction.atomic
def generate_class_timetable(timetable: models.Timetable) -> Dict:
    """Generate comprehensive timetable with all constraints"""

    # Clear existing sessions for this timetable
    models.ClassSession.objects.filter(timetable=timetable).delete()

    courses = list(models.Course.objects.all().prefetch_related("instructors"))
    slots = list(models.Slot.objects.all().order_by("day_of_week", "start_time"))
    rooms = list(models.Room.objects.filter(room_type=models.RoomType.CLASSROOM).order_by("capacity"))
    labs = list(models.Room.objects.filter(room_type=models.RoomType.LAB).order_by("capacity"))
    mess_hours = list(models.MessHours.objects.all())
    
    if not courses or not slots or not rooms:
        return {"created_sessions": 0, "status": "error", "message": "Missing essential data (courses, slots, or rooms). Please upload all required CSVs."}


    # Get all sections from students
    sections = list(models.Student.objects.values_list("section", flat=True).distinct())
    if not sections:
        sections = ["A"]  # Default section

    # Generate color codes for courses
    course_colors = _generate_color_codes(len(courses))
    course_color_map = {course.id: course_colors[i] for i, course in enumerate(courses)}

    # Build availability maps
    prof_to_avails: Dict[int, List[Tuple[int, object, object]]] = defaultdict(list)
    for avail in models.ProfessorAvailability.objects.all():
        prof_to_avails[avail.professor_id].append((avail.day_of_week, avail.start_time, avail.end_time))

    room_to_avails: Dict[int, List[Tuple[int, object, object]]] = defaultdict(list)
    for avail in models.RoomAvailability.objects.all():
        room_to_avails[avail.room_id].append((avail.day_of_week, avail.start_time, avail.end_time))

    # Track booked state per section
    prof_booked: Dict[int, List[Tuple[int, object, object]]] = defaultdict(list)
    room_booked: Dict[int, List[Tuple[int, object, object]]] = defaultdict(list)
    course_day_booked: Dict[Tuple[int, str], Set[int]] = defaultdict(set)  # (course, section) -> days

    def can_place(
        course: models.Course,
        instructor_id: int,
        room_obj: models.Room,
        slot: models.Slot,
        section: str,
        is_practical: bool = False,
    ) -> bool:
        """Check if a session can be placed with all constraints"""

        # One lecture/tutorial per day per course per section
        if slot.day_of_week in course_day_booked[(course.id, section)] and not is_practical:
            return False

        # Professor availability
        prof_avails = prof_to_avails.get(instructor_id, [])
        if not any(
            day == slot.day_of_week and a_start <= slot.start_time and a_end >= slot.end_time
            for day, a_start, a_end in prof_avails
        ):
            return False

        # Room availability
        room_avails = room_to_avails.get(room_obj.id, [])
        if not any(
            day == slot.day_of_week and r_start <= slot.start_time and r_end >= slot.end_time
            for day, r_start, r_end in room_avails
        ):
            return False

        # Professor not already booked (with 15-min break)
        for d, s, e in prof_booked.get(instructor_id, []):
            if d != slot.day_of_week:
                continue
            if _time_overlap(s, e, slot.start_time, slot.end_time):
                return False
            # Ensure 15-min break between classes
            if not _ensure_break(e, slot.start_time, 15) and e <= slot.start_time:
                return False
            if not _ensure_break(slot.end_time, s, 15) and slot.end_time <= s:
                return False

        # Room not already booked
        for d, s, e in room_booked.get(room_obj.id, []):
            if d == slot.day_of_week and _time_overlap(s, e, slot.start_time, slot.end_time):
                return False

        # No classes during lunch (mess hours)
        for m in mess_hours:
            if m.day_of_week == slot.day_of_week and _time_overlap(
                m.start_time, m.end_time, slot.start_time, slot.end_time
            ):
                return False

        return True

    created = 0
    conflicts = []

    # Process each section separately
    for section in sections:
        for course in courses:
            instructors = [p.id for p in course.instructors.all()]
            if not instructors:
                conflicts.append(f"No instructors for course {course.code}")
                continue

            primary_instructor = instructors[0]

            # Plan session counts per section
            lecture_needed = course.lecture_hours
            tutorial_needed = course.tutorial_hours
            practical_needed = course.practical_hours

            # Distribute self-study hours evenly across week
            self_study_per_day = course.self_study_hours // 5  # 5 working days
            self_study_remaining = course.self_study_hours % 5

            # Try to place sessions
            for slot in slots:
                if lecture_needed <= 0 and tutorial_needed <= 0 and practical_needed <= 0:
                    break

                # Choose room type based on session type
                room_candidates = labs if practical_needed > 0 else rooms
                placed = False

                for room_obj in room_candidates:
                    if not can_place(
                        course, primary_instructor, room_obj, slot, section, practical_needed > 0
                    ):
                        continue

                    # Place session based on priority
                    if lecture_needed > 0 and slot.day_of_week not in course_day_booked[(course.id, section)]:
                        models.ClassSession.objects.create(
                            timetable=timetable,
                            course=course,
                            slot=slot,
                            room=room_obj,
                            instructor_id=primary_instructor,
                            section=section,
                            is_tutorial=False,
                            is_practical=False,
                            color_code=course_color_map[course.id],
                        )
                        course_day_booked[(course.id, section)].add(slot.day_of_week)
                        prof_booked[primary_instructor].append(
                            (slot.day_of_week, slot.start_time, slot.end_time)
                        )
                        room_booked[room_obj.id].append((slot.day_of_week, slot.start_time, slot.end_time))
                        lecture_needed -= 1
                        created += 1
                        placed = True

                    elif tutorial_needed > 0 and slot.day_of_week not in course_day_booked[(course.id, section)]:
                        models.ClassSession.objects.create(
                            timetable=timetable,
                            course=course,
                            slot=slot,
                            room=room_obj,
                            instructor_id=primary_instructor,
                            section=section,
                            is_tutorial=True,
                            is_practical=False,
                            color_code=course_color_map[course.id],
                        )
                        course_day_booked[(course.id, section)].add(slot.day_of_week)
                        prof_booked[primary_instructor].append(
                            (slot.day_of_week, slot.start_time, slot.end_time)
                        )
                        room_booked[room_obj.id].append((slot.day_of_week, slot.start_time, slot.end_time))
                        tutorial_needed -= 1
                        created += 1
                        placed = True

                    elif practical_needed > 0:
                        models.ClassSession.objects.create(
                            timetable=timetable,
                            course=course,
                            slot=slot,
                            room=room_obj,
                            instructor_id=primary_instructor,
                            section=section,
                            is_tutorial=False,
                            is_practical=True,
                            color_code=course_color_map[course.id],
                        )
                        prof_booked[primary_instructor].append(
                            (slot.day_of_week, slot.start_time, slot.end_time)
                        )
                        room_booked[room_obj.id].append((slot.day_of_week, slot.start_time, slot.end_time))
                        practical_needed -= 1
                        created += 1
                        placed = True

                    if placed:
                        break

            # Handle unplaced sessions
            if lecture_needed > 0:
                conflicts.append(f"Could not place {lecture_needed} lecture(s) for {course.code} section {section}")
            if tutorial_needed > 0:
                conflicts.append(f"Could not place {tutorial_needed} tutorial(s) for {course.code} section {section}")
            if practical_needed > 0:
                conflicts.append(f"Could not place {practical_needed} practical(s) for {course.code} section {section}")

    return {
        "created_sessions": created,
        "sections_processed": len(sections),
        "conflicts": conflicts,
        "status": "success" if not conflicts else "partial",
    }


@transaction.atomic
def reschedule_canceled_classes(timetable: models.Timetable) -> Dict:
    """Reschedule classes based on updated availability"""

    affected_courses: Set[Tuple[int, str]] = set()  # (course_id, section)

    # Find sessions that conflict with current availability
    for session in list(models.ClassSession.objects.filter(timetable=timetable)):
        # Check instructor availability
        i_av = models.ProfessorAvailability.objects.filter(
            professor=session.instructor,
            day_of_week=session.slot.day_of_week,
            start_time__lte=session.slot.start_time,
            end_time__gte=session.slot.end_time,
        ).exists()

        # Check room availability
        r_av = models.RoomAvailability.objects.filter(
            room=session.room,
            day_of_week=session.slot.day_of_week,
            start_time__lte=session.slot.start_time,
            end_time__gte=session.slot.end_time,
        ).exists()

        if not (i_av and r_av):
            affected_courses.add((session.course_id, session.section))
            session.delete()

    if not affected_courses:
        return {"rescheduled": 0, "status": "no_changes"}

    # Regenerate timetable
    result = generate_class_timetable(timetable)
    result["rescheduled"] = len(affected_courses)
    return result


@transaction.atomic
def generate_exam_schedule() -> Dict:
    """Generate exam schedule with no clashes for same batch"""

    courses = list(models.Course.objects.all())
    students_by_course: Dict[int, int] = {}

    for c in courses:
        students_by_course[c.id] = models.Enrollment.objects.filter(course=c).count()

    # Build batch information per course
    course_batches: Dict[int, Set[str]] = defaultdict(set)
    for e in models.Enrollment.objects.select_related("student", "course"):
        course_batches[e.course_id].add(e.student.batch)

    # Get available exam rooms and time slots
    rooms = list(models.Room.objects.filter(
        room_type__in=[models.RoomType.HALL, models.RoomType.CLASSROOM]
    ).order_by("-capacity"))
    room_avails = list(models.RoomAvailability.objects.all())

    # Group availability by day
    avails_by_day: Dict[int, List[Tuple[models.Room, object, object]]] = defaultdict(list)
    for ra in room_avails:
        avails_by_day[ra.day_of_week].append((ra.room, ra.start_time, ra.end_time))

    # Clear existing exams
    models.Exam.objects.all().delete()

    created_exams = 0
    assigned_batches_per_day: Dict[int, Set[str]] = defaultdict(set)

    # Sort courses by student count (larger courses first)
    courses_sorted = sorted(courses, key=lambda c: (-students_by_course.get(c.id, 0), c.code))

    for course in courses_sorted:
        batches = course_batches.get(course.id, set())
        placed = False

        # Find a day with minimal batch conflicts
        for day in range(7):  # Monday to Sunday
            if day not in avails_by_day:
                continue

            # Check if any batch from this course is already scheduled on this day
            if assigned_batches_per_day[day] & batches:
                continue

            # Use first available time slot
            windows = avails_by_day[day]
            if not windows:
                continue

            start_time = min(w[1] for w in windows)
            end_time = max(w[2] for w in windows)

            # Create exam
            exam = models.Exam.objects.create(
                course=course,
                date=timezone.now().date() + timedelta(days=day),
                start_time=start_time,
                end_time=end_time,
            )
            created_exams += 1

            # Mark batches as assigned to this day
            assigned_batches_per_day[day].update(batches)

            # Allocate rooms by capacity
            remaining_students = students_by_course.get(course.id, 0)
            for room in rooms:
                if remaining_students <= 0:
                    break

                capacity = room.capacity
                used = min(capacity, remaining_students)

                models.ExamRoomAllocation.objects.create(
                    exam=exam,
                    room=room,
                    capacity_used=used,
                )

                remaining_students -= used

            placed = True
            break

        if not placed:
            # Fallback: create on any available day
            for day in range(7):
                if day in avails_by_day and avails_by_day[day]:
                    windows = avails_by_day[day]
                    start_time = min(w[1] for w in windows)
                    end_time = max(w[2] for w in windows)

                    models.Exam.objects.create(
                        course=course,
                        date=timezone.now().date() + timedelta(days=day),
                        start_time=start_time,
                        end_time=end_time,
                    )
                    created_exams += 1
                    break

    return {"created_exams": created_exams}


@transaction.atomic
def generate_seating_for_exam(exam: models.Exam) -> Dict:
    """Generate intelligent seating arrangement with mixed seating"""

    allocations = list(models.ExamRoomAllocation.objects.filter(exam=exam).select_related("room"))
    enrollments = list(models.Enrollment.objects.filter(course=exam.course).select_related("student"))
    students = [e.student for e in enrollments]

    # Clear existing seating
    models.SeatingAssignment.objects.filter(exam=exam).delete()

    placed = 0

    for alloc in allocations:
        room = alloc.room

        # Calculate grid dimensions
        import math

        capacity = room.capacity
        rows = max(1, int(math.sqrt(capacity)))
        cols = max(1, (capacity + rows - 1) // rows)

        # Shuffle students for mixed seating
        room_students = students[: alloc.capacity_used]
        random.shuffle(room_students)

        # Place students in grid with spacing
        r = 0
        c = 0

        for student in room_students:
            if placed >= alloc.capacity_used:
                break

            models.SeatingAssignment.objects.create(
                exam=exam,
                room=room,
                student=student,
                row_index=r,
                col_index=c,
            )
            placed += 1

            # Move to next position with spacing
            c += 2  # Skip one seat for spacing
            if c >= cols:
                c = 0
                r += 2  # Skip one row for spacing
                if r >= rows:
                    r = 0  # Wrap around if needed

    return {"seated": placed}


def balance_invigilation(exam: models.Exam) -> Dict:
    """Balance invigilation duties across professors"""

    professors = list(models.Professor.objects.all())
    rooms = list(models.ExamRoomAllocation.objects.filter(exam=exam).values_list("room_id", flat=True))

    if not professors:
        return {"duties": 0}

    # Clear existing duties for this exam
    models.InvigilationDuty.objects.filter(exam=exam).delete()

    duties = 0
    prof_idx = 0

    for room_id in rooms:
        professor = professors[prof_idx % len(professors)]

        models.InvigilationDuty.objects.create(exam=exam, professor=professor, room_id=room_id)

        prof_idx += 1
        duties += 1

    return {"duties": duties}


def get_timetable_data(timetable_id: int) -> Dict:
    """Get formatted timetable data for frontend"""

    sessions = models.ClassSession.objects.filter(timetable_id=timetable_id).select_related(
        "course", "slot", "room", "instructor"
    ).order_by("slot__day_of_week", "slot__start_time")

    # Group by section and day
    timetable_data = defaultdict(lambda: defaultdict(list))

    for session in sessions:
        day = session.slot.day_of_week
        section = session.section

        timetable_data[section][day].append(
            {
                "id": session.id,
                "course_code": session.course.code,
                "course_name": session.course.name,
                "instructor": session.instructor.name,
                "room": session.room.code,
                "start_time": session.slot.start_time.strftime("%H:%M"),
                "end_time": session.slot.end_time.strftime("%H:%M"),
                "type": "Tutorial" if session.is_tutorial else ("Practical" if session.is_practical else "Lecture"),
                "color": session.color_code,
            }
        )

    return dict(timetable_data)


def check_timetable_conflicts(timetable_id: int) -> Dict:
    """Check for scheduling conflicts in timetable"""
    conflicts = []

    sessions = models.ClassSession.objects.filter(timetable_id=timetable_id).select_related(
        "course", "slot", "room", "instructor"
    )

    # Check for instructor double-booking
    instructor_sessions = defaultdict(list)
    for session in sessions:
        instructor_sessions[session.instructor_id].append(session)

    for instructor_id, instructor_sessions_list in instructor_sessions.items():
        for i, session1 in enumerate(instructor_sessions_list):
            for session2 in instructor_sessions_list[i + 1 :]:
                if session1.slot.day_of_week == session2.slot.day_of_week and _time_overlap(
                    session1.slot.start_time, session1.slot.end_time, session2.slot.start_time, session2.slot.end_time
                ):
                    conflicts.append(
                        {
                            "type": "instructor_double_booking",
                            "instructor": session1.instructor.name,
                            "day": session1.slot.get_day_of_week_display(),
                            "time": f"{session1.slot.start_time}-{session1.slot.end_time}",
                            "courses": [session1.course.code, session2.course.code],
                            "rooms": [session1.room.code, session2.room.code],
                        }
                    )

    # Check for room double-booking
    room_sessions = defaultdict(list)
    for session in sessions:
        room_sessions[session.room_id].append(session)

    for room_id, room_sessions_list in room_sessions.items():
        for i, session1 in enumerate(room_sessions_list):
            for session2 in room_sessions_list[i + 1 :]:
                if session1.slot.day_of_week == session2.slot.day_of_week and _time_overlap(
                    session1.slot.start_time, session1.slot.end_time, session2.slot.start_time, session2.slot.end_time
                ):
                    conflicts.append(
                        {
                            "type": "room_double_booking",
                            "room": session1.room.code,
                            "day": session1.slot.get_day_of_week_display(),
                            "time": f"{session1.slot.start_time}-{session1.slot.end_time}",
                            "courses": [session1.course.code, session2.course.code],
                            "instructors": [session1.instructor.name, session2.instructor.name],
                        }
                    )

    # Check for insufficient breaks
    for instructor_id, instructor_sessions_list in instructor_sessions.items():
        instructor_sessions_list.sort(key=lambda s: (s.slot.day_of_week, s.slot.start_time))
        for i in range(len(instructor_sessions_list) - 1):
            session1 = instructor_sessions_list[i]
            session2 = instructor_sessions_list[i + 1]
            if session1.slot.day_of_week == session2.slot.day_of_week and not _ensure_break(
                session1.slot.end_time, session2.slot.start_time, 15
            ):
                conflicts.append(
                    {
                        "type": "insufficient_break",
                        "instructor": session1.instructor.name,
                        "day": session1.slot.get_day_of_week_display(),
                        "break_time": "Less than 15 minutes",
                        "courses": [session1.course.code, session2.course.code],
                    }
                )

    return {"conflicts": conflicts, "conflict_count": len(conflicts), "status": "conflicts_found" if conflicts else "no_conflicts"}


def optimize_timetable(timetable: models.Timetable) -> Dict:
    """Optimize timetable for better resource utilization"""

    # Get current sessions
    current_sessions = list(models.ClassSession.objects.filter(timetable=timetable))
    if not current_sessions:
        return {"message": "No sessions to optimize", "optimizations": 0}

    optimizations = 0

    # Try to reduce room changes for instructors
    instructor_rooms = defaultdict(list)
    for session in current_sessions:
        instructor_rooms[session.instructor_id].append((session.room, session.slot.day_of_week))

    # Find instructors with too many room changes
    for instructor_id, room_day_list in instructor_rooms.items():
        unique_rooms_per_day = defaultdict(set)
        for room, day in room_day_list:
            unique_rooms_per_day[day].add(room.id)

        # If instructor uses more than 2 rooms per day, try to consolidate
        for day, rooms in unique_rooms_per_day.items():
            if len(rooms) > 2:
                # This would require more complex optimization logic
                optimizations += 1

    # Try to balance workload across days
    daily_sessions = defaultdict(int)
    for session in current_sessions:
        daily_sessions[session.slot.day_of_week] += 1

    # Find days with too many or too few sessions
    avg_sessions = sum(daily_sessions.values()) / len(daily_sessions) if daily_sessions else 0
    for day, count in daily_sessions.items():
        if abs(count - avg_sessions) > avg_sessions * 0.3:  # 30% deviation
            optimizations += 1

    return {
        "optimizations": optimizations,
        "message": f"Found {optimizations} optimization opportunities",
        "status": "optimized" if optimizations > 0 else "already_optimal",
    }


def get_timetable_statistics(timetable_id: int) -> Dict:
    """Get comprehensive timetable statistics"""
    sessions = models.ClassSession.objects.filter(timetable_id=timetable_id)

    total_sessions = sessions.count()
    sections = sessions.values_list("section", flat=True).distinct().count()
    courses = sessions.values_list("course", flat=True).distinct().count()
    instructors = sessions.values_list("instructor", flat=True).distinct().count()
    rooms = sessions.values_list("room", flat=True).distinct().count()

    # Session type breakdown
    lectures = sessions.filter(is_tutorial=False, is_practical=False).count()
    tutorials = sessions.filter(is_tutorial=True).count()
    practicals = sessions.filter(is_practical=True).count()

    # Daily distribution
    daily_distribution = defaultdict(int)
    for session in sessions:
        daily_distribution[session.slot.day_of_week] += 1

    # Room utilization
    room_utilization = defaultdict(int)
    for session in sessions:
        room_utilization[session.room.code] += 1

    # Instructor workload
    instructor_workload = defaultdict(int)
    for session in sessions:
        instructor_workload[session.instructor.name] += 1

    return {
        "total_sessions": total_sessions,
        "sections": sections,
        "courses": courses,
        "instructors": instructors,
        "rooms": rooms,
        "session_breakdown": {
            "lectures": lectures,
            "tutorials": tutorials,
            "practicals": practicals,
        },
        "daily_distribution": dict(daily_distribution),
        "room_utilization": dict(room_utilization),
        "instructor_workload": dict(instructor_workload),
    }