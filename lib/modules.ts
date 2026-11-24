// Config-driven definitions for every operational log. One generic page renders each.
export type FieldType = "text" | "textarea" | "number" | "datetime" | "date" | "select" | "boolean" | "tenant" | "photo" | "yna";
export type Field = {
  key: string;
  label: string;
  type?: FieldType;
  options?: string[];
  required?: boolean;
  list?: boolean; // show as a table column
  json?: string; // stored inside this jsonb column instead of a real column
  placeholder?: string;
};
export type Tab = { key: string; label: string; filter: Record<string, string>; fields: Field[] };
export type ModuleDef = {
  path: string;
  title: string;
  description: string;
  table: string;
  group: "activity" | "logs" | "admin";
  roles: string[];
  sort: string;
  fields?: Field[];
  tabs?: Tab[];
  close?: { label: string; set: Record<string, unknown>; timeField: string; when: Record<string, string> };
  search?: string[];
  /** Auto reference stamped on new rows: daily = PFX-ddMMyy-XXX, stamp = PFX-yyyyMMdd-HHmm, year = PFX-yyyy-XXX */
  ref?: { field: string; prefix: string; kind: "daily" | "stamp" | "year"; json?: string };
};

export const BARRIER_ITEMS = ["Entry Barrier A", "Entry Barrier B", "Entry Barrier C", "Exit Barrier W", "Exit Barrier X", "Exit Barrier Y", "Exit Barrier Z", "Tenant Shutter Entry", "Tenant Shutter Exit", "S24 Upper Door", "S24 Lower Door", "S25 Upper Door", "S25 Lower Door", "S26 Upper Door", "S26 Lower Door"];
export const BARRIER_REASONS = ["Just Park", "Lancer Scott", "Retailer", "Lost Ticket", "Ticket Not Working", "Emergency Services", "Contractor", "Delivery", "Other"];
const ALL = ["admin", "manager", "security", "user", "patrol"];
const WITH_CLEANER = [...ALL, "cleaner"];
const now = { type: "datetime" as const, required: true, list: true };

const aio = (key: string, label: string): Field => ({ key, label, json: "details", placeholder: "AIO or describe issue" });

