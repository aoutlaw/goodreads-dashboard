// Hand-written content that isn't in the Goodreads CSV export:
// genre groupings and insights, recommendations, listening habits and format counts.
// Edit freely. Covers are matched to titles automatically (see covers/ folder).
window.CONTENT = {
  user: { name: "Angelo Outlaw", initials: "AO", profileUrl: "https://www.goodreads.com/user/show/143971338" },

  challenge: { year: 2026, goal: 10 },

  hoursListened: 145,

  formats: [
    { key: "print", label: "print", count: 75, color: "var(--data-primary)" },
    { key: "ebook", label: "ebook", count: 33, color: "var(--data-highlight)" },
    { key: "audio", label: "audio", count: 29, color: "var(--data-secondary)" }
  ],
  formatInsight: "Audio took over in 2025: 25 of your 27 books that year were audiobooks, mostly long LitRPG series.",

  // Top genres. Counts are from tagging your 137 read books; `books` are your highest-rated in each.
  genres: [
    { name: "Science fiction", short: "sci-fi", count: 50,
      insight: "Your most-read genre: 50 books, more than a third of everything you’ve read. It averages 3.46, so you read a lot of it but rate it below LitRPG (4.31).",
      books: ["Ender's Game", "Jurassic Park", "Ready Player One", "We Are Legion (We Are Bob)", "For We Are Many", "Gateway", "Old Man's War", "Dune"] },
    { name: "LitRPG & GameLit", short: "LitRPG", count: 31,
      insight: "You read more science fiction, but LitRPG is what you love most: a 4.31 average, your highest-rated genre. Sci-fi averages 3.46.",
      books: ["Dungeon Crawler Carl", "He Who Fights with Monsters 3", "He Who Fights with Monsters 4", "Dominion", "Hellion", "Evolution", "Catharsis", "Precipice"] },
    { name: "Fantasy", short: "fantasy", count: 28,
      insight: "Fantasy averages 4.00, second only to LitRPG. Harry Potter alone gives you seven 5-star reads, and The Empyrean adds two more.",
      books: ["Harry Potter and the Sorcerer's Stone", "Fourth Wing", "Iron Flame", "Harry Potter and the Prisoner of Azkaban", "The Magicians", "The White Tower", "Eragon", "Pawn of Prophecy"] },
    { name: "Contemporary & classics", short: "contemporary", count: 14,
      insight: "A smaller slice that punches above its weight: two of your 5-star reads live here. It averages 3.71.",
      books: ["The Wedding People", "Kafka on the Shore", "A Man Called Ove", "The Midnight Library", "The Alchemist", "Mr. Penumbra's 24-Hour Bookstore", "Lessons in Chemistry", "Where'd You Go, Bernadette"] },
    { name: "History & memoir", short: "history", count: 8,
      insight: "Mostly WWII aviation and history. Skunk Works is the standout: your only 5-star nonfiction. It averages 3.60 across the ones you rated.",
      books: ["Skunk Works", "The Rise and Fall of the Dinosaurs", "Sapiens", "American Sniper", "Seven at Sea", "The Wild Blue", "The Man Who Flew the Memphis Belle", "The Fight in the Clouds"] },
    { name: "Mystery & science", short: "mystery", count: 6,
      insight: "Your newest interest: two of these six came in the last two years. It averages 3.50, pulled down by Astrophysics for People in a Hurry (2 stars).",
      books: ["The Mystery Guest", "Everyone in the Group Chat Dies", "My Sister, the Serial Killer", "Astrophysics for People in a Hurry"] }
  ],
  defaultGenre: "LitRPG & GameLit",

  // "Because You Love" recommendations. Ratings for the last four are approximate.
  recsGenre: "LitRPG",
  recs: [
    { title: "The Primal Hunter", author: "Zogarth", rating: 4.23, count: "26k", reason: "For He Who Fights with Monsters fans", tags: ["deeper"] },
    { title: "Defiance of the Fall", author: "TheFirstDefier", rating: 4.34, count: "17k", reason: "Long-haul progression, like HWFWM", tags: ["deeper"] },
    { title: "Unsouled", author: "Will Wight", rating: 4.13, count: "65k", reason: "A gateway to progression fantasy", tags: ["adjacent", "short"] },
    { title: "Mark of the Fool", author: "J.M. Clarke", rating: 4.28, count: "12k", reason: "Magic school meets leveling up", tags: ["deeper"] },
    { title: "The Wandering Inn", author: "pirateaba", rating: 4.20, count: "18k", reason: "Cozy, sprawling, character-first", tags: ["deeper"] },
    { title: "Azarinth Healer", author: "Rhaegar", rating: 4.43, count: "11k", reason: "For Dungeon Crawler Carl fans", tags: ["deeper"] },
    { title: "Beware of Chicken", author: "Casualfarmer", rating: 4.45, count: "16k", reason: "Lighter, funnier cultivation", tags: ["adjacent"] },
    { title: "Mother of Learning", author: "nobody103", rating: 4.45, count: "31k", reason: "Time-loop magic, tightly plotted", tags: ["adjacent"] },
    { title: "The Perfect Run", author: "Maxime J. Durand", rating: 4.29, count: "9k", reason: "Chaotic humor, like Carl", tags: ["adjacent", "short"] },
    { title: "Iron Prince", author: "Bryce O'Connor", rating: 4.27, count: "12k", reason: "Sci-fi progression, like Bobiverse", tags: ["adjacent"] },
    { title: "Super Supportive", author: "Sleyca", rating: 4.60, count: "6k", reason: "Found family, slow-burn powers", tags: ["deeper"] }
  ],

  // Currently reading extras the CSV doesn't have (community rating, progress, format).
  currentlyReading: {
    "One Golden Summer": { author: "Carley Fortune", format: "Print", rating: 4.27, count: "646k", page: 0, added: "Nov 9" },
    "Death in the Downline": { author: "Maria Abrams", format: "Print", rating: 3.49, count: "3.9k", page: 8 }
  },

  // Audiobook listening by hour (0 = midnight), as a share of the busiest hour (5 pm = 1). Last 12 months.
  listening: [0.08, 0.03, 0, 0, 0, 0, 0.05, 0.16, 0.26, 0.37, 0.58, 0.42, 0.37, 0.37, 0.47, 0.74, 0.87, 1.0, 0.69, 0.37, 0.31, 0.53, 0.53, 0.21],
  listeningPeak: { hour: "5 pm", share: "31%", window: "between 3 and 6 pm" },
  listeningInsight: "You’re an afternoon listener, peaking around 5 pm. Weekend mornings near 10 am and a late session once a week (9 to 11 pm) fill in the rest."
};
