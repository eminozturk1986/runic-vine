# Runic Vine

A web-based educational game where players match grape varieties to their countries of origin on an interactive map.

## 🎮 Game Features

- **Interactive Gameplay**: Match 100+ grape varieties to their origin countries
- **2-minute Timer**: Fast-paced quiz format with countdown timer
- **Europe Map**: Clickable SVG map with visual feedback
- **Real-time Scoring**: Track correct answers and accuracy
- **Leaderboard**: Top 10 scores stored locally with rankings
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Project Structure

```
Runic_Vine/
├── index.html              # Main HTML file
├── package.json            # Node.js dependencies and scripts
├── .gitignore             # Git ignore rules
├── data/
│   └── grape_data.json    # 100 grape varieties with origin countries
├── src/
│   └── main.js            # Main JavaScript application
├── styles/
│   └── styles.css         # Wine-themed styling
├── public/
│   └── europe-map.svg     # Interactive Europe map
├── test/
│   └── ui.test.js         # Puppeteer UI test suite
└── README.md
```

## 🚀 Setup & Installation

### Quick Start (Browser Only)
1. Open `index.html` directly in a web browser
2. Start playing immediately!

### Local Development Server
```bash
# Install dependencies
npm install

# Start development server
npm run dev
# or
npm start

# Open http://localhost:8080
```

### Alternative Servers
```bash
# Using Python
python -m http.server 8000

# Using Node.js serve
npx serve .
```

## 🧪 Testing

Run the automated UI test suite:

```bash
# Install test dependencies
npm install

# Run Puppeteer tests
npm test
```

The test covers:
- ✅ Start screen functionality
- ✅ Player registration
- ✅ Game mechanics (timer, scoring, map interaction)
- ✅ End screen and leaderboard
- ✅ localStorage persistence

## 🎨 Design

- **Theme**: Clean white layout inspired by [runicgrapes.com](https://runicgrapes.com/)
- **Colors**: 
  - Primary: Burgundy red (#891e19)
  - Secondary: Blue-gray (#2b3249)
  - Accent: Yellow (#ffda00)
- **Typography**: Arimo font family
- **Responsive**: Mobile-first design with breakpoints

## 🎯 How to Play

1. **Start**: Enter your name and email
2. **Play**: You have 2 minutes to answer as many questions as possible
3. **Answer**: Click on countries on the Europe map to match grape varieties
4. **Score**: Get immediate feedback and track your progress
5. **Compete**: View your ranking on the leaderboard

## 🏆 Scoring System

- **Correct Answer**: +1 point
- **Incorrect Answer**: No penalty
- **Final Score**: Based on accuracy percentage and total correct answers
- **Leaderboard**: Top 10 scores with medals for top 3

## 📊 Game Data

- **100 Grape Varieties** from major wine-producing countries
- **14 European Countries** on interactive map:
  - France, Germany, Italy, Spain, Portugal
  - Greece, Austria, Switzerland, Hungary
  - Romania, Bulgaria, Croatia, Slovenia, Czech Republic

## 🔧 Technical Features

- **Vanilla JavaScript** - No frameworks required
- **localStorage** - Persistent leaderboard data
- **SVG Maps** - Scalable vector graphics for crisp display
- **CSS Grid/Flexbox** - Modern responsive layouts
- **Puppeteer Testing** - Automated browser testing
- **GitHub Pages Ready** - Easy deployment

## 🚀 Deployment

### GitHub Pages
1. Push to GitHub repository
2. Enable GitHub Pages in repository settings
3. Select source branch (main/master)
4. Access at: `https://username.github.io/runic-vine/`

### Manual Deployment
Upload all files to any web server. No build process required!

## 🐛 Browser Support

- ✅ Chrome 70+
- ✅ Firefox 65+
- ✅ Safari 12+
- ✅ Edge 79+

## 📱 Mobile Support

Fully responsive design optimized for:
- 📱 Mobile phones (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)

## 🎉 Game Status

✅ **Complete & Ready to Play!**

- ✅ Player registration system
- ✅ Interactive Europe map
- ✅ 2-minute timer with visual feedback
- ✅ Real-time scoring and feedback
- ✅ Automatic question progression
- ✅ Final score screen
- ✅ Persistent leaderboard (localStorage)
- ✅ Responsive design
- ✅ Comprehensive test suite
- ✅ Production ready

---

**🍷 Start playing Runic Vine and test your wine knowledge!**