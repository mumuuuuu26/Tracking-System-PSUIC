jest.mock("../../config/prisma", () => ({
  $transaction: jest.fn(),
}));

jest.mock("../../controllers/googleCalendar", () => ({
  listGoogleEvents: jest.fn(),
}));

const prisma = require("../../config/prisma");
const { listGoogleEvents } = require("../../controllers/googleCalendar");
const { syncUserCalendar } = require("../../utils/syncService");

describe("syncUserCalendar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes old range and skips createMany when google returns no events", async () => {
    listGoogleEvents.mockResolvedValue([]);

    const tx = {
      personalTask: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };

    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    const synced = await syncUserCalendar(101, "calendar@example.com");

    expect(synced).toBe(0);
    expect(tx.personalTask.deleteMany).toHaveBeenCalledTimes(1);
    expect(tx.personalTask.createMany).not.toHaveBeenCalled();
  });

  it("skips malformed events and inserts only valid ranges", async () => {
    listGoogleEvents.mockResolvedValue([
      { summary: "missing start field" },
      {
        summary: "timed without end",
        start: { dateTime: "2026-02-24T09:30:00.000Z" },
      },
      {
        summary: "all day without end",
        start: { date: "2026-02-24" },
      },
      {
        summary: "bad date",
        start: { dateTime: "not-a-date" },
      },
    ]);

    const tx = {
      personalTask: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };

    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    const synced = await syncUserCalendar(501, "team-calendar@example.com");

    expect(synced).toBe(2);
    expect(tx.personalTask.createMany).toHaveBeenCalledTimes(1);
    const createManyPayload = tx.personalTask.createMany.mock.calls[0][0];
    expect(Array.isArray(createManyPayload.data)).toBe(true);
    expect(createManyPayload.data).toHaveLength(2);
    expect(createManyPayload.skipDuplicates).toBe(true);

    createManyPayload.data.forEach((item) => {
      expect(item.userId).toBe(501);
      expect(item.date).toBeInstanceOf(Date);
      expect(item.startTime).toBeInstanceOf(Date);
      expect(item.endTime).toBeInstanceOf(Date);
    });
  });
});
