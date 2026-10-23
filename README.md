# NTUAI-AIcohol
This is an event website for NTUAI club.

## Frontend structure

```text
public/
├── index.html                 # Page markup
├── style.css                  # Shared site styles
├── script.js                  # Registration and preference ranking
├── source/
│   ├── assets/                # Branding, hosts, feedback photos and cocktails
│   └── styles/
│       ├── topics.css         # Flavor exploration and roundtable cards
│       └── ranking-theme.css  # Orange registration theme and category badges
└── action/
    ├── topics.js              # Animated flavor grouping and cocktail details
    └── feedback.js            # Feedback carousel and counter animations
```

HTML and JavaScript image URLs resolve from the page, using `source/assets/`.
The shared stylesheet uses the same path relative to `public/style.css`.
Vercel rewrites preserve old `/assets/` URLs and previous feature-file URLs for
existing email banners and cached pages. The API routes remain under `api/`.
See the [Vercel rewrite documentation](https://vercel.com/docs/routing/rewrites).

Roundtables start in A–J order without cocktail details. Selecting a flavor
groups its tables and reveals their cocktails; other tables remain alphabetical.
Selecting the same flavor again or “全部桌次” restores the initial view.
