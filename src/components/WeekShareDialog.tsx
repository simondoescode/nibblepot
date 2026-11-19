import { createWeekShareLink } from '../lib/weekShare';
import type { WeekSlot } from '../types';
import { SnapshotShareDialog } from './SnapshotShareDialog';

export function WeekShareDialog({ week, slots, servings }: { week: string; slots: WeekSlot[]; servings: Record<string, number> }) {
  return <SnapshotShareDialog subject="week" buttonLabel="Share week" title="Share this week"
    description="Send this week’s dinners and serving sizes. Anyone with the link can view this snapshot."
    note="Later changes to your planner won’t change this link. Share again to send an updated plan."
    inputLabel="Week share link" shareText="Here’s our dinner plan for the week."
    createLink={() => createWeekShareLink(window.location.origin, week, slots, servings)}/>;
}
