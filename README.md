# Pocket Classroom - Offline Learning Capsules

A fully-functional, offline-first single-page web application for creating, studying, and sharing mini learning "capsules" containing notes, flashcards, and quizzes.

## Features

### 📚 Library View
- Grid display of all saved learning capsules
- Progress tracking (quiz best scores, known flashcards)
- Quick actions: Learn, Edit, Export, Delete
- Import/Export capsules as JSON files

### ✏️ Author Mode
- Create and edit learning capsules
- Add meta information (title, subject, level, description)
- Notes editor (multi-line text)
- Flashcards editor (add/remove cards with front/back)
- Quiz editor (multiple-choice questions with explanations)
- Auto-save functionality

### 🎓 Learn Mode
- **Notes Tab**: View and search through notes
- **Flashcards Tab**: Interactive flip cards with known/unknown tracking
- **Quiz Tab**: Sequential questions with instant feedback and scoring
- Export current capsule

### 🎨 Design Features
- Dark/Light theme toggle
- Responsive Bootstrap-based UI
- Gradient accents and smooth animations
- Keyboard shortcuts:
  - `Space`: Flip flashcard
  - `[` / `]`: Cycle through tabs
- Accessibility features (ARIA labels, semantic HTML)

## Technology Stack

- **HTML5**: Semantic structure
- **CSS3**: Custom animations and responsive design
- **Bootstrap 5**: UI framework (via CDN)
- **Vanilla JavaScript**: ES6 modules
- **LocalStorage**: Data persistence (offline-first)
## File Structure

```
pocket-classroom/
├── index.html              # Main HTML file
├── css/
│   └── styles.css         # Custom styles and themes
├── js/
│   ├── app.js             # Main application controller
│   ├── storage.js         # LocalStorage operations
│   ├── library.js         # Library view logic
│   ├── author.js          # Author mode logic
│   └── learn.js           # Learn mode logic
├── sample-capsule.json    # Example capsule
└── README.md              # This file
```

## Getting Started

1. Open `index.html` in any modern web browser
2. Click "New Capsule" to create your first learning capsule
3. Fill in the information and add notes, flashcards, or quiz questions
4. Click "Save" to store it locally
5. Go to "Learn" mode to study your capsules

## Import Sample Capsule

1. Click "Import JSON" in the Library view
2. Select `sample-capsule.json`
3. Start learning JavaScript basics!

## Data Storage

All data is stored locally in your browser's LocalStorage:
- `pc_capsules_index`: List of all capsules
- `pc_capsule_<id>`: Individual capsule data
- `pc_progress_<id>`: Learning progress (scores, known cards)
- `pc_theme`: Theme preference

## JSON Schema

Capsules use the `pocket-classroom/v1` schema:

```json
{
  "schema": "pocket-classroom/v1",
  "meta": {
    "title": "Required title",
    "subject": "Optional subject",
    "level": "Beginner|Intermediate|Advanced",
    "description": "Optional description"
  },
  "notes": ["Note 1", "Note 2"],
  "flashcards": [
    {"front": "Question", "back": "Answer"}
  ],
  "quiz": [
    {
      "question": "Question text",
      "choices": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Optional explanation"
    }
  ]
}
```

## Browser Compatibility

Works on all modern browsers that support:
- ES6 modules
- LocalStorage API
- FileReader API
- CSS Grid and Flexbox

## License

Educational project - Free to use and modify

# Pocket Classroom

This is my final project for the course. You can check the Website here: (https://taban8.github.io/pocket-classroomm/)

## Author

Developed with ❤️ by **Taban Faiz** Student Project - Pocket Classroom
