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
  "capture.menu.write": "Write Idea", // DESIGN
  "capture.menu.write.sub": "Text and notes", // DESIGN
  "capture.menu.record": "Record Voice", // DESIGN
  "capture.menu.record.sub": "Spontaneous audio", // DESIGN
  "capture.menu.photo": "Add Photo", // DESIGN
  "capture.menu.photo.sub": "Visual references", // DESIGN
  "capture.menu.link": "Save Link", // DESIGN
  "capture.menu.link.sub": "Web inspiration", // DESIGN
  "capture.menu.subtitle": "What's on your mind?", // DESIGN
  "capture.menu.close": "Close Menu", // DESIGN
  "capture.action.record": "Record", // OBSERVED
  "capture.action.photo": "Photo", // OBSERVED
  "capture.action.link": "Save Link", // PROPOSED
  "capture.title.label": "Title (optional)", // OBSERVED
  "capture.body.label": "Idea", // ADDED
  "capture.body.placeholder": "What's on your mind?", // DESIGN (Write_Idea)
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
  "task.reminder.before_15": "15 minutes before", // DESIGN (Task_Composer)
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

  // ---- UX Pilot designs (Nov 6) — "DESIGN" = copy taken from the approved UX Pilot frames ----
  "welcome.headline.1": "Catch ideas.", // DESIGN
  "welcome.headline.2": "Make them happen.", // DESIGN
  "welcome.subtitle": "A calm space for creators to collect inspiration and take action.", // DESIGN
  "welcome.private": "Encrypted & Private", // DESIGN
  "welcome.private.local": "Private to this device", // ADDED (local-only: no claim of encryption)
  "welcome.backup": "Cloud Backup", // DESIGN
  "welcome.backup.local": "Saved on this device", // ADDED (local-only deployments)
  "welcome.create": "Create Account", // DESIGN
  "welcome.signin": "Sign In", // DESIGN
  "legal.continue": "By continuing, you agree to our", // DESIGN
  "legal.create": "By creating an account, you agree to our", // DESIGN
  "legal.terms": "Terms of Service", // DESIGN
  "legal.and": "and", // DESIGN
  "legal.privacy": "Privacy Policy", // DESIGN

  "auth.signin.title": "Sign In", // DESIGN
  "auth.signin.subtitle": "Access your creative sanctuary and resume your work.", // DESIGN
  "auth.signin.panel.title": "Welcome Back", // DESIGN
  "auth.signin.panel.quote": "“Your next inspiration is waiting.”", // DESIGN
  "auth.signin.new": "New to MO Content Space?", // DESIGN (brand per PRD D-07)
  "auth.signin.secure": "Secure Verification", // DESIGN
  "auth.signin.error": "That email and password don't match an account.", // ADDED
  "auth.forgot": "Forgot?", // DESIGN
  "auth.password": "Password", // DESIGN
  "auth.password.show": "Show", // DESIGN
  "auth.password.hide": "Hide", // ADDED
  "auth.password.hint": "Must be at least 8 characters.", // DESIGN
  "auth.email": "Email Address", // DESIGN
  "auth.email.placeholder": "you@example.com", // ADDED (design shows fixture "alex@creator.space")
  "auth.name": "Full Name", // DESIGN
  "auth.register.title": "Create Account", // DESIGN
  "auth.register.subtitle": "Join a calm space designed for intentional creators.", // DESIGN
  "auth.register.panel.quote": "“Every great creation starts with a single, captured spark.”", // DESIGN
  "auth.register.submit": "Get Started", // DESIGN
  "auth.register.have": "Already have an account?", // DESIGN
  "auth.register.confirm": "Check your inbox to confirm your email, then sign in.", // ADDED
  "auth.local.notice2": "Cloud backup isn't configured on this server, so your account and ideas stay on this device. No password is needed.", // ADDED
  "auth.reset.title": "Reset Password", // DESIGN
  "auth.reset.subtitle": "Enter your email and we'll send you a link to resume your journey.", // DESIGN
  "auth.reset.submit": "Send Reset Link", // DESIGN
  "auth.reset.sent.title": "Check your inbox", // DESIGN
  "auth.reset.sent.body": "We've sent a recovery link to", // DESIGN
  "auth.reset.again": "Didn't receive it?", // DESIGN
  "auth.reset.resend": "Resend Link Now", // DESIGN
  "auth.reset.spam": "Please check your spam folder if it doesn't arrive within 2 minutes.", // DESIGN
  "auth.reset.back": "Back to Sign In", // DESIGN
  "auth.reset.invalid": "Invalid email address", // DESIGN
  "auth.reset.expired": "Reset Link Expired", // DESIGN
  "auth.reset.expired.body": "Please request a new reset link.", // DESIGN
  "auth.reset.new.title": "Choose a new password", // ADDED
  "auth.reset.new.submit": "Update Password", // ADDED
  "auth.reset.local": "Password reset needs cloud accounts, which aren't configured on this server.", // ADDED

  "onboarding.skip": "Skip", // DESIGN
  "onboarding.next": "Next Step", // DESIGN
  "onboarding.continue": "Continue", // DESIGN
  "onboarding.finish": "Start Capturing", // ADDED (last step)
  "onboarding.1.step": "Capture", // DESIGN
  "onboarding.1.stepsub": "Fleeting Sparks", // DESIGN
  "onboarding.1.title.a": "Flash of", // DESIGN
  "onboarding.1.title.b": "brilliance?", // DESIGN
  "onboarding.1.body": "Capture it before it's gone. Whether it's a quick note, a voice recording, or a photo reference—capture happens in seconds.", // DESIGN
  "onboarding.1.chip": "No Title Needed", // DESIGN
  "onboarding.1.tip.title": "Pro Tip", // DESIGN
  "onboarding.1.tip": "No title needed. Just capture and categorize later. Your thoughts are auto-saved locally.", // DESIGN
  "onboarding.2.step": "Curate", // DESIGN
  "onboarding.2.stepsub": "Your Sanctuary", // DESIGN
  "onboarding.2.title.a": "A Sanctuary", // DESIGN
  "onboarding.2.title.b": "for Ideas.", // DESIGN
  "onboarding.2.body": "Browse your library of sparks. Filter by status, categorize by project, and watch your initial thoughts evolve into concepts.", // DESIGN
  "onboarding.2.chip.a": "Transcribe on demand", // CHANGED from "Auto-Transcript" — PRD VOICE-01 forbids automatic transcription
  "onboarding.2.chip.b": "Categories", // CHANGED from "Mood Boards" — not an MVP feature
  "onboarding.3.step": "Execute", // DESIGN
  "onboarding.3.stepsub": "Make it Happen", // DESIGN
  "onboarding.3.title.a": "Make it", // DESIGN
  "onboarding.3.title.b": "happen.", // DESIGN
  "onboarding.3.body": "Convert sparks into action. Link tasks to your ideas, set reminders, and define platform-specific plans.", // DESIGN
  "onboarding.3.playgrounds": "Choose your playgrounds (optional):", // DESIGN

  "editor.write": "Write Idea", // DESIGN
  "editor.record": "Record Voice", // DESIGN
  "editor.media": "Capture Media", // DESIGN
  "editor.attach": "Attach Media", // DESIGN
  "editor.task_after": "Create a task after saving", // DESIGN
  "editor.autosave": "Auto-saving locally • Offline ready", // DESIGN
  "editor.leave.title": "Unsaved Changes", // DESIGN
  "editor.leave.body": "Are you sure you want to leave? Your changes haven't been saved yet.", // DESIGN
  "editor.leave.stay": "Stay and Edit", // DESIGN
  "editor.leave.discard": "Discard Changes", // DESIGN

  "record.recording": "Recording...", // DESIGN
  "record.paused": "Paused", // ADDED
  "record.ready": "Ready to record", // ADDED
  "record.done": "Recorded", // DESIGN
  "record.delete": "Delete", // DESIGN
  "record.stop": "Stop", // DESIGN
  "record.pause": "Pause recording", // ADDED (a11y)
  "record.resume": "Resume recording", // ADDED (a11y)
  "record.start": "Start recording", // ADDED (a11y)
  "record.offline": "Offline recording enabled", // DESIGN
  "record.denied.title": "Mic Access Denied", // DESIGN
  "record.denied.body": "Microphone access is required to record your thoughts. Please enable it in your browser settings.", // DESIGN
  "record.denied.retry": "Try Again", // DESIGN
  "record.denied.back": "Go Back", // DESIGN

  "media.drop": "Drop files here or browse", // DESIGN
  "media.supports": "Supports JPG, PNG, WEBP and HEIC images.", // CHANGED — design says PDF; documents aren't MVP-confirmed (MEDIA-01)
  "media.take": "Take Photo", // DESIGN
  "media.choose": "Choose from Photos", // DESIGN
  "media.link": "Paste a link", // DESIGN
  "media.note.placeholder": "Add a note to this capture (optional)", // DESIGN
  "media.attachments": "Attachments", // DESIGN
  "media.kind.photo": "Photo", // DESIGN
  "media.kind.screenshot": "Screenshot", // DESIGN
  "media.invalid": "Invalid file", // DESIGN
  "media.invalid.sub": "Unsupported format", // DESIGN
  "media.drag_hint": "Drag files directly into MO Content Space to capture instantly.", // DESIGN
  "media.remove": "Remove attachment", // ADDED (a11y)

  "share.dialog.title": "Share to MO Content Space", // DESIGN
  "share.incoming": "Incoming Content", // DESIGN
  "share.kind.link": "Link", // DESIGN
  "share.kind.image": "Image", // ADDED
  "share.kind.text": "Text", // ADDED
  "share.new.sub": "Create a fresh entry in your library", // DESIGN
  "share.existing.sub": "Attach this reference to a project", // DESIGN
  "share.search": "Search your ideas...", // DESIGN
  "share.saved.title": "Successfully saved", // DESIGN
  "share.saved.body": "Content has been added to your library.", // DESIGN
  "share.saved.offline": "Offline: Saved to queue", // DESIGN
  "share.failed": "Import failed. Please try again.", // DESIGN
  "share.done": "Done", // DESIGN
  "share.paste": "Paste a link or text", // ADDED (web import has no OS payload)

  "library.title": "Ideas Library", // DESIGN
  "library.search": "Search ideas, tags, or media...", // DESIGN
  "library.tags": "Tags", // DESIGN
  "library.categories": "Categories:", // DESIGN
  "library.empty.title": "Your library is a blank canvas", // DESIGN
  "library.empty.body": "Every great project starts with a single thought. Capture your first idea and see where it takes you.", // DESIGN
  "library.empty.cta": "Capture First Idea", // DESIGN
  "library.more": "Load More Ideas", // DESIGN
  "library.updated": "Updated {when}", // DESIGN
  "library.transcribed": "Transcribed: “{text}”", // DESIGN
  "library.menu": "Idea options", // ADDED (a11y)

  "detail.back": "Library", // DESIGN
  "detail.share": "Share", // ADDED (a11y)
  "detail.more": "More options", // ADDED (a11y)
  "detail.change_header": "Change Header", // DESIGN
  "detail.last_edited": "Last edited {when}", // DESIGN
  "detail.see_all": "See all", // DESIGN
  "detail.add": "Add", // DESIGN
  "detail.links": "Links", // DESIGN
  "detail.config": "Configuration", // DESIGN
  "detail.play": "Play", // DESIGN
  "detail.audio": "Audio Recording", // DESIGN
  "detail.plan.active": "Active", // DESIGN
  "detail.notes.placeholder": "Start typing your notes here...", // DESIGN
  "detail.copied": "Link copied", // ADDED

  "edit.title": "Edit Idea", // DESIGN
  "edit.save": "Save Changes", // DESIGN
  "edit.idea_title": "Idea Title", // DESIGN
  "edit.notes": "Notes", // DESIGN
  "edit.playgrounds": "Choose your playgrounds", // DESIGN
  "edit.saved.title": "Successfully updated", // DESIGN
  "edit.saved.synced": "Your changes are saved and synced.", // DESIGN
  "edit.saved.local": "Your changes are saved on this device.", // ADDED — synced only after server acknowledgment (UI-08)
  "edit.new_category": "New category", // ADDED

  "plan.title": "{platform} Plan", // DESIGN ("TikTok Reel Plan")
  "plan.status": "Plan Status", // DESIGN
  "plan.date": "Planned Date", // DESIGN
  "plan.date.placeholder": "Set a date", // ADDED
  "plan.caption": "Caption Draft", // DESIGN
  "plan.caption.placeholder": "Write your caption here...", // DESIGN
  "plan.notes": "Platform Notes", // DESIGN
  "plan.notes.placeholder": "Specific shots, music, or style notes...", // DESIGN
  "plan.tasks": "Platform Tasks", // DESIGN
  "plan.tasks.left": "{count} left", // DESIGN
  "plan.add_task": "Add Platform Task", // DESIGN
  "plan.save": "Save Plan Changes", // DESIGN
  "plan.saved": "Plan saved", // ADDED
  "plan.remove": "Remove plan", // ADDED
  "plan.state.draft": "Draft", // DESIGN
  "plan.state.in_progress": "In Progress", // DESIGN
  "plan.state.ready": "Ready", // DESIGN
  "plan.state.published": "Published", // PRD PLAT-01 (explicit publication status)

  "voice.title": "Voice Recording", // DESIGN
  "voice.recorded": "Recorded", // DESIGN
  "voice.need_internet": "Internet needed for transcription", // DESIGN
  "voice.transcribe": "Transcribe Voice", // DESIGN
  "voice.transcript.placeholder": "Start transcribing or click the button to generate...", // DESIGN
  "voice.autosave": "Auto-saving locally", // DESIGN
  "voice.retry_failed": "Transcription failed. Please try again.", // DESIGN
  "voice.back10": "Back 10 seconds", // ADDED (a11y)
  "voice.fwd10": "Forward 10 seconds", // ADDED (a11y)
  "voice.delete.title": "Delete this recording?", // ADDED
  "voice.delete.body": "The audio and its transcript are removed from this idea.", // ADDED

  "tasks.heading": "Tasks", // DESIGN
  "tasks.search": "Search tasks...", // DESIGN
  "tasks.add": "Add Task", // DESIGN
  "tasks.group.today": "Due Today", // DESIGN
  "tasks.group.overdue": "Overdue", // DESIGN
  "tasks.group.unscheduled": "Unscheduled", // DESIGN
  "tasks.count": "{count} tasks", // DESIGN
  "tasks.count.one": "1 task", // ADDED
  "tasks.no_idea": "No idea linked", // DESIGN
  "tasks.no_date": "No date set", // DESIGN
  "tasks.due_at": "Due {time}", // DESIGN
  "tasks.empty.title": "Clear skies", // DESIGN
  "tasks.empty.body": "No tasks due for today. Take a moment to capture a new idea or refine your plans.", // DESIGN
  "tasks.empty.cta": "Add Your First Task", // DESIGN

  "composer.title": "New Task", // DESIGN
  "composer.edit": "Edit Task", // ADDED
  "composer.name": "Task Name", // DESIGN
  "composer.name.placeholder": "What needs to be done?", // DESIGN
  "composer.notes": "Notes", // DESIGN
  "composer.notes.placeholder": "Add details or context...", // DESIGN
  "composer.idea": "Link to an idea", // DESIGN
  "composer.idea.search": "Search your library...", // DESIGN
  "composer.idea.clear": "Remove link", // ADDED
  "composer.platform": "Platform association", // DESIGN
  "composer.due_date": "Due Date", // DESIGN
  "composer.due_date.placeholder": "Set a date (optional)", // DESIGN
  "composer.due_time": "Due Time", // DESIGN
  "composer.reminder": "Reminder", // DESIGN
  "composer.reminder.toggle": "Turn reminder on or off", // ADDED (a11y)
  "composer.reminder.custom": "Custom time...", // DESIGN
  "composer.reminder.perm": "Reminders require notification access. Enable in settings.", // DESIGN
  "composer.reminder.past": "Reminder time cannot be in the past.", // DESIGN
  "composer.save": "Save Task", // DESIGN
} as const;

export type CopyKey = keyof typeof copy;

export function t(key: CopyKey, vars?: Record<string, string | number>): string {
  let s: string = copy[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
