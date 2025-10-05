from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from . import models


def seating_chart_pdf(exam: models.Exam) -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    c.setFont("Helvetica-Bold", 14)
    c.drawString(40, height - 40, f"Seating Chart: {exam.course.code} - {exam.course.name}")
    y = height - 80
    c.setFont("Helvetica", 10)
    for alloc in models.ExamRoomAllocation.objects.filter(exam=exam).select_related("room"):
        c.drawString(40, y, f"Room: {alloc.room.code} (Capacity Used: {alloc.capacity_used})")
        y -= 14
        for seat in models.SeatingAssignment.objects.filter(exam=exam, room=alloc.room).select_related("student"):
            c.drawString(60, y, f"{seat.row_index}-{seat.col_index}: {seat.student.roll_number} {seat.student.name}")
            y -= 12
            if y < 60:
                c.showPage()
                y = height - 60
        y -= 10
        if y < 60:
            c.showPage()
            y = height - 60
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()


def timetable_pdf(timetable: models.Timetable) -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(40, height - 40, f"Timetable: {timetable.name}")
    
    # Get timetable data
    sessions = models.ClassSession.objects.filter(timetable=timetable).select_related(
        'course', 'slot', 'room', 'instructor'
    ).order_by('slot__day_of_week', 'slot__start_time')
    
    # Group by section
    sections = {}
    for session in sessions:
        if session.section not in sections:
            sections[session.section] = {}
        day = session.slot.day_of_week
        if day not in sections[session.section]:
            sections[session.section][day] = []
        sections[session.section][day].append(session)
    
    y = height - 80
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    for section, section_data in sections.items():
        # Section header
        c.setFont("Helvetica-Bold", 12)
        c.drawString(40, y, f"Section {section}")
        y -= 20
        
        # Day headers
        x = 40
        day_width = (width - 120) / 7
        for day in days:
            c.setFont("Helvetica-Bold", 10)
            c.drawString(x, y, day[:3])
            x += day_width
        
        y -= 20
        
        # Time slots (simplified)
        time_slots = ['08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00', 
                     '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00']
        
        for time_slot in time_slots:
            x = 40
            c.setFont("Helvetica", 9)
            c.drawString(10, y, time_slot)
            
            for day_idx, day in enumerate(days):
                # Find session for this time slot and day
                session = None
                if day_idx in section_data:
                    for s in section_data[day_idx]:
                        if (f"{s.slot.start_time.strftime('%H:%M')}-{s.slot.end_time.strftime('%H:%M')}" == time_slot):
                            session = s
                            break
                
                if session:
                    c.setFont("Helvetica", 8)
                    c.drawString(x, y, f"{session.course.code}")
                    c.drawString(x, y-10, f"{session.room.code}")
                else:
                    c.drawString(x, y, "-")
                
                x += day_width
            
            y -= 25
            if y < 100:  # New page if needed
                c.showPage()
                y = height - 40
        
        y -= 30  # Space between sections
    
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()


