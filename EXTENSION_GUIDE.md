# Safety Monitor Extension - Setup & Usage Guide

## ✅ What Was Implemented

### 1. **Backend API** (`/api/activity-log`)
- ✅ ActivityLog model for storing browsing data with enhanced fields
- ✅ Activity log controller with REST endpoints
- ✅ Routes for recording and retrieving browsing activity logs
- ✅ Statistics and analytics support (risk levels, categories)
- ✅ Support for parentId and childId tracking
- ✅ Website categorization (Education, Entertainment, Social, Gaming, News, Shopping)
- ✅ Risk level assessment (Safe, Warning, Dangerous)

### 2. **Frontend Features**
- ✅ **Parent Dashboard**: "Activity Logs" panel for browsing history
  - View all children's browsing activity
  - Filter by child, risk level, and category
  - Search by website domain or title
  - See detailed statistics (total sites, dangerous, warning, safe)
  - View duration spent on each page
  - Real-time activity monitoring
  
- ✅ **Child Dashboard**: Activity tracking awareness
  - Safe browsing guidance
  - Educational cybersecurity content

### 3. **Extension Updates**
- ✅ Updated API URL to `http://localhost:8080/api/activity-log`
- ✅ Enhanced data collection: domain, category, riskLevel, device, duration
- ✅ Automatic website categorization
- ✅ Risk level assessment for visited sites
- ✅ Duration tracking for time spent on pages
- ✅ Requires both childId and parentId configuration

---

## 🚀 How to Use

### For Parents:

1. **Start the Backend**
   ```bash
   cd backend
   npm start
   ```

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Register and Add Children**
   - Register as a parent account
   - Add children to your account
   - Note your User ID (parentId) from profile settings

4. **Access Activity Logs**
   - Login to Parent Dashboard
   - Click "Activity Logs" in the navigation
   - Select a child to filter their activity (or view all)
   - Use risk level and category filters
   - Search for specific websites

### For Children (Extension Setup):

1. **Get Required IDs**
   - **Child ID**: Available in the child's account profile or provided by parent
   - **Parent ID**: The parent's user ID from their profile

2. **Install the Extension**
   - Open Chrome: `chrome://extensions/`
   - Enable "Developer mode" (toggle top-right)
   - Click "Load unpacked"
   - Select the `extension` folder from your project: `C:\Users\devsa\Desktop\Hardik project\extension`
   
3. **Configure the Extension** *(Option 1: Popup UI - if implemented)*
   - Click the extension icon in Chrome toolbar
   - Enter the Child ID
   - Enter the Parent ID
   - Click "Save Settings"

4. **Configure the Extension** *(Option 2: Chrome DevTools)*
   - Right-click the extension icon → "Inspect popup" (or use F12 on any page)
   - Open Console tab
   - Run this command:
     ```javascript
     chrome.storage.local.set({
       childId: 'CHILD_ID_HERE',
       parentId: 'PARENT_ID_HERE'
     }, () => console.log('Configuration saved!'));
     ```
   - Replace `CHILD_ID_HERE` and `PARENT_ID_HERE` with actual IDs
   - Example:
     ```javascript
     chrome.storage.local.set({
       childId: '65f7b8a9c1d2e3f4a5b6c7d8',
       parentId: '65f7b8a9c1d2e3f4a5b6c7d9'
     }, () => console.log('Configuration saved!'));
     ```

5. **Verify Configuration**
   - In the same console, check the stored values:
     ```javascript
     chrome.storage.local.get(['childId', 'parentId'], (data) => {
       console.log('Stored Configuration:', data);
     });
     ```

6. **Start Browsing**
   - Visit any webpage (e.g., youtube.com, wikipedia.org)
   - Check the extension console for "Safety Monitor: Activity successfully sent" messages
   - Parents can see this activity in the Activity Logs panel

---

## 📊 Features

### Parent View (Activity Logs Panel):
- **Real-time tracking**: See websites visited with timestamps
- **Risk assessment**: Automatic identification of Dangerous, Warning, or Safe sites
- **Category filtering**: Filter by Education, Social, Entertainment, Gaming, News, Shopping
- **Statistics dashboard**: Total sites, dangerous count, warning count, safe count
- **Duration tracking**: See how long children spent on each page
- **Search functionality**: Find specific websites by domain or title
- **Multi-child support**: View activity for all children or filter by specific child
- **Child name display**: See which child visited each site

### Extension Features:
- **Automatic tracking**: Records URL, domain, title, and timestamp
- **Smart categorization**: Classifies websites into categories
  - Education: .edu, coursera, udemy, khan academy, wikipedia
  - Entertainment: youtube, netflix, spotify
  - Social: facebook, twitter, instagram, tiktok
  - Gaming: steam, roblox, minecraft
  - News: cnn, bbc, nytimes, reuters
  - Shopping: amazon, ebay, walmart
