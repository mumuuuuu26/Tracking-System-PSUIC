const prisma = require("../config/prisma");
const { createGoogleEvent, updateGoogleEvent } = require("./googleCalendar");

exports.createAppointment = async (req, res) => {
    try {
        const { ticketId, date, time, note } = req.body;
        // date: "YYYY-MM-DD", time: "HH:mm"

        const scheduledDate = new Date(`${date}T${time}:00`);

        // Check if ticket exists and belongs to user (if user is requesting)
        // or is assigned to IT (if IT is requesting)
        // For simplicity, we assume robust middleware checks or we check here:

        const ticket = await prisma.ticket.findUnique({
            where: { id: parseInt(ticketId) },
            include: {
                createdBy: true,
                appointment: true
            }
        });

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        if (ticket.appointment) {
            return res.status(400).json({ message: "Ticket already has an appointment" });
        }

        // Auto assign IT if not assigned (Picking a default IT or the first available, 
        // BUT usually appointments are made AFTER an IT accepts the job.
        // If user is booking, it implies an IT has accepted? Or user requests a time slot and ANY IT picks it up?
        // Requirement: "User booking repair time". Usually implies "IT accepted -> User picks time" OR "User picks time -> IT accepts".
        // Let's assume IT has accepted (status: in_progress) OR we assign to the first available IT / or a default IT for now if unknown.
        // Ideally, `assignedToId` should be set. If not, we can't really book *with a specific person*.
        // If ticket status is 'pending', maybe this action assigns it?
        // Let's check ticket status.

        if (!ticket.assignedToId) {
            return res.status(400).json({ message: "Ticket must be accepted by IT before booking." });
        }

        const itUser = await prisma.user.findUnique({ where: { id: ticket.assignedToId } });

        // 1. Create Google Calendar Event
        const eventDetails = {
            summary: `Repair Appointment: ${ticket.title}`,
            description: `Ticket #${ticket.id}: ${ticket.description}\nNote: ${note || '-'}`,
            start: scheduledDate,
            end: new Date(scheduledDate.getTime() + 60 * 60 * 1000), // Default 1 hour
            attendees: [
                { email: ticket.createdBy.email },
                { email: itUser.email }
            ]
        };

        const googleEventId = await createGoogleEvent(eventDetails);

        // 2. Create DB Appointment
        const appointment = await prisma.appointment.create({
            data: {
                ticketId: parseInt(ticketId),
                itSupportId: ticket.assignedToId,
                scheduledAt: scheduledDate,
                note,
                googleEventId
            }
        });

        // 3. Update Ticket Status?
        await prisma.ticket.update({
            where: { id: parseInt(ticketId) },
            data: {
                status: 'scheduled', // Make sure 'scheduled' is a valid status in your frontend/logic
                logs: {
                    create: {
                        action: 'Schedule',
                        detail: `Appointment booked for ${scheduledDate.toLocaleString()}`,
                        updatedById: req.user.id
                    }
                }
            }
        });

        // 4. Create Notification for IT
        await prisma.notification.create({
            data: {
                userId: ticket.assignedToId,
                ticketId: ticket.id,
                title: "New Appointment",
                message: `User booked an appointment for ticket #${ticket.id} at ${scheduledDate.toLocaleString()}`,
                type: "appointment"
            }
        });

        res.json(appointment);

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getAvailableSlots = async (req, res) => {
    // Return available slots for a given date? 
    // Or just simple check.
    // For now, let's just return success to allow booking any time 
    // that isn't already taken by THIS IT support.
    try {
        const { date, itId } = req.query;
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);

        const appointments = await prisma.appointment.findMany({
            where: {
                itSupportId: parseInt(itId),
                scheduledAt: {
                    gte: targetDate,
                    lt: nextDate
                }
            },
            select: { scheduledAt: true }
        });

        // Simple logic: 9:00 to 17:00
        const busyTimes = appointments.map(a => new Date(a.scheduledAt).getHours());

        res.json({ busyHours: busyTimes });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
}
