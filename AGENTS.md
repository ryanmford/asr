# APEX SPEED RUN - AI Assistant Guidelines

This file (`AGENTS.md`) is automatically read by the AI assistant at the start of every chat. It serves as our permanent memory for project guidelines, naming conventions, and design rules.

## Core Directive
* **Guide, Don't Override:** Use these guidelines to inform new development and copy decisions. Do not aggressively refactor or override the existing architecture or UI patterns unless explicitly instructed.

## Brand Voice & Copywriting
* **Brand Name:** Always spell it as **APEX SPEED RUN**, Apex Speed Run, or ASR for short.
* **Tone & Perspective:** Direct. Declarative. Minimalist. Treat the user as smart. Use "you" heavily. Avoid "I" or "we". Speak to the user, not about yourself. 
* **Structure & Punctuation:** Write in short sentences and paragraphs (1-3 sentences max). Use line breaks instead of commas. Land punchlines on strong, short nouns.
* **Rhetorical Patterns:** Use clear contrasts (e.g., theory vs. practice, default vs. design) and parallel structures. State uncomfortable truths directly.
* **Banned Language:** NO jargon, NO cliches, and NO "encrypted" or "cheesy" marketing language. 
* **Tactical Diplomacy:** When addressing community relations (e.g., security guards, authority), use the concept of "Professional Boredom." ASR operates invisibly ("Ghost Setting"). Avoid rebellious skater/punk tropes.

## Key Project Concepts
* **DeSport & DeSci:** APEX SPEED RUN is an open-source, permissionless speed parkour league based on DeSci and DeSport concepts (decentralized science and sport). Everybody owns the map. Anyone can start at anytime.
* **Speed Parkour:** The underlying sport format. You versus the course. You against the clock. Time starts and stops upon the initial contact of the designated start/stop blocks. You must pass through the correct mid-course checkpoints.
* **AASF (Apex Athlete Scholarship Fund):** Focus on "removing barriers" and "overlooked talent." Do not use language about "saving poor athletes."
* **Surface Literacy (Textures & Interfaces):** Course complexity is measured by friction changes (Textures) and tactile manipulations (Interfaces), not just sheer distance.
* **The Mission:** Grow the grassroots network to 100 countries, 1,000 courses, and 10,000 players.
* **Current Stats:** Always refer to our master database, leaderboards, counter features, etc for the most updated stats on total players, runs, countries, courses, etc.

## Game Logic & Leaderboard Math
* **Locomotive Quotient (LQ):** A proprietary metric measuring human displacement ability. The formula is `(All-Time Course Record / Your Time) * 100`. The fastest course record is ALWAYS the baseline of 100.
* **Decimal Precision Rules:** Always display quantitative stats (LQ, run times, win percentages, coin stats, point totals) to EXACTLY 2 decimal places so everything stays aligned and clean. The single exception is the stat simulator tool, which can optionally use 3 decimal places to visualize extremely small predicted changes in ratings.
* **Verification & Penalties:** ASR is self-officiated and community-audited. Video proof is mandatory. If a start/stop touch is obstructed by a bad camera angle, officials might add a conservative penalty (e.g., +0.1s). Extremely bad angles or video quality might result in rejecting your video submission.

## App Development & Feature Mechanics (The "Low-Lift" Doctrine)
* **The "Low-Lift" Engineering Rule:** Whenever possible, do not over-engineer. Unless absolutely necessary, avoid complex algorithms and code. As much as possible, rely on external systems and basic caching. Use manual booleans (e.g., `featuredStoryline`), static strings, and direct external links. Do not fix what isn't broken.
* **Incentive Flywheels:** As many features as possible should align with a user's self-interest (ego, status, money) to organically grow the platform.
* **Bounties & Tips:** Keep real-world monetary rewards simple. Provide direct `<a>` tag links to personal Venmo/CashApp for course setters ("Tip the Setter"), and central Treasury wallets for course bounties. Minimize friction, bypass App Store fees.
* **Micro-Narratives & Attribution:** Elevate everyone in the ecosystem. Whenever possible, display names, links, credits, etc for players, setters, filmers, athletes, testers, gyms, teams, etc.

## Metadata & Course Conventions
* **Standardized Geography:** Use strict geographic naming hierarchy. Group stats and filtering logically by Continent, Country, and City.
* **Digital Landmarks:** ASR operates outdoors. We do not use physical tape or paint. Checkpoints are defined by permanent, exact urban geometry.
* **Course DNA:** Every course profile must capture precise metrics to calculate intensity: Length (m), Elevation Change (+/-, up or down), and Checkpoint Count. Always verify "Structural Integrity" logic (e.g., Shunt Test, Cap Stones).

## Design & UI Guidelines
* **Aesthetic:** Minimalist, high-fidelity design. Complexity happens by default. Simplicity happens by design.
* **Visual Integration:** Visuals break up text and reinforce the core points. They do not exist just to decorate. 
* **Video Proof:** Place a heavy, uncompromising emphasis on high-quality data and videos of actual world-class performers. 
* **Video Requirements:** High-quality, raw video (e.g., 4k, 24-60fps) is our preference.
* **Typography & Theming:** Maintain brutalist but refined contrast. Dark backgrounds, stark white text, purposeful but subtle outlines, colors, and highlights.
* **Motion & Feedback:** Animations (like `AnimatedListView` or `CountUp`) must be punchy, precise, and fast—exactly like the sport. Avoid slow, floaty fades or generic bouncing. 
* **States & Loading:** Never flash blank screens or raw, unstyled data. Always default to `Skeletons` during data fetch cycles and specifically use `ASREmptyState` for null results so the UI never feels broken.

## Technical & Architecture Principles
* **Mobile-First Reality:** The core navigation relies on bottom-heavy ergonomics (`ASRNavDock` and `ASRBottomSheet`). Always design layouts starting from thumb-reachability on mobile touch screens. Desktop serves as a widescreen expansion of this, not the baseline.
* **Component Taxonomy:** Respect the rigid folder structure. Base UI elements belong in `/common`, complex readouts go in `/inspector`, collections go in `/list`, and root screens go in `/views`. Keep files strictly focused on their specific domains.
* **Data Flow & State:** Rely aggressively on `useAppStore` for global UI (toggles, active modals) and `useDataStore` for heavy entity caching. Avoid creating temporary local state for anything that affects the global interface or data availability.
* **Performance & Non-Blocking Compute:** APEX SPEED RUN handles deep datasets (athletes, courses, runs). Rely on `useDerivedData` and the existing `dataWorker` setups to keep the main thread cleanly responsive during intense filtering and sorting.