- **Risk assessment**: Identifies potentially dangerous websites
  - Dangerous: Adult content, gambling, piracy
  - Warning: Social media, unknown sites
  - Safe: Educational and news sites
- **Duration calculation**: Tracks time spent on pages
- **Lightweight**: Minimal performance impact
- **Secure**: Direct communication with your backend

---

## 🔧 Technical Details

### Backend Endpoints:
- `POST /api/activity-log` - Record new browsing activity (used by extension)
- `GET /api/activity-log?parentId=PARENT_ID` - Get activity logs for parent (all children)
- `GET /api/activity-log?parentId=PARENT_ID&childId=CHILD_ID` - Get activity logs for specific child
- `GET /api/activity-log/stats?parentId=PARENT_ID` - Get activity statistics
- `DELETE /api/activity-log/:logId` - Delete specific activity log

### Request Body Format (Extension → Backend):
```javascript
{
  childId: "65f7b8a9c1d2e3f4a5b6c7d8",
  parentId: "65f7b8a9c1d2e3f4a5b6c7d9",
  url: "https://youtube.com/watch?v=123",
  domain: "youtube.com",
  title: "YouTube Video",
  timestamp: "2026-03-05T11:20:00Z",
  duration: 300,
  category: "Entertainment",
  riskLevel: "Safe",
  device: "Chrome"
}
```

### Database Schema (activity_logs collection):
```javascript
ActivityLog {
  parentId: ObjectId (ref: User, required)
  childId: ObjectId (ref: Child, required)
  url: String (required)
  domain: String (required, auto-extracted if not provided)
  title: String (optional)
  timestamp: Date (default: now)
  duration: Number (seconds, default: 0)
  category: Enum ['Education', 'Entertainment', 'Social', 'Gaming', 'News', 'Shopping', 'Unknown']
  riskLevel: Enum ['Safe', 'Warning', 'Dangerous']
  device: String (default: 'Chrome')
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

---

## 🎯 Next Steps

### Optional Enhancements:
1. **AI Content Analysis**: Analyze website content for risks
2. **Time Limits**: Set daily browsing time limits
3. **Website Blocking**: Block specific domains
4. **Scheduled Reports**: Email weekly activity reports
5. **Mobile Support**: Track mobile app usage

---

## 🐛 Troubleshooting

### Extension not recording activity:
- Verify extension is installed and enabled in chrome://extensions/
- Check both Child ID and Parent ID are correctly configured
- Ensure backend is running on `localhost:8080`
- Check browser console (F12) for errors or success messages
- Verify you're visiting actual websites (not chrome:// pages)
- Look for "Safety Monitor: Activity successfully sent" in console

### Activity not showing in Parent Dashboard:
- Refresh the parent dashboard (F5)
- Check that you're logged in with the correct parent account
- Verify the parent ID matches the one configured in the extension
- Select "All Children" or specific child in the dropdown
- Check risk level and category filters (set to "ALL")
- Clear search box if you have text entered
- Ensure database connection is active (check backend console)

### "No browsing activity yet" message:
- Child needs to install and configure the extension with both IDs
- Child must browse actual websites (youtube.com, wikipedia.org, etc.)
- Wait a few seconds after visiting a page for it to sync
- Check extension console for error messages

### Configuration Issues:
- Use Chrome DevTools to verify stored configuration:
  ```javascript
  chrome.storage.local.get(['childId', 'parentId'], console.log);
  ```
- IDs must be valid MongoDB ObjectIds (24-character hex strings)
- Get Child ID from the child's user profile or from parent's children list
- Get Parent ID from the parent's user profile

### Backend Connection Errors:
- Verify backend is running: `npm start` in backend folder
- Check API is accessible: visit `http://localhost:8080/api/health`
- Ensure MongoDB is running and connected
- Check backend console for error messages
- Verify CORS is configured to allow chrome-extension:// origins

---

## 📝 Notes

- Extension requires both Child ID and Parent ID to function properly
- Activities are stored indefinitely (no automatic cleanup)
- Extension only tracks actual web pages (not chrome://, about:, etc.)
- Duration is calculated based on time between page visits
- Website categorization and risk assessment happen automatically
- All tracking is transparent - design your UI to inform children
- Data is sent in real-time when pages load completely

---

## 🔐 Privacy & Security

- **No password collection**: Extension never captures form inputs or passwords
- **URL metadata only**: Only stores URL, title, domain, and timestamps
- **Local configuration**: Child/Parent IDs stored locally in browser
- **Secure transmission**: All data sent via HTTP POST (use HTTPS in production)
- **Parental control**: Only parents can view activity logs
- **Transparent**: Children should be informed about monitoring

---

**Status**: ✅ All features implemented and functional
**Last Updated**: March 5, 2026
