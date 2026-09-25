export type Role =
  | "ops_manager"
  | "housekeeper"
  | "hk_director"
  | "nurse_station"
  | "kitchen"
  | "dining_manager"
  | "maintenance"
  | "activities";

export type ModuleId =
  | "rooms"
  | "housekeeping"
  | "hk_assign"
  | "dining"
  | "dining_order"
  | "dining_kitchen"
  | "dining_menus"
  | "dining_temps"
  | "dining_checklist"
  | "dining_survey"
  | "dining_manager"
  | "maintenance"
  | "maintenance_crew"
  | "calendar"
  | "attendance"
  | "pulse"
  | "residents"
  | "notices_send"
  | "access";

export type Department = "housekeeping" | "dining" | "maintenance" | "activities";

export type AccessMap = Record<Role, ModuleId[]>;

export type Occupancy = "vacant" | "occupied" | "needs_cleaning";
export type CleanKind = "routine" | "deep";
export type CleaningStatus = "not_started" | "in_progress" | "done";
export type Meal = "breakfast" | "lunch" | "dinner";
export type OrderType = "dine_in" | "to_go";
export type OrderStatus = "pending" | "preparing" | "ready" | "complete";
export type Thumbs = "up" | "down";
export type MaintenanceStatus = "open" | "in_progress" | "waiting" | "done";
export type MaintenancePriority = "routine" | "urgent";

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
  building: string;
  occupancy: Occupancy;
  /** Employee id of the housekeeper who owns this room's routine cleans. */
  assignedTo: string | null;
  /** Weekdays for routine cleans, 0 = Sunday. */
  cleanDays: number[];
};

export type Stay = {
  id: string;
  roomNumber: string;
  startsOn: string;
  endsOn: string;
  checkedInAt: number;
  checkedOutAt: number | null;
};

export type CleanNote = {
  id: string;
  text: string;
  at: number;
  by: string;
};

export type CleanJob = {
  id: string;
  roomNumber: string;
  kind: CleanKind;
  dueOn: string;
  createdAt: number;
  assignedTo: string | null;
  status: CleaningStatus;
  startedAt: number | null;
  finishedAt: number | null;
  checked: string[];
  notes: CleanNote[];
};

export type MenuItem = {
  id: string;
  meal: Meal;
  name: string;
};

export type MenuFile = {
  meal: Meal;
  fileName: string;
  kind: "image" | "pdf";
  dataUrl: string;
  uploadedAt: number;
};

export type MealOrder = {
  id: string;
  roomNumber: string;
  meal: Meal;
  /** Menu item id, or null for an off-menu special order. */
  itemId: string | null;
  special: string;
  type: OrderType;
  status: OrderStatus;
  createdAt: number;
  startedAt: number | null;
  readyAt: number | null;
  completedAt: number | null;
  placedBy: string;
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

export type MaintenanceUpdate = {
  id: string;
  status: MaintenanceStatus;
  note: string;
  at: number;
  by: string;
};

export type MaintenanceRequest = {
  id: string;
  title: string;
  roomNumber: string | null;
  area: string;
  details: string;
  photos: string[];
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  createdAt: number;
  createdBy: string;
  /** Employee id on the crew who owns the fix. */
  assignedTo: string | null;
  seenAt: number | null;
  assignedAt: number | null;
  fixedAt: number | null;
  cleanJobId: string | null;
  updates: MaintenanceUpdate[];
};

export type Notice = {
  id: string;
  at: number;
  title: string;
  body: string;
  href: string;
  toRoles: Role[];
  toEmails: string[];
  readBy: string[];
};

export type EventKind = "activity" | "maintenance" | "dining" | "housekeeping";

export type CalendarEvent = {
  id: string;
  title: string;
  kind: EventKind;
  startsAt: number;
  allDay: boolean;
  building: string | null;
  /** Free text like "Dining room" or "Lobby". */
  place: string;
  roomNumber: string | null;
  /** Room numbers of residents who attended. */
  attendance: string[];
  attendanceAt: number | null;
};

export type FeedbackKind = "complaint" | "compliment";

export type FeedbackTopic =
  | "food_temperature"
  | "food_taste"
  | "repairs_slow"
  | "room_cleanliness"
  | "noise"
  | "activity_variety"
  | "staff_response";

/** Something a resident said, logged by room number. No names or health details. */
export type RoomFeedback = {
  id: string;
  roomNumber: string;
  department: Department;
  kind: FeedbackKind;
  topic: FeedbackTopic;
  text: string;
  at: number;
  by: string;
};

/** A planned staff visit to a room to follow up on how things are going. */
export type RoomVisit = {
  id: string;
  roomNumber: string;
  on: string;
  reason: string;
  createdBy: string;
  doneAt: number | null;
};

export type StaffingDay = {
  on: string;
  department: Department;
  needed: number;
  scheduled: number;
};

export type AppState = {
  facilityId: string;
  role: Role;
  staffId: string;
  signedInEmail: string;
  /** "email" = a real Supabase session (verified code); missing or "demo" = a demo account from the fake list. */
  signedInWith?: "demo" | "email";
  employees: EmployeeAccount[];
  access: AccessMap;
  rooms: Room[];
  stays: Stay[];
  staff: Staff[];
  cleanJobs: CleanJob[];
  cleanChecklists: Record<CleanKind, ChecklistItem[]>;
  cleanTargets: Record<CleanKind, number>;
  menu: MenuItem[];
  menuFiles: MenuFile[];
  orders: MealOrder[];
  fridges: Fridge[];
  temps: FridgeLog[];
  checklist: ChecklistItem[];
  checklistDone: ChecklistCompletion[];
  feedback: Feedback[];
  maintenance: MaintenanceRequest[];
  notices: Notice[];
  buildings: string[];
  events: CalendarEvent[];
  roomFeedback: RoomFeedback[];
  visits: RoomVisit[];
  staffing: StaffingDay[];
  supplies: Supply[];
  census: number;
  invoiceTotal: number;
};

export type NavLink = { href: string; label: string };
