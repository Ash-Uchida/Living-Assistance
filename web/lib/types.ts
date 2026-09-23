export type RoomStatus =
  | "available"
  | "occupied"
  | "needs_cleaning"
  | "maintenance";

export type Room = {
  number: string;
  status: RoomStatus;
  maintenanceDueAt: string | null;
};

export type Stay = {
  id: string;
  name: string;
  room: string;
  checkedInAt: string;
  expectedOutAt: string | null;
  checkedOutAt: string | null;
};
