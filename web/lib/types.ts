export type Role =
  | "ops_manager"
  | "housekeeper"
  | "hk_director"
  | "nurse_station"
  | "kitchen"
  | "dining_manager";

export type ModuleId =
  | "rooms"
  | "housekeeping"
  | "dining"
  | "dining_order"
  | "dining_kitchen"
  | "dining_temps"
  | "dining_checklist"
  | "dining_survey"
  | "dining_manager"
  | "calendar"
  | "access";

export type AccessMap = Record<Role, ModuleId[]>;

export type Occupancy = "vacant" | "occupied" | "needs_cleaning";
export type CleaningStatus = "not_started" | "in_progress" | "done";
export type Meal = "breakfast" | "lunch" | "dinner";
export type OrderType = "dine_in" | "tray" | "to_go";
export type OrderStatus = "pending" | "preparing" | "served";
export type Thumbs = "up" | "down";

export type Staff = {
  id: string;
  label: string;
  role: Role;
};

export type EmployeeAccount = {
  id: string;
  email: string;
  role: Role | null;
};

export type Room = {
  number: string;
  assignedStaffId: string;
  occupancy: Occupancy;
};

export type Stay = {
  id: string;
  roomNumber: string;
  startsOn: string;
  endsOn: string;
  checkedInAt: number;
  checkedOutAt: number | null;
};

export type CleaningTask = {
  id: string;
  roomNumber: string;
  staffId: string;
  status: CleaningStatus;
  startedAt: number | null;
  finishedAt: number | null;
};

export type MenuItem = {
  id: string;
  meal: Meal;
  name: string;
};

export type MealOrder = {
  id: string;
  roomNumber: string;
  meal: Meal;
  itemId: string;
  type: OrderType;
  status: OrderStatus;
  createdAt: number;
  startedAt: number | null;
  servedAt: number | null;
  stationId: string;
};

export type Fridge = {
  id: string;
  label: string;
};

export type FridgeLog = {
  id: string;
  fridgeId: string;
  tempF: number;
  recordedAt: number;
  stationId: string;
};

export type ChecklistItem = {
  id: string;
  label: string;
};

export type ChecklistCompletion = {
  itemId: string;
  completedAt: number | null;
  stationId: string | null;
};

export type Feedback = {
  id: string;
  meal: Meal;
  itemId: string;
  thumbs: Thumbs;
  createdAt: number;
};

export type Supply = {
  id: string;
  label: string;
  count: number;
};

export type EventKind = "activity" | "maintenance";

export type CalendarEvent = {
  id: string;
  title: string;
  kind: EventKind;
  startsAt: number;
  roomNumber: string | null;
};

export type AppState = {
  facilityId: string;
  role: Role;
  staffId: string;
  signedInEmail: string;
  employees: EmployeeAccount[];
  access: AccessMap;
  rooms: Room[];
  stays: Stay[];
  staff: Staff[];
  tasks: CleaningTask[];
  menu: MenuItem[];
  orders: MealOrder[];
  fridges: Fridge[];
  temps: FridgeLog[];
  checklist: ChecklistItem[];
  checklistDone: ChecklistCompletion[];
  feedback: Feedback[];
  events: CalendarEvent[];
  supplies: Supply[];
  census: number;
  invoiceTotal: number;
};

export type NavLink = { href: string; label: string };
