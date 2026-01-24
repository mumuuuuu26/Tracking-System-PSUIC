const prisma = require("../config/prisma");
const { createGoogleEvent, updateGoogleEvent } = require("./googleCalendar");

exports.createAppointment = async (req, res) => {
    try {
        const { ticketId, date, time, note } = req.body;
        // date: "YYYY-MM-DD", time: "HH:mm"

        const scheduledDate = new Date(`${date}T${time}:00`);
        const endDate = new Date(scheduledDate.getTime() + 60 * 60 * 1000); // 1 Hour duration

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

        if (!ticket.assignedToId) {
            return res.status(400).json({ message: "Ticket must be accepted by IT before booking." });
        }

        const itUser = await prisma.user.findUnique({ where: { id: ticket.assignedToId } });

        // === DOUBLE BOOKING PREVENTION ===
        // 1. Check existing Appointments
        const conflictingAppointment = await prisma.appointment.findFirst({
            where: {
                itSupportId: ticket.assignedToId,
                status: { not: 'cancelled' }, // Ignore cancelled
                scheduledAt: {
                    lt: endDate,
                    gte: scheduledDate
                }
            }
        });

        if (conflictingAppointment) {
            return res.status(400).json({ message: "IT Support is busy at this time (Appointment overlap)." });
        }

        // 2. Check Personal Tasks
        // Personal tasks might be "All Day" (no startTime/endTime) or Specific Time
        // We need to check both.
        // For simplicity in this logic, we check specific time overlaps if task has time.
        // If task is all day? Maybe block everything? 
        // For now, let's assume we check time overlaps properly.

        const conflictingTask = await prisma.personalTask.findFirst({
            where: {
                userId: ticket.assignedToId,
                date: {
                    gte: new Date(date + 'T00:00:00'),
                    lte: new Date(date + 'T23:59:59')
                },
                OR: [
                    {
                        // Task with specific time overlapping
                        startTime: { lt: endDate },
                        endTime: { gt: scheduledDate }
                    },
                    {
                        // All day task (no start/end time implies busy all day?)
                        // If your logic is: no start/end = all day busy
                        startTime: null,
                        endTime: null
                    }
                ]
            }
        });

        if (conflictingTask) {
            return res.status(400).json({ message: "IT Support is busy at this time (Personal Task)." });
        }
        // =================================

        // 1. Create Google Calendar Event
        const eventDetails = {
            summary: `Repair Appointment: ${ticket.title}`,
            description: `Ticket #${ticket.id}: ${ticket.description}\nNote: ${note || '-'}`,
            start: scheduledDate,
            end: endDate,
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
                googleEventId,
                status: 'scheduled'
            }
        });

        // 3. Update Ticket Status?
        await prisma.ticket.update({
            where: { id: parseInt(ticketId) },
            data: {
                status: 'scheduled',
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
    console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.requestReschedule = async (req, res) => {
    try {
        const { appointmentId, newDate, newTime, reason } = req.body;
        // newDate: YYYY-MM-DD, newTime: HH:mm

        const appointment = await prisma.appointment.findUnique({
            where: { id: parseInt(appointmentId) },
            include: { ticket: true }
        });

        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        const newDateTime = new Date(`${newDate}T${newTime}:00`);

        // Update Appointment with Reschedule Request
        const updated = await prisma.appointment.update({
            where: { id: parseInt(appointmentId) },
            data: {
                status: 'reschedule_requested',
                newDate: newDateTime,
                rescheduleReason: reason,
                rescheduleInitiator: 'IT'
            }
        });

        // Notify User
        await prisma.notification.create({
            data: {
                userId: appointment.ticket.createdById, // User ID
                ticketId: appointment.ticketId,
                title: "Reschedule Requested",
                message: `IT requested to reschedule appointment for Ticket #${appointment.ticketId} to ${newDateTime.toLocaleString()}. Reason: ${reason}`,
                type: "appointment"
            }
        });

        res.json(updated);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.respondReschedule = async (req, res) => {
    try {
        const { appointmentId, action } = req.body; // action: 'accept' | 'reject'

        const appointment = await prisma.appointment.findUnique({
            where: { id: parseInt(appointmentId) },
            include: { ticket: true }
        });

        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        if (action === 'accept') {
            // Confirm Move
            // 1. Update Google Calendar
            if (appointment.googleEventId && appointment.newDate) {
                 await updateGoogleEvent(appointment.googleEventId, {
                     summary: `Repair Appointment: ${appointment.ticket.title}`,
                     description: `Rescheduled Appointment`,
                     start: appointment.newDate,
                     end: new Date(appointment.newDate.getTime() + 60 * 60 * 1000)
                 });
            }

            // 2. Update DB
            await prisma.appointment.update({
                where: { id: parseInt(appointmentId) },
                data: {
                    scheduledAt: appointment.newDate,
                    status: 'scheduled',
                    newDate: null,
                    rescheduleReason: null,
                    rescheduleInitiator: null
                }
            });

            // Notify IT
            await prisma.notification.create({
                data: {
                    userId: appointment.itSupportId,
                    ticketId: appointment.ticketId,
                    title: "Reschedule Accepted",
                    message: `User accepted reschedule for Ticket #${appointment.ticketId}.`,
                    type: "appointment"
                }
            });

            res.json({ message: "Reschedule Accepted" });

        } else {
            // Reject - Revert status or Cancel?
            // Usually reverts to 'scheduled' (original time) but notifies IT that user said NO.
            // Or maybe user cancels? Let's assume revert to 'scheduled' and IT has to contact user.

            await prisma.appointment.update({
                where: { id: parseInt(appointmentId) },
                data: {
                    status: 'scheduled', // Back to original
                    newDate: null,
                    rescheduleReason: null,
                    rescheduleInitiator: null
                }
            });

            // Notify IT
            await prisma.notification.create({
                data: {
                    userId: appointment.itSupportId,
                    ticketId: appointment.ticketId,
                    title: "Reschedule Rejected",
                    message: `User rejected reschedule for Ticket #${appointment.ticketId}.`,
                    type: "appointment"
                }
            });

            res.json({ message: "Reschedule Rejected" });
        }

    } catch (err) {
        console.error(err);
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
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
}

exports.getITAvailability = async (req, res) => {
    try {
        const { start, end } = req.query; // YYYY-MM-DD

        // If no specific IT is requested, typically we'd look for ANY available, 
        // but for this specific "User seeing IT calendar" requirement, 
        // they might be viewing a generic IT schedule or a specific one.
        // Let's return ALL IT tasks/appointments for now to show "Busy" slots.
        // Or better, let's just fetch everything for the given range.

        const startDate = new Date(start);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);

        // 1. Get Appointments
        const appointments = await prisma.appointment.findMany({
            where: {
                scheduledAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                id: true,
                scheduledAt: true,
                itSupportId: true,
                ticket: {
                    select: { title: true }
                }
            }
        });

        // 2. Get Personal Tasks
        const personalTasks = await prisma.personalTask.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                id: true,
                date: true,
                startTime: true,
                endTime: true,
                userId: true,
                title: true,
                description: true, // Include description
                color: true
            }
        });

        // Merge and format
        const events = [
            ...appointments.map(a => ({
                type: 'appointment',
                date: a.scheduledAt,
                endTime: new Date(new Date(a.scheduledAt).getTime() + 60 * 60 * 1000), // +1 Hour
                title: `Appointment: ${a.ticket?.title || 'Unknown'}`,
                description: 'User appointment'
            })),
            ...personalTasks.map(t => ({
                type: 'task',
                date: t.startTime || t.date,
                endTime: t.endTime,
                title: t.title,
                description: t.description,
                color: t.color
            }))
        ];

        res.json(events);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};
