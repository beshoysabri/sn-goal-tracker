// ======= TOP-LEVEL NOTE STRUCTURE =======

export interface GoalTrackerData {
  version: number;
  goals: Goal[];
  lifeAreas: LifeArea[];
  createdAt: string;
  updatedAt: string;
}

// ======= LIFE AREAS =======

export interface LifeArea {
  id: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
}

// ======= GOAL DEFINITION =======

export interface Goal {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  lifeAreaId?: string;
  parentGoalId?: string;

  // Status
  status: GoalStatus;
  priority: GoalPriority;

  // Tracking
  trackingType: TrackingType;
  targetValue?: number;
  currentValue?: number;
  unit?: string;

  // Dates
  startDate?: string;
  targetDate?: string;
  completedDate?: string;

  // Sub-items
  tasks: GoalTask[];

  // Progress history
  progressEntries: ProgressEntry[];

  // Meta
  sortOrder: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

// ======= ENUMS =======

export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned';
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';
export type TrackingType = 'boolean' | 'percentage' | 'numeric' | 'checklist';
export type ViewType = 'list' | 'timeline' | 'board';
export type TimeScale = 'M' | 'Q' | 'Y' | '5Y';
export type StatusTab = 'active' | 'completed' | 'all';

// ======= GOAL TASKS =======

export interface GoalTask {
  id: string;
  title: string;
  completed: boolean;
  sortOrder: number;
}

// ======= PROGRESS ENTRIES =======

export interface ProgressEntry {
  date: string;
  value: number;
  note?: string;
}
