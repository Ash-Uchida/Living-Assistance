export type RoomStatus =
  | "available"
  | "occupied"
  | "needs_cleaning"
  | "maintenance";

export type Room = {
  number: string;
  status: RoomStatus;
};

export type Stay = {
  id: string;
  name: string;
  room: string;
  checkedInAt: string;
  checkedOutAt: string | null;
};
