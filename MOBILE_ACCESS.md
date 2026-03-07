# Mobile Access Guide

## Accessing the App on Your Phone

Your local IP address: **192.168.4.76**

### Steps to Access from Your Phone:

1. **Make sure your phone is on the same WiFi network as your computer**

2. **Start the development servers:**
   ```bash
   npm run start:dev:mobile
   ```
   
   This will start both:
   - Backend API server on port 3000
   - Angular dev server on port 4200 (accessible from network)

3. **Open your phone's browser and navigate to:**
   ```
   http://192.168.4.76:4200
   ```

### Alternative: Start Servers Separately

If you prefer to start them separately:

```bash
# Terminal 1 - Start the backend API
npm run start:api

# Terminal 2 - Start Angular with network access
npm run start:mobile
```

### Troubleshooting

**If you can't connect:**

1. Check your firewall settings - make sure ports 3000 and 4200 are allowed
2. Verify both devices are on the same WiFi network
3. Try disabling any VPN on your computer
4. On macOS, you may need to allow incoming connections in System Preferences > Security & Privacy > Firewall

**If your IP address changes:**

Run this command to get your current IP:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
```

Then update the URL in your phone's browser accordingly.

### Testing the Mobile Layout

The app is responsive and will automatically switch to mobile layout when the screen width is ≤ 1024px. On your phone, you should see:

- Full-screen chat interface
- Inline hotel cards (max 3)
- "View All" button to open map overlay
- Bottom sheet for hotel details
- Fixed input bar at bottom

### Notes

- The mobile layout is optimized for touch interactions
- Swipe down to close the hotel detail bottom sheet
- The app uses the same backend API as the desktop version
- All features work the same on mobile and desktop
