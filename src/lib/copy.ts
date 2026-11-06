/**
 * Shared copy registry — PRD §15.4.
 * Every user-facing string comes from here so mobile and desktop render identical text (UI-01).
 * Status comments mirror the PRD: CONFIRMED / OBSERVED / PROPOSED. Keys marked "ADDED" are
 * needed by implemented screens and are not yet in the PRD catalogue; they need copy approval.
 */
export const copy = {
  "brand.full": "MO Content Space", // CONFIRMED

  "nav.home": "Home", // OBSERVED
  "nav.ideas": "Ideas", // OBSERVED
  "nav.tasks": "Tasks", // OBSERVED
  "nav.calendar": "Calendar", // OBSERVED
  "nav.settings": "Settings", // OBSERVED
  "nav.capture": "Capture", // ADDED
  "nav.new_idea": "New Idea", // ADDED (desktop sidebar entry, PRD §15.5)
  "nav.reminders": "Reminders", // ADDED
  "nav.import": "Import", // ADDED
  "nav.search": "Search ideas", // ADDED (accessible name)
  "nav.notifications": "Reminders and notifications", // ADDED (accessible name)
  "nav.profile": "Profile and settings", // ADDED (accessible name)

  "home.greeting": "Good morning, {firstName}", // OBSERVED
  "home.greeting.afternoon": "Good afternoon, {firstName}", // ADDED — greeting rules OPEN
  "home.greeting.evening": "Good evening, {firstName}", // ADDED — greeting rules OPEN
  "home.subtitle": "Ready to capture your next big idea?", // OBSERVED
  "home.tasks.title": "Today's Tasks", // OBSERVED
  "home.tasks.remaining": "{count} left", // ADDED (badge seen in mobile design)
  "home.reminders.title": "Reminders", // OBSERVED
  "home.reminders.empty": "No upcoming reminders", // ADDED
  "home.ideas.title": "Recent Ideas", // OBSERVED

  "capture.entry.title": "Quick Capture", // OBSERVED
  "capture.entry.subtitle": "Save a thought, recording, or photo instantly.", // OBSERVED
  "capture.action.write": "Write", // OBSERVED
  "capture.action.record": "Record", // OBSERVED
  "capture.action.photo": "Photo", // OBSERVED
  "capture.action.link": "Save Link", // PROPOSED
  "capture.title.label": "Title (optional)", // OBSERVED
  "capture.body.label": "Idea", // ADDED
  "capture.body.placeholder": "Write your idea here...", // PROPOSED
  "capture.link.label": "Link", // ADDED
  "capture.link.placeholder": "https://", // ADDED
  "capture.note.label": "Note (optional)", // ADDED
  "capture.photo.choose": "Choose photo", // ADDED
  "capture.photo.drop": "Drop an image here, or choose a file", // ADDED
  "capture.record.start": "Start recording", // ADDED
  "capture.record.pause": "Pause", // ADDED
  "capture.record.resume": "Resume", // ADDED
  "capture.record.stop": "Stop", // ADDED
  "capture.record.save": "Save Recording", // ADDED (PRD §15.5 voice flow)
  "capture.record.hint": "Recordings are saved as audio. Transcribe later only if you want to.", // ADDED
  "capture.category.label": "Category (optional)", // ADDED
  "capture.linked_task.label": "Add linked task after saving", // OBSERVED
  "capture.back": "Back to capture modes", // ADDED
  "capture.error.empty": "Add some text, a link, a photo or a recording to save an idea.", // ADDED
  "capture.error.link": "Enter a link that starts with http:// or https://", // ADDED
  "capture.error.file_type": "That file type isn't supported. Choose a JPG, PNG, WEBP, GIF or HEIC image.", // ADDED
  "capture.error.file_size": "That file is larger than {limit} MB.", // ADDED

  "action.view_all": "View all", // OBSERVED
  "action.view_library": "View Library", // OBSERVED
  "action.cancel": "Cancel", // OBSERVED
  "action.save_idea": "Save Idea", // OBSERVED
  "action.save": "Save", // ADDED
  "action.delete": "Delete", // ADDED
  "action.edit": "Edit", // ADDED
  "action.close": "Close", // ADDED
  "action.retry": "Try Again", // PROPOSED
  "action.open": "Open", // ADDED
  "action.confirm_delete": "Delete permanently", // ADDED

  "state.draft_local": "Auto-saving locally", // OBSERVED
  "state.saved_local": "Saved on this device", // PROPOSED
  "state.offline_pending": "Offline: {pendingCount} pending", // OBSERVED
  "state.pending": "{pendingCount} pending sync", // ADDED
  "state.local_only": "Local only — cloud backup off", // ADDED
  "state.syncing": "Syncing...", // PROPOSED
  "state.synced": "All changes synced", // PROPOSED

  "idea.status.new": "New", // CONFIRMED
  "idea.status.in_progress": "In Progress", // CONFIRMED
  "idea.status.completed": "Completed", // CONFIRMED
  "idea.status.label": "Status", // ADDED
  "idea.untitled": "Untitled idea", // ADDED (fallback label, LIB-01)
  "idea.voice_note": "Voice note", // ADDED
  "idea.photo": "Photo", // ADDED
  "idea.link": "Link", // ADDED
  "idea.action.add_task": "Add Task", // PROPOSED
  "idea.attachments": "Attachments", // ADDED
  "idea.add_attachment": "Add attachment", // ADDED
  "idea.linked_tasks": "Linked tasks", // ADDED
  "idea.no_tasks": "No tasks linked to this idea.", // ADDED
  "idea.platforms.title": "Platform plans (optional)", // ADDED
  "idea.platforms.add": "Add platform", // ADDED
  "idea.platforms.notes": "Notes", // ADDED
  "idea.platforms.target": "Planned for", // ADDED
  "idea.platforms.state.draft": "Planning", // ADDED
  "idea.platforms.state.ready": "Ready", // ADDED
  "idea.platforms.state.published": "Published", // ADDED
  "idea.delete.title": "Delete this idea?", // ADDED
  "idea.delete.body": "The idea and its attachments are removed. Linked tasks are kept and unlinked.", // ADDED (PRD TASK-01 proposal)
  "idea.status.manual_hint": "Status only changes when you change it.", // ADDED
  "idea.updated": "Updated {when}", // ADDED

  "ideas.title": "Ideas Library", // ADDED
  "ideas.filter.all": "All", // ADDED
  "ideas.filter.status": "Filter by status", // ADDED
  "ideas.filter.category": "Filter by category", // ADDED
  "ideas.filter.any_category": "All categories", // ADDED
  "ideas.results": "{count} ideas", // ADDED
  "ideas.results.one": "1 idea", // ADDED
  "ideas.empty_search": "No ideas match your search", // ADDED

  "task.action.create": "Create Task", // PROPOSED
  "task.field.title": "Task", // ADDED
  "task.field.title.placeholder": "What's the next step?", // ADDED
  "task.field.due_date": "Due date (optional)", // PROPOSED
  "task.field.due_time": "Due time (optional)", // PROPOSED
  "task.field.reminder": "Reminder (optional)", // PROPOSED
  "task.field.idea": "Linked idea (optional)", // ADDED
  "task.field.no_idea": "No linked idea", // ADDED
  "task.reminder.none": "No reminder", // ADDED
  "task.reminder.at_due": "At due time", // PROPOSED
  "task.reminder.before_10": "10 minutes before", // PROPOSED
  "task.reminder.before_60": "1 hour before", // PROPOSED
  "task.reminder.custom": "Custom time", // PROPOSED
  "task.reminder.needs_time": "Set a due date and time to use this option.", // ADDED
  "task.reminder.past": "Reminder time must be in the future.", // ADDED
  "task.reminder.after_due": "Reminder must be at or before the due time.", // ADDED
  "task.error.title": "Give the task a name.", // ADDED
  "task.action.reopen": "Reopen", // PROPOSED
  "task.action.complete": "Mark task complete", // ADDED (accessible name)
  "task.action.incomplete": "Mark task incomplete", // ADDED (accessible name)
  "task.edit.title": "Edit Task", // ADDED
  "task.delete.title": "Delete this task?", // ADDED
  "task.overdue": "Overdue", // ADDED
  "task.no_date": "No due date", // ADDED
  "tasks.title": "Tasks", // ADDED
  "tasks.tab.today": "Today", // ADDED (PRD TASK-01 groupings)
  "tasks.tab.upcoming": "Upcoming", // ADDED
  "tasks.tab.all": "All", // ADDED
  "tasks.tab.completed": "Completed", // ADDED
  "tasks.empty.upcoming": "Nothing scheduled ahead", // ADDED
  "tasks.empty.all": "No tasks yet", // ADDED
  "tasks.empty.completed": "No completed tasks yet", // ADDED
  "tasks.completed_at": "Completed {when}", // ADDED

  "reminder.action.snooze": "Snooze", // CONFIRMED
  "reminder.action.complete": "Mark Complete", // CONFIRMED
  "reminder.snooze.10": "10 min", // PROPOSED preset (OPEN)
  "reminder.snooze.60": "1 hour", // PROPOSED preset (OPEN)
  "reminder.snoozed": "Snoozed until {when}", // ADDED
  "reminder.due_now": "Due now", // ADDED
  "reminders.title": "Reminders", // ADDED
  "reminders.upcoming": "Upcoming", // ADDED
  "reminders.due": "Needs attention", // ADDED
  "reminders.empty": "No reminders scheduled", // ADDED
  "reminders.permission.off": "Browser notifications are off. Reminders still appear here in the app.", // ADDED
  "reminders.permission.enable": "Enable notifications", // ADDED
  "reminders.permission.denied": "Notifications are blocked in your browser settings. Reminders still appear here in the app.", // ADDED

  "calendar.title": "Calendar", // ADDED
  "calendar.today": "Today", // ADDED
  "calendar.prev": "Previous month", // ADDED
  "calendar.next": "Next month", // ADDED
  "calendar.empty_day": "Nothing scheduled for this day", // ADDED
  "calendar.legend.task": "Task due", // ADDED
  "calendar.legend.reminder": "Reminder", // ADDED

  "voice.action.transcribe": "Transcribe", // CONFIRMED
  "voice.state.transcribing": "Transcribing...", // PROPOSED
  "voice.action.edit": "Edit Transcription", // PROPOSED
  "voice.transcript": "Transcript", // ADDED
  "voice.consent": "Your recording will be sent to a transcription service to convert it to text. The original audio is kept unchanged.", // ADDED (VOICE-01 consent)
  "voice.offline": "Transcription needs an internet connection.", // ADDED
  "voice.not_configured": "Transcription isn't configured on this server yet.", // ADDED
  "voice.failed": "Transcription failed. Your audio is safe.", // ADDED

  "share.title": "Import into MO Content Space", // ADDED
  "share.subtitle": "Paste a link or text, or drop an image, then save it as a new idea or add it to one you already have.", // ADDED
  "share.action.new": "Save as New Idea", // CONFIRMED
  "share.action.existing": "Add to Existing Idea", // CONFIRMED
  "share.search.placeholder": "Search ideas", // PROPOSED
  "share.paste.label": "Link or text", // ADDED
  "share.done.new": "Saved as a new idea.", // ADDED
  "share.done.existing": "Added to “{title}”.", // ADDED

  "settings.title": "Settings", // ADDED
  "settings.account": "Account", // ADDED
  "settings.name": "First name", // ADDED
  "settings.email": "Email", // ADDED
  "settings.sync": "Sync and backup", // ADDED
  "settings.sync.cloud_off": "Cloud backup isn't configured. Everything is saved on this device only.", // ADDED
  "settings.sync.now": "Sync now", // ADDED
  "settings.sync.last": "Last synced {when}", // ADDED
  "settings.sync.never": "Not synced yet", // ADDED
  "settings.notifications": "Notifications", // ADDED
  "settings.notifications.on": "Browser notifications are on.", // ADDED
  "settings.categories": "Categories", // ADDED
  "settings.categories.add": "Add category", // ADDED
  "settings.categories.placeholder": "New category name", // ADDED
  "settings.categories.duplicate": "A category with that name already exists.", // ADDED
  "settings.categories.remove_hint": "Removing a category keeps its ideas.", // ADDED
  "settings.appearance": "Appearance", // ADDED
  "settings.appearance.light": "Light theme. Dark mode is coming once its palette is approved.", // ADDED
  "settings.demo": "Sample data", // ADDED
  "settings.demo.load": "Load sample ideas and tasks", // ADDED
  "settings.demo.hint": "Adds clearly marked demo content so you can explore the app.", // ADDED
  "settings.signout": "Sign out", // ADDED
  "settings.signout.pending": "You have {pendingCount} changes that haven't synced. Signing out now will remove them from this device.", // ADDED (AUTH-01)
  "settings.signout.confirm": "Sign out anyway", // ADDED

  "auth.title": "Welcome to MO Content Space", // ADDED
  "auth.subtitle": "Capture ideas in seconds and turn them into your next post.", // ADDED
  "auth.email.label": "Email", // ADDED
  "auth.email.send": "Email me a sign-in link", // ADDED
  "auth.email.sent": "Check your inbox for a sign-in link.", // ADDED
  "auth.local.label": "What should we call you?", // ADDED
  "auth.local.continue": "Continue on this device", // ADDED
  "auth.local.notice": "Cloud backup isn't configured, so your ideas are saved on this device only.", // ADDED
  "auth.offline": "You're offline. Connect to the internet to sign in for the first time.", // ADDED

  "empty.ideas.title": "No ideas yet", // PROPOSED
  "empty.ideas.body": "Use Quick Capture to save your first thought, recording, photo or link.", // ADDED
  "empty.tasks.title": "No tasks for today", // PROPOSED
  "empty.tasks.body": "Tasks due today show up here.", // ADDED
  "error.permission.mic": "Allow microphone access to record an idea.", // PROPOSED
  "error.sync.title": "Could not sync changes", // PROPOSED
  "error.storage": "Your device is out of storage space. Free some space and try again.", // ADDED
  "error.generic": "Something went wrong. Your saved work is safe.", // ADDED

  "demo.badge": "Demo", // ADDED
  "toast.saved_idea": "Idea saved on this device", // ADDED
  "toast.saved_task": "Task saved", // ADDED
  "toast.deleted": "Deleted", // ADDED
} as const;

export type CopyKey = keyof typeof copy;

export function t(key: CopyKey, vars?: Record<string, string | number>): string {
  let s: string = copy[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
