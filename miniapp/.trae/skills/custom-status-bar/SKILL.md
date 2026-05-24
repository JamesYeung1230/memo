---
name: "custom-status-bar"
description: "Handles status bar area in navigationStyle:custom mode. Invoke when implementing pages in mini programs with custom navigation — DO NOT hardcode placeholder time/battery from design specs."
---

# Custom Status Bar Padding

## Problem

When `app.json` sets `"navigationStyle": "custom"`, the native navigation bar is removed. The page content starts from the very top of the screen, overlapping the system status bar (battery, signal, time).

Design files (.pen / Figma / Sketch) often show a **placeholder** status bar with mock time and battery icons. **Never** replicate this placeholder in code — it conflicts with the real system UI and looks wrong on actual devices.

## Solution

Use the real system status bar height from `wx.getSystemInfoSync()` to add top padding to the page wrapper.

## Steps

### 1. Get the real status bar height on page load

In `learn.js`:

```javascript
Page({
  data: {
    statusBarHeight: 0
  },

  onLoad() {
    const { statusBarHeight } = wx.getSystemInfoSync()
    this.setData({ statusBarHeight })
  }
})
```

- `statusBarHeight` is a pixel value, varies across devices (~44px on most phones, ~47px on iPhone X series, ~20-24px on Android)
- Set a default `statusBarHeight: 0` in `data` to avoid `undefined` during initial render

### 2. Apply the padding in WXML

Remove any placeholder status bar elements entirely. Add the padding on the outermost page wrapper:

```xml
<!-- Before (wrong): hardcoded placeholder -->
<view class="page-wrapper">
  <view class="status-bar">
    <text class="time-text">9:41</text>
    <text class="battery-text">📶 🔋</text>
  </view>
  ...
</view>

<!-- After (correct): real system padding -->
<view class="page-wrapper" style="padding-top: {{statusBarHeight}}px">
  ...
</view>
```

### 3. Clean up unused CSS

Remove CSS classes that were only used for the placeholder status bar, e.g.:

```css
/* Delete these if they were only for the placeholder */
.status-bar { ... }
.time-text { ... }
.battery-text { ... }
```

## Why This Approach

| Concern | Placeholder approach (wrong) | Real padding approach (correct) |
|---------|------------------------------|--------------------------------|
| **Design accuracy** | Shows fake time conflicting with real system | No overlap, content sits below real status bar |
| **Device compatibility** | Fixed height fails on notched/edge-to-edge screens | `getSystemInfoSync` adapts to every device |
| **Native feel** | Mock UI looks obviously fake | Transparent background lets real system bar show through |
| **Barrel principle / PA.1** | Violates — hardcodes platform info | Follows — uses real system capability |

## Integration Notes

- This padding works with `navigationStyle: "custom"` in `app.json`
- If the page also has a custom navigation bar component (e.g. `components/navigation-bar/`), that component typically handles its own top padding internally — apply `statusBarHeight` padding on `page-wrapper` only when the nav bar doesn't already account for it
- For pages that use both a `navigation-bar` component AND scroll content, check whether `navigation-bar` already pads the top; if so, skip the `page-wrapper` padding
- The `statusBarHeight` value is a **pixel** value; when mixing with `rpx` values elsewhere, this is fine — it's only used for the top offset which maps 1:1 to CSS `px`
