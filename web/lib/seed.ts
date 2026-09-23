import type { Room, Stay } from "./types";

function stay(
  id: string,
  name: string,
  room: string,
  minutesAgo: number,
): Stay {
  return {
    id,
    name,
    room,
    checkedInAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    checkedOutAt: null,
  };
}

export const seedRooms: Room[] = [
  { number: "101", status: "occupied" },
  { number: "102", status: "available" },
  { number: "103", status: "needs_cleaning" },
  { number: "104", status: "occupied" },
  { number: "105", status: "available" },
  { number: "106", status: "maintenance" },
  { number: "107", status: "occupied" },
  { number: "108", status: "available" },
  { number: "109", status: "needs_cleaning" },
  { number: "110", status: "available" },
  { number: "111", status: "occupied" },
  { number: "112", status: "available" },
];

export const seedStays: Stay[] = [
  stay("s1", "Jane Cole", "101", 140),
  stay("s2", "Robert Hale", "104", 55),
  stay("s3", "Priya Shah", "107", 20),
  stay("s4", "Sam Ortiz", "111", 310),
];
