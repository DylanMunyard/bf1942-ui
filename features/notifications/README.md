# Testing Buddy Online Notifications

This guide explains how to test the new buddy online notification system.

## What's Been Implemented

### 🎯 Features
- **Toast Notifications**: Stylish sliding notifications in the top-right corner
- **Tab Title Blinking**: Browser tab title changes to show notification count
- **Browser Notifications**: Native OS notifications (with permission)
- **Auto-dismiss**: Notifications automatically disappear after 5-8 seconds
- **Click Actions**: Notifications have action buttons and click handlers
- **Dark Mode Support**: Notifications adapt to light/dark theme

### 🔧 Technical Implementation
- **NotificationService**: Centralized service managing all notifications
- **SignalR Integration**: Automatically handles buddy online events from server
- **Toast Component**: Vue component with smooth animations and transitions
- **Permission Management**: Automatically requests browser notification permissions

## How to Test

### Method 1: Console Command (Development)
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Run: `testBuddyNotification()` or `testBuddyNotification("CustomBuddyName")`
4. You should see:
   - A toast notification slide in from the right
   - Browser tab title change to show "(1) BF1942 Servers Dashboard"
   - If browser notifications are enabled, an OS notification

### Method 2: SignalR Simulation
The system automatically handles SignalR events with the following payload:
```json
{
    "type": "buddy_online",
    "buddyName": "Hellraz0r",
    "serverName": "-[HELLO]- Desert Combat",
    "mapName": "dc twin rivers",
    "timestamp": "2025-08-09T03:46:02.7754404+00:00",
    "message": "Hellraz0r is now online on -[HELLO]- Desert Combat playing dc twin rivers"
}
```

### Method 3: Browser Notifications
1. When you first visit the app, it will automatically request notification permissions after 3 seconds
2. Click "Allow" when prompted
3. Test notifications will then show both toast + browser notifications

## Visual Design

### Toast Notification Features:
- **Gradient backgrounds** based on notification type
- **Buddy online**: Green accent with user icon 👤
- **Animated progress bar** showing time until auto-dismiss
- **Hover effects** with elevation shadows
- **Action buttons** for "View Server" and close
- **Timestamp** showing "Just now", "2m ago", etc.

### Tab Title Behavior:
- Normal: `BF1942 Servers Dashboard`
- With notifications: `(2) BF1942 Servers Dashboard` (blinking every second)
- Returns to normal when notifications are viewed/cleared

## Mobile Responsiveness
- Notifications adapt to smaller screens
- Full-width on mobile devices
- Touch-friendly tap targets
- Reduced animation for better performance

## Extensibility
The system is designed to handle future notification types:
- Server favorite map notifications
- Achievement unlocks
- System announcements
- Error messages
- Success confirmations

Each type can have custom icons, colors, and behaviors.

## Files Modified/Created
- ✨ `src/services/notificationService.ts` - Core notification management
- ✨ `src/components/ToastNotifications.vue` - UI component
- ✨ `src/composables/useNotifications.ts` - Vue composable
- 🔧 `src/services/signalrService.ts` - Added buddy notification handling
- 🔧 `src/layouts/DashboardLayout.vue` - Added toast component
- 🔧 `src/App.vue` - Added notification permissions

## Testing Checklist
- [ ] Console command `testBuddyNotification()` works
- [ ] Toast notification appears and disappears
- [ ] Tab title shows notification count and blinks
- [ ] Browser notification appears (if permissions granted)
- [ ] Clicking notification action works
- [ ] Notifications work in both light and dark mode
- [ ] Mobile responsive design works
- [ ] SignalR integration handles real buddy events