export const MODULES: ModuleDef[] = [
  {
    path: "/checkin", title: "Vehicle Check In/Out", description: "Log vehicles arriving and leaving site.",
    table: "vehicle_visits", group: "activity", roles: ALL, sort: "check_in_time", search: ["licence_plate", "driver_name", "driver_company", "destination_tenant"],
    fields: [
      { key: "licence_plate", label: "Licence plate", required: true, list: true },
      { key: "driver_name", label: "Driver name", list: true },
      { key: "driver_company", label: "Company", list: true },
      { key: "destination_tenant", label: "Destination tenant", type: "tenant", list: true },
      { key: "vehicle_pass", label: "Vehicle pass" },
      { key: "check_in_time", label: "Checked in", ...now },
      { key: "check_out_time", label: "Checked out", type: "datetime", list: true },
      { key: "status", label: "Status", type: "select", options: ["active", "completed"], list: true },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    close: { label: "Check out", set: { status: "completed" }, timeField: "check_out_time", when: { status: "active" } },
  },
  {
    path: "/site-checkin", title: "Person Check In/Out", description: "Visitors, contractors, staff and agency signing in.",
    table: "check_in_records", group: "activity", roles: ALL, sort: "check_in_time", search: ["full_name", "company", "destination", "badge_number"],
    fields: [
      { key: "visit_type", label: "Type", type: "select", options: ["Visitor", "Contractor", "Staff", "Agency"], required: true, list: true },
      { key: "full_name", label: "Full name", required: true, list: true },
      { key: "company", label: "Company", list: true },
      { key: "destination", label: "Visiting / destination", type: "tenant", list: true },
      { key: "badge_number", label: "Badge number" },
      { key: "check_in_time", label: "Checked in", ...now },
      { key: "check_out_time", label: "Checked out", type: "datetime", list: true },
      { key: "status", label: "Status", type: "select", options: ["active", "completed"], list: true },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    close: { label: "Check out", set: { status: "completed" }, timeField: "check_out_time", when: { status: "active" } },
  },
  {
    path: "/roof-plant-access", title: "Roof / Plant Access", description: "High-risk area access — who is on the roof or in plant rooms now.",
    table: "check_in_records", group: "activity", roles: ALL, sort: "check_in_time",
    tabs: [{ key: "roof", label: "Roof / Plant", filter: { visit_type: "RoofAccess" }, fields: [
      { key: "booking_ref", label: "Booking ref", list: true },
      { key: "full_name", label: "Full name", required: true, list: true },
      { key: "destination", label: "Area", required: true, list: true },
      { key: "access_reason", label: "Reason for access", list: true },
      { key: "check_in_time", label: "On roof from", ...now },
      { key: "check_out_time", label: "Off roof", type: "datetime", list: true },
      { key: "status", label: "Status", type: "select", options: ["active", "completed"], list: true },
    ] }],
    close: { label: "Check off roof", set: { status: "completed" }, timeField: "check_out_time", when: { status: "active" } },
  },
  {
    path: "/barrier-log", title: "Barrier Log", description: "Manual barrier, shutter and door raises.",
    table: "barrier_raise_logs", group: "activity", roles: ALL, sort: "raised_at",
    fields: [
      { key: "raised_at", label: "Date / time", ...now },
      { key: "item", label: "Item", type: "select", required: true, options: BARRIER_ITEMS, list: true },
      { key: "reason", label: "Reason", type: "select", required: true, options: BARRIER_REASONS, list: true },
      { key: "reason_other", label: "If other, describe", json: "extra" },
      { key: "vehicle_reg", label: "Vehicle reg", list: true },
      { key: "raised_by", label: "Raised by", list: true },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    path: "/keys", title: "Key Log", description: "Keys and access passes signed out and returned.",
    table: "key_logs", group: "activity", roles: ALL, sort: "issued_at", search: ["item_label", "issued_to", "company"],
    fields: [
      { key: "item_label", label: "Key / pass", required: true, list: true },
      { key: "issued_to", label: "Issued to", required: true, list: true },
      { key: "company", label: "Company", list: true },
      { key: "keys_out", label: "Keys on bunch (out)", type: "number" },
      { key: "keys_returned", label: "Keys returned", type: "number" },
      { key: "issued_at", label: "Issued", ...now },
      { key: "returned_at", label: "Returned", type: "datetime", list: true },
      { key: "status", label: "Status", type: "select", options: ["out", "returned"], list: true },
      { key: "count_mismatch", label: "Count mismatch", type: "boolean", list: true },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    close: { label: "Return", set: { status: "returned" }, timeField: "returned_at", when: { status: "out" } },
  },
  {
    path: "/keys/inventory", title: "Key & Pass Inventory", description: "Every key bunch and access pass on the cabinet.",
    table: "key_inventory", group: "activity", roles: ["admin", "manager", "security"], sort: "key_number",
    fields: [
      { key: "item_type", label: "Type", type: "select", options: ["Key", "Access Pass"], required: true, list: true },
      { key: "key_press_colour", label: "Key press colour", type: "select", options: ["Black", "Green", "Orange", "Red", "Blue/Purple"], list: true },
      { key: "key_number", label: "Key number", list: true },
      { key: "pass_number", label: "Pass number", list: true },
      { key: "total_keys_on_bunch", label: "Keys on bunch", type: "number", list: true },
      { key: "description", label: "Description", list: true },
      { key: "is_active", label: "Active", type: "boolean", list: true },
    ],
  },
  {
    path: "/keys/audit", title: "Key Audit", description: "Monthly key cabinet audits and outstanding issues.",
    table: "key_audits", group: "activity", roles: ALL, sort: "audit_date",
    fields: [
      { key: "audit_date", label: "Audit date", ...now },
      { key: "auditor_name", label: "Auditor", required: true, list: true },
      { key: "status", label: "Status", type: "select", options: ["completed", "issues_outstanding"], list: true },
      { key: "notes", label: "Findings / issues", type: "textarea", list: true },
    ],
  },
  {
    path: "/car-park-patrol", title: "Car Park Patrol", description: "Patrols of Levels N, K, F and the Tenant Car Park.",
    table: "car_park_patrols", group: "activity", roles: ALL, sort: "patrol_start",
    fields: [
      { key: "officer_name", label: "Officer", required: true, list: true },
      { key: "patrol_start", label: "Started", ...now },
      { key: "patrol_end", label: "Finished", type: "datetime", list: true },
      { key: "status", label: "Status", type: "select", options: ["active", "completed"], list: true },
      { key: "notes", label: "Observations", type: "textarea", list: true },
    ],
    close: { label: "End patrol", set: { status: "completed" }, timeField: "patrol_end", when: { status: "active" } },
  },
  {
    path: "/equipment", title: "Equipment Log", description: "Radios, bodycams and patrol phones signed in and out.",
    table: "asset_logs", group: "activity", roles: ALL, sort: "issued_at",
    fields: [
      { key: "asset_label", label: "Equipment", required: true, list: true, placeholder: "e.g. Radio 4" },
      { key: "issued_to", label: "Issued to", required: true, list: true },
      { key: "issued_at", label: "Issued", ...now },
      { key: "returned_at", label: "Returned", type: "datetime", list: true },
      { key: "status", label: "Status", type: "select", options: ["out", "returned"], list: true },
      { key: "in_order", label: "In working order", type: "boolean", list: true },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    close: { label: "Return", set: { status: "returned" }, timeField: "returned_at", when: { status: "out" } },
  },
  {
    path: "/equipment/inventory", title: "Equipment Inventory", description: "Radios, bodycams and patrol phones held on site.",
    table: "asset_inventory", group: "activity", roles: ["admin", "security"], sort: "asset_type",
    fields: [
      { key: "asset_type", label: "Type", type: "select", options: ["Radio", "Bodycam", "Patrol Phone"], required: true, list: true },
      { key: "asset_number", label: "Number", list: true },
      { key: "serial", label: "Serial", list: true },
      { key: "model", label: "Model", list: true },
      { key: "status", label: "Status", type: "select", options: ["available", "out", "faulty", "retired"], list: true },
    ],
  },
  {
    path: "/cctv-log", title: "CCTV Log", description: "Function checks, faults, footage removals and viewings (UK GDPR).",
    table: "cctv_logs", group: "logs", roles: ALL, sort: "logged_at",
    tabs: [
      { key: "function", label: "Function Log", filter: { log_type: "function" }, fields: [
        { key: "day_night", label: "Day/Night", type: "select", options: ["Day", "Night"], json: "details", list: true },
        { key: "logged_at", label: "Date & time of check", ...now },
        { key: "controller_name", label: "Duty controller", required: true, list: true },
        aio("dvrs", "DVRs"), aio("cameras", "Cameras"), aio("control_unit", "Control unit"),
        aio("playback", "Playback"), aio("image_capture", "Image capture"), aio("monitor", "Monitor"),
        { key: "notes", label: "Additional notes", type: "textarea", list: true },
      ] },
      { key: "fault", label: "Fault Log", filter: { log_type: "fault" }, fields: [
        { key: "logged_at", label: "Date / time", ...now },
        { key: "controller_name", label: "Controller", required: true, list: true },
        { key: "description", label: "Fault description", json: "details", type: "textarea", list: true },
        { key: "reported_to", label: "Reported to", json: "details", list: true },
        { key: "notes", label: "Action taken", type: "textarea" },
      ] },
      { key: "removal", label: "Footage Removals", filter: { log_type: "removal" }, fields: [
        { key: "logged_at", label: "Date / time", ...now },
        { key: "reference", label: "Reference / incident no.", list: true },
        { key: "requested_by", label: "Requested by (name & organisation)", json: "details", required: true, list: true },
        { key: "lawful_basis", label: "Lawful basis / reason", json: "details", list: true },
        { key: "media", label: "Media type & ID", json: "details" },
        { key: "controller_name", label: "Released by", list: true },
        { key: "notes", label: "Notes", type: "textarea" },
      ] },
      { key: "viewing", label: "Viewings", filter: { log_type: "viewing" }, fields: [
        { key: "logged_at", label: "Date / time", ...now },
        { key: "viewer", label: "Viewed by", json: "details", required: true, list: true },
        { key: "purpose", label: "Purpose", json: "details", list: true },
        { key: "controller_name", label: "Supervised by", list: true },
        { key: "notes", label: "Notes", type: "textarea" },
      ] },
    ],
  },
  {
    path: "/fire-logbook", title: "Fire LogBook", description: "Fire events, BGU tests, unit tests, sprinklers, drills and door releases.",
    table: "fire_logs", group: "logs", roles: ALL, sort: "logged_at",
    tabs: [
      { key: "event", label: "Fire Event Log", filter: { log_type: "event" }, fields: [
        { key: "reference", label: "Event no.", list: true },
        { key: "logged_at", label: "Date & time", ...now },
        { key: "tested_by", label: "Name", list: true },
        { key: "comments", label: "Comments / information", type: "textarea", list: true },
      ] },
      { key: "bgu", label: "LL Weekly BGU Test", filter: { log_type: "bgu" }, fields: [
        { key: "logged_at", label: "Date of test", ...now },
        { key: "reference", label: "Device number", list: true },
        { key: "result", label: "Result", type: "select", options: ["Satisfactory", "Unsatisfactory"], list: true },
        { key: "tested_by", label: "Tested by", list: true },
        { key: "comments", label: "Comments", type: "textarea" },
      ] },
      { key: "unit", label: "Weekly Unit Test", filter: { log_type: "unit" }, fields: [
        { key: "reference", label: "Unit number", required: true, list: true },
        { key: "tenant_name", label: "Tenant name", json: "details", list: true },
        { key: "week_number", label: "Week", json: "details" },
        { key: "signal_received", label: "Signal received", json: "details", type: "select", options: ["Yes", "No"], list: true },
        { key: "logged_at", label: "Test date", ...now },
        { key: "comments", label: "Issues", type: "textarea" },
      ] },
      { key: "sprinkler", label: "Sprinkler Checks", filter: { log_type: "sprinkler" }, fields: [
        { key: "logged_at", label: "Date", ...now },
        { key: "result", label: "Result", type: "select", options: ["Satisfactory", "Unsatisfactory"], list: true },
        { key: "tested_by", label: "Checked by", list: true },
        { key: "comments", label: "Comments", type: "textarea", list: true },
      ] },
      { key: "drill", label: "Evacuation Drills", filter: { log_type: "drill" }, fields: [
        { key: "logged_at", label: "Date", ...now },
        { key: "reference", label: "Evacuation time", list: true },
        { key: "tested_by", label: "Led by", list: true },
        { key: "comments", label: "Observations", type: "textarea", list: true },
      ] },
      { key: "maintenance", label: "Quarterly Maintenance", filter: { log_type: "maintenance" }, fields: [
        { key: "logged_at", label: "Date", ...now },
        { key: "reference", label: "Contractor", list: true },
        { key: "result", label: "Result", type: "select", options: ["Satisfactory", "Unsatisfactory"], list: true },
        { key: "comments", label: "Comments", type: "textarea" },
      ] },
      { key: "door", label: "Door Release Checks", filter: { log_type: "door" }, fields: [
        { key: "logged_at", label: "Date", ...now },
        { key: "reference", label: "Door", list: true },
        { key: "result", label: "Result", type: "select", options: ["Satisfactory", "Unsatisfactory"], list: true },
        { key: "tested_by", label: "Tested by", list: true },
        { key: "comments", label: "Comments", type: "textarea" },
      ] },
    ],
  },
  {
    path: "/callout-log", title: "Contractor Callout Log", description: "Equipment faults, contractor callouts and attendance.",
    table: "contractor_callouts", group: "logs", roles: ALL, sort: "called_at",
    fields: [
      { key: "reference", label: "Reference", list: true },
      { key: "contractor_id", label: "Contractor", type: "select" },
      { key: "equipment", label: "Equipment", required: true, list: true, type: "select", options: ["Lift", "Escalator", "Automatic door", "Shutter", "Barrier", "BMS", "HVAC", "Fire alarm", "CCTV", "Lighting", "Other"] },
      { key: "equipment_detail", label: "Which one (e.g. Lift 3)", json: "extra", list: true },
      { key: "out_of_service", label: "Equipment out of service?", type: "boolean", json: "extra" },
      { key: "logged_by", label: "Logged by", json: "extra" },
      { key: "fault_description", label: "Fault description", type: "textarea", list: true },
      { key: "called_at", label: "Time called", ...now },
      { key: "attended_at", label: "Engineer attended", type: "datetime", list: true },
      { key: "engineer_name", label: "Engineer name", json: "extra" },
      { key: "fault_fixed", label: "Fault fixed?", type: "boolean", json: "extra" },
      { key: "resolved_at", label: "Back in service", type: "datetime" },
      { key: "status", label: "Status", type: "select", options: ["open", "attended", "resolved"], list: true },
      { key: "resolution_notes", label: "Resolution notes", type: "textarea" },
    ],
    close: { label: "Resolve", set: { status: "resolved" }, timeField: "resolved_at", when: { status: "open" } },
    ref: { field: "reference", prefix: "CO", kind: "year" },
  },
  {
    path: "/contractors", title: "Contractor Inventory", description: "Approved contractors, services and emergency numbers.",
    table: "contractor_inventory", group: "logs", roles: ["admin", "manager", "security"], sort: "company",
    fields: [
      { key: "company", label: "Company", required: true, list: true },
      { key: "services", label: "Services", list: true },
      { key: "emergency_phone", label: "Emergency phone", list: true },
      { key: "email", label: "Email", list: true },
      { key: "sla", label: "SLA", list: true },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
  },
  {
    path: "/weather-log", title: "Weather Log", description: "BMS temperature readings and weather conditions.",
    table: "weather_logs", group: "logs", roles: ALL, sort: "logged_at",
    fields: [
      { key: "reference", label: "Ref", list: true },
      { key: "logged_at", label: "Date / time", ...now },
      { key: "outside_temp", label: "Outside °C", type: "number", list: true },
      { key: "inside_temp", label: "Inside °C", type: "number", list: true },
      { key: "weather", label: "Weather", type: "select", options: ["Clear", "Cloudy", "Rain", "Heavy rain", "Snow", "Ice", "Fog", "Storm"], list: true },
      { key: "wind", label: "Wind", type: "select", options: ["Calm", "Light", "Moderate", "Strong", "Gale"], list: true },
      { key: "recorded_by", label: "Recorded by" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    ref: { field: "reference", prefix: "", kind: "stamp" },
  },
  {
    path: "/spillage-log", title: "Spillage Log", description: "Spillages reported, made safe and cleaned.",
    table: "spillage_logs", group: "logs", roles: WITH_CLEANER, sort: "spilled_at",
    fields: [
      { key: "spilled_at", label: "Date / time", ...now },
      { key: "location", label: "Location", required: true, list: true },
      { key: "spill_type", label: "Spill type", type: "select", options: ["Water", "Food", "Chemical", "Oil", "Bodily", "Glass", "Other"], list: true },
      { key: "spill_type_other", label: "If other, describe" },
      { key: "reference", label: "Ref", json: "extra", list: true },
      { key: "volume_litres", label: "Approx. volume (litres)", type: "number", json: "extra" },
      { key: "actions_taken", label: "Actions taken", type: "textarea", json: "extra" },
      { key: "photo_before", label: "Photo before", type: "photo", json: "extra" },
      { key: "photo_after", label: "Photo after", type: "photo", json: "extra" },
      { key: "reported_by", label: "Reported by", list: true },
      { key: "cleaned_by", label: "Cleaned by" },
      { key: "cleaned_at", label: "Cleaned at", type: "datetime" },
      { key: "status", label: "Status", type: "select", options: ["open", "cleaned"], list: true },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    close: { label: "Mark cleaned", set: { status: "cleaned" }, timeField: "cleaned_at", when: { status: "open" } },
    ref: { field: "reference", prefix: "SP", kind: "stamp", json: "extra" },
  },
  {
    path: "/radon-monitoring", title: "Radon Monitoring", description: "UK HSE workplace levels: target 200 Bq/m³, action 400 Bq/m³.",
    table: "radon_tests", group: "logs", roles: ALL, sort: "test_start",
    fields: [
      { key: "test_start", label: "Test start", ...now },
      { key: "test_finish", label: "Test finish", type: "datetime", list: true },
      { key: "location", label: "Location", required: true, list: true },
      { key: "level", label: "Level (Bq/m³)", type: "number", list: true },
      { key: "status", label: "Status (auto from level)", type: "select", options: ["safe", "target_exceeded", "action_level_exceeded"], list: true },
      { key: "tested_by", label: "Tested by" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    path: "/defect-reports", title: "Site Defect Reports", description: "Defects found around site and their resolution.",
    table: "defect_reports", group: "logs", roles: WITH_CLEANER, sort: "report_datetime",
    fields: [
      { key: "report_datetime", label: "Reported", ...now },
      { key: "location", label: "Location", required: true, list: true },
      { key: "description", label: "Description", type: "textarea", required: true, list: true },
      { key: "reported_by", label: "Reported by", list: true },
      { key: "photo_url", label: "Photo", type: "photo" },
      { key: "status", label: "Status", type: "select", options: ["open", "resolved"], list: true },
      { key: "resolved_by", label: "Resolved by" },
      { key: "resolved_at", label: "Resolved at", type: "datetime" },
    ],
    close: { label: "Resolve", set: { status: "resolved" }, timeField: "resolved_at", when: { status: "open" } },
  },
  {
    path: "/handover", title: "Daily Handover", description: "Shift handover with equipment and systems checklist.",
    table: "handover_reports", group: "logs", roles: ALL, sort: "shift_date",
    fields: [
      { key: "shift_date", label: "Shift date", type: "date", required: true, list: true },
      { key: "shift", label: "Shift", type: "select", options: ["Day", "Night"], list: true },
      { key: "author", label: "Controller", required: true, list: true },
      { key: "q1", label: "All radios accounted for, working & signed in/out?", type: "select", options: ["Yes", "No"], json: "checklist" },
      { key: "q2", label: "All bodycams accounted for, working & signed in/out?", type: "select", options: ["Yes", "No"], json: "checklist" },
      { key: "q3", label: "All keys & passes accounted for & signed in/out?", type: "select", options: ["Yes", "No"], json: "checklist" },
      { key: "q4", label: "BMS system in full working order?", type: "select", options: ["Yes", "No"], json: "checklist" },
      { key: "q5", label: "Access control system in full working order?", type: "select", options: ["Yes", "No"], json: "checklist" },
      { key: "q6", label: "CCTV working & cameras in home positions?", type: "select", options: ["Yes", "No"], json: "checklist" },
      { key: "q7", label: "Fire alarm system all in order?", type: "select", options: ["Yes", "No"], json: "checklist" },
      { key: "escalators", label: "Escalators 1–8 status", json: "checklist", placeholder: "All running / list any out of service" },
      { key: "summary", label: "Shift summary", type: "textarea", list: true },
      { key: "issues", label: "Outstanding issues", type: "textarea" },
    ],
  },
  {
    path: "/found-property", title: "Lost & Found", description: "Cross-check found items against lost reports. Card details shredded end of day; low-value items disposed end of day.",
    table: "found_properties", group: "logs", roles: WITH_CLEANER, sort: "item_date",
    tabs: [
      { key: "found", label: "Found Property", filter: { record_type: "found" }, fields: [
        { key: "item_number", label: "Item no.", list: true },
        { key: "item_date", label: "Date found", ...now },
        { key: "description", label: "Item description", required: true, list: true },
        { key: "found_by", label: "Found by", list: true },
        { key: "where_stored", label: "Where stored", list: true },
        { key: "photo", label: "Photo (black out card details)", type: "photo", json: "extra" },
        { key: "owner_contacted", label: "Owner contacted (inc. method)" },
        { key: "returned", label: "Returned (method/date)" },
        { key: "destroyed", label: "Destroyed (date)" },
        { key: "status", label: "Status", type: "select", options: ["retained", "claimed", "disposed"], list: true },
        { key: "notes", label: "Notes", type: "textarea" },
      ] },
      { key: "lost", label: "Lost Property", filter: { record_type: "lost" }, fields: [
        { key: "item_date", label: "Date reported", ...now },
        { key: "description", label: "Item lost", required: true, list: true },
        { key: "found_by", label: "Reported by (name & contact)", list: true },
        { key: "status", label: "Status", type: "select", options: ["open", "matched", "closed"], list: true },
        { key: "notes", label: "Notes", type: "textarea" },
      ] },
    ],
    ref: { field: "item_number", prefix: "LF", kind: "daily" },
  },
  {
    path: "/vacant-unit-check", title: "Vacant Unit Check", description: "19-point insurance and safety inspection of empty units.",
    table: "vacant_unit_checks", group: "logs", roles: ALL, sort: "checked_at",
    fields: [
      { key: "unit", label: "Unit", required: true, list: true },
      { key: "checked_at", label: "Checked", ...now },
      { key: "inspector", label: "Inspector", list: true },
      ...[
        "Is there safe access to the building / unit?",
        "Will people visiting the property be exposed to asbestos fibers?",
        "Are there any breaches of security measures? (doors, windows, fencing, gates)",
        "Is the unit / building secure? (note any forced-entry damage)",
        "Have the police been informed of the key holder contact number?",
        "Has the letter box been sealed against combustibles and accelerants?",
        "Have all combustible materials been removed?",
        "Has any fly tipping been removed per waste regulations?",
        "Any obvious deterioration/damage to the external fabric?",
        "Is there any damage to glazing?",
        'Have any "sharps" been left on site?',
        "Is there any evidence of drainage failure?",
        "Is automatic fire detection operational and maintained?",
        "Have excessive combustible materials been removed?",
        "Has any fire alarm external link been tested and proven?",
        "Any obvious deterioration/damage to the internal fabric?",
        "Is there any damage to internal glazing?",
        "Is there any evidence of water ingress/flooding?",
        "Is there any obvious roof damage?",
      ].map((q, i): Field => ({ key: `q${i + 1}`, label: `${i + 1}. ${q}`, type: "yna", json: "answers" })),
      { key: "notes", label: "Notes", type: "textarea", list: true },
    ],
  },
  {
    path: "/tenants", title: "Tenants", description: "Units, loading bays, goods lifts and contacts.",
    table: "tenants", group: "admin", roles: ["admin", "manager", "security", "user"], sort: "name", search: ["name", "unit_number", "contact_name"],
    fields: [
      { key: "name", label: "Store / tenant", required: true, list: true },
      { key: "unit_number", label: "Unit" },
      { key: "loading_bays", label: "Loading bays", list: true },
      { key: "goods_lift_number", label: "Goods lift number", list: true },
      { key: "floor", label: "Floor / level", list: true },
      { key: "contact_name", label: "Contact name", list: true },
      { key: "contact_phone", label: "Contact phone", list: true },
      { key: "contact_email", label: "Store email", list: true },
      { key: "is_active", label: "Active", type: "boolean", list: true },
    ],
  },
  {
    path: "/out-of-hours", title: "Out of Hours Contacts", description: "Emergency key holders for each tenant.",
    table: "out_of_hours_contacts", group: "admin", roles: ["admin", "manager", "security", "user"], sort: "name",
    fields: [
      { key: "name", label: "Name", required: true, list: true },
      { key: "role", label: "Role", list: true },
      { key: "phone", label: "Phone", required: true, list: true },
      { key: "email", label: "Email", list: true },
      { key: "notes", label: "Notes (which tenant)", type: "textarea", list: true },
    ],
  },
  {
    path: "/counter-terrorism", title: "Counter Terrorism", description: "CT incidents. On a bomb threat: stay calm, keep the caller talking, record exact words, note caller ID, dial 999.",
    table: "ct_incidents", group: "logs", roles: ALL, sort: "start_datetime",
    fields: [
      { key: "title", label: "Incident", required: true, list: true },
      { key: "start_datetime", label: "Started", ...now },
      { key: "status", label: "Status", type: "select", options: ["active", "monitoring", "resolved"], list: true },
      { key: "is_drill", label: "Drill", type: "boolean", list: true },
      { key: "summary", label: "Log / actions taken", type: "textarea", list: true },
    ],
    close: { label: "Resolve", set: { status: "resolved" }, timeField: "updated_at", when: { status: "active" } },
  },
  {
    path: "/bomb-threats", title: "Bomb Threat Reports", description: "NaCTSO bomb threat checklist.",
    table: "bomb_threats", group: "logs", roles: ALL, sort: "received_at",
    fields: [
      { key: "received_at", label: "Received", ...now },
      { key: "received_by", label: "Received by", required: true, list: true },
      { key: "threat_method", label: "Method", type: "select", options: ["Phone", "Email", "Letter", "In person", "Social media", "Other"], list: true },
      { key: "exact_wording", label: "Exact wording of the threat", type: "textarea", required: true, list: true },
      { key: "where", label: "Where is the bomb right now?", json: "details" },
      { key: "when", label: "When will it go off?", json: "details" },
      { key: "looks_like", label: "What does it look like?", json: "details" },
      { key: "why", label: "Why are you doing this?", json: "details" },
      { key: "caller_details", label: "Caller: voice, accent, background noise, number shown", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: ["open", "closed"], list: true },
    ],
  },
  {
    path: "/team-members", title: "Team Members", description: "Dual Service and Cleaning colleagues.",
    table: "team_members", group: "admin", roles: ["admin", "manager"], sort: "name",
    fields: [
      { key: "name", label: "Name", required: true, list: true },
      { key: "team", label: "Team", type: "select", options: ["Dual Service", "Cleaning"], list: true },
      { key: "role_group", label: "Role", type: "select", options: ["Operations Manager", "Dual Service Manager", "Supervisor", "Controllers", "Dual Service Officers", "Relief Officers", "Cleaning", "Agency"], list: true },
      { key: "phone", label: "Phone", list: true },
      { key: "email", label: "Email" },
      { key: "is_active", label: "Active", type: "boolean" },
    ],
  },
  {
    path: "/training-records", title: "Training Records", description: "Westgrove induction & training — Controller/Dual Service (Sections 1–12) and Cleaning (Sections 1–4).",
    table: "training_records", group: "admin", roles: ["admin", "manager"], sort: "assessed_at",
    fields: [
      { key: "member_id", label: "Colleague", type: "select", required: true, list: true },
      { key: "programme", label: "Programme", type: "select", options: ["Controller/Dual Service", "Cleaning"], list: true },
      { key: "section", label: "Section", list: true },
      { key: "module", label: "Module", list: true },
      { key: "method", label: "Assessment method", type: "select", options: ["Observation", "Orally assessed", "Physical demonstration"] },
      { key: "assessor", label: "Assessor" },
      { key: "assessed_at", label: "Assessed", type: "datetime", list: true },
      { key: "status", label: "Status", type: "select", options: ["pending", "competent", "not yet competent"], list: true },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    path: "/team-rostering", title: "Team Rostering", description: "Shift codes: D 05:30–17:30 · N 17:30–05:30 · E 06:15–16:15 · B 08:15–18:15 · M 11:30–19:30 · L 14:30–23:30 · SD 07:30–17:30 · SB 09:30–17:30.",
    table: "roster_shifts", group: "admin", roles: ["admin", "manager"], sort: "shift_date",
    fields: [
      { key: "member_id", label: "Colleague", type: "select", required: true, list: true },
      { key: "shift_date", label: "Date", type: "date", required: true, list: true },
      { key: "shift_code", label: "Shift", type: "select", options: ["D", "N", "E", "B", "M", "L", "SD", "SB", "OFF", "HOL", "SICK"], required: true, list: true },
      { key: "notes", label: "Notes", list: true },
    ],
  },
  {
    path: "/shift-checkoff", title: "Shift Check Off", description: "Daily hours verification.",
    table: "shift_checkoffs", group: "admin", roles: ["admin", "manager"], sort: "shift_date",
    fields: [
      { key: "member_id", label: "Colleague", type: "select", required: true, list: true },
      { key: "shift_date", label: "Date", type: "date", required: true, list: true },
      { key: "hours", label: "Hours worked", type: "number", list: true },
      { key: "verified_by", label: "Verified by", list: true },
      { key: "notes", label: "Notes" },
    ],
  },
];

export const moduleByPath = (p: string) => MODULES.find((m) => m.path === p)!;

export function radonStatus(level?: number | null) {
  if (level == null || Number.isNaN(level)) return "safe";
  if (level >= 400) return "action_level_exceeded";
  if (level >= 200) return "target_exceeded";
  return "safe";
}
