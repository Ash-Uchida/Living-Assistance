import { daysFromNow } from "./dates";
import type { Room, Stay } from "./types";

function stay(
  id: string,
  name: string,
  room: string,
  inDays: number,
  outDays: number,
): Stay {
  return {
    id,
    name,
    room,
    checkedInAt: daysFromNow(inDays, 9),
    expectedOutAt: daysFromNow(outDays, 11),
    checkedOutAt: null,
  };
}

export const seedRooms: Room[] = [
  { number: "101", status: "occupied", maintenanceDueAt: null },
  { number: "102", status: "available", maintenanceDueAt: null },
  { number: "103", status: "needs_cleaning", maintenanceDueAt: null },
  { number: "104", status: "occupied", maintenanceDueAt: null },
  { number: "105", status: "available", maintenanceDueAt: null },
  { number: "106", status: "maintenance", maintenanceDueAt: daysFromNow(2) },
  { number: "107", status: "occupied", maintenanceDueAt: null },
  { number: "108", status: "available", maintenanceDueAt: daysFromNow(10) },
  { number: "109", status: "needs_cleaning", maintenanceDueAt: null },
  { number: "110", status: "available", maintenanceDueAt: null },
  { number: "111", status: "occupied", maintenanceDueAt: daysFromNow(18) },
  { number: "112", status: "available", maintenanceDueAt: null },
];

export const seedStays: Stay[] = [
  stay("s1", "Jane Cole", "101", -3, 4),
  stay("s2", "Robert Hale", "104", -1, 2),
  stay("s3", "Priya Shah", "107", 0, 6),
  stay("s4", "Sam Ortiz", "111", -8, 1),
];
