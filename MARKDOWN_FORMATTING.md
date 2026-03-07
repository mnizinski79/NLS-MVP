# Markdown Formatting Support

## Overview
AI chat messages now support simple markdown formatting to make responses more readable and engaging.

## Supported Formatting

### Bold Text
Use `**text**` to make text bold:
- Input: `"Check out these **amazing** hotels!"`
- Output: "Check out these <strong>amazing</strong> hotels!"

### Line Breaks
- Single newline (`\n`) → `<br>`
- Double newline (`\n\n`) → `<br><br>` (paragraph break)

Example:
```
"Here are your options:\n\nLet me know if you need help!"
```
Renders with a paragraph break between the two sentences.

### Bullet Points
Use `-` or `•` at the start of a line to create bullet lists:

Input:
```
"Great options:\n- **Rooftop bars**\n- Pet-friendly\n- Near Central Park"
```

Output:
```html
Great options:
<ul>
  <li><strong>Rooftop bars</strong></li>
  <li>Pet-friendly</li>
  <li>Near Central Park</li>
</ul>
```

## Implementation Details

### Files Modified
1. **src/app/pipes/markdown.pipe.ts** (new)
   - Converts markdown syntax to HTML
   - Sanitizes output to prevent XSS attacks
   - Uses Angular's DomSanitizer

2. **src/app/components/chat.component.ts**
   - Imports MarkdownPipe
   - Added to component imports array

3. **src/app/components/chat.component.html**
   - Changed from `{{ message.text }}` to `[innerHTML]="message.text | markdown"`
   - Applied to both collapsed and expanded message views

4. **src/app/components/chat.component.css**
   - Added styles for `<strong>` tags (bold, darker color)
   - Added styles for `<ul>` and `<li>` (proper spacing and bullets)
   - Added styles for `<br>` tags (proper line spacing)

5. **src/app/services/ai.service.ts**
   - Updated AI prompt to encourage markdown usage
   - Added "MARKDOWN FORMATTING" section with examples
   - Instructs AI to use bold for emphasis and bullet points for lists

## Security
The pipe uses Angular's DomSanitizer to prevent XSS attacks. Any potentially dangerous HTML (like `<script>` tags) is automatically stripped.

## Testing
Comprehensive unit tests in `src/app/pipes/markdown.pipe.spec.ts` cover:
- Bold text conversion
- Line break handling
- Bullet point lists
- Mixed formatting
- XSS prevention
- Edge cases (empty strings, null values)

All 13 tests pass successfully.

## Example AI Responses

### Before (plain text):
```
"Found 3 hotels with rooftop bars near Times Square. A couple have great city views. Want me to filter by price?"
```

### After (with markdown):
```
"Found 3 hotels with **rooftop bars** near Times Square!\n\nA couple have great city views:\n- **Panoramic views**\n- **Sunset cocktails**\n- Close to **Broadway**\n\nWant me to filter by price?"
```

This renders with bold emphasis on key features, proper paragraph breaks, and a clean bullet list.
