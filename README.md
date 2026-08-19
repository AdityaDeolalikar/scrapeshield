
# 🛡️ ScrapeShield

### Self-Healing Web Scraping Infrastructure

ScrapeShield is a **self-healing web scraping platform** designed to detect scraper failures, identify broken selectors, automatically discover replacement selectors, verify the proposed repair, deploy it as a new scraper version, and retry the failed extraction using the repaired configuration.

Instead of requiring a developer to manually inspect a broken scraper every time a website changes its HTML structure, ScrapeShield creates an automated recovery pipeline:

```text
Scraper Failure
      ↓
Failure Detection
      ↓
Failure Analysis
      ↓
Replacement Candidate Generation
      ↓
Candidate Testing & Ranking
      ↓
Repair Creation
      ↓
Version Deployment
      ↓
Verification
      ↓
Real Scraper Retry
      ↓
Data Recovered
```

> **Example:** A scraper originally uses `.price_color`. If the website changes its structure and that selector stops returning data, ScrapeShield detects the schema failure, discovers `.product_price` as a valid replacement, verifies it against the live website, deploys a new scraper version, and retries the extraction.

---

## 🚀 Why ScrapeShield?

Web scrapers are extremely sensitive to changes in website structure.

A small HTML change can cause:

* CSS selectors to stop matching
* Required fields to disappear
* Record counts to drop
* Extraction pipelines to fail
* Data quality to deteriorate

Traditional scraping systems usually follow this pattern:

```text
Website changes
      ↓
Scraper breaks
      ↓
Pipeline fails
      ↓
Developer investigates
      ↓
Selector manually updated
      ↓
Scraper redeployed
```

ScrapeShield changes that workflow:

```text
Website changes
      ↓
Failure detected
      ↓
Broken field identified
      ↓
Replacement selector discovered
      ↓
Candidate verified
      ↓
New version deployed
      ↓
Scraper retried
      ↓
Data recovered
```

The goal is to reduce **manual scraper maintenance** and make scraping pipelines more resilient to structural website changes.

---

# ✨ Key Features

## 1. Web Scraper Management

Create and manage scraping configurations containing:

* Scraper name
* Target URL
* Bright Data Collector ID
* Description
* Operational status
* Health score
* Success rate
* Current scraper version

---

## 2. Real Bright Data Integration

ScrapeShield integrates with **Bright Data Scraper Studio** to execute real scraping jobs.

The execution lifecycle is:

```text
ScrapeShield
    ↓
Bright Data Collector
    ↓
Bright Data Collection
    ↓
Dataset
    ↓
ScrapeShield Sync
    ↓
Validation
```

The platform also supports polling while Bright Data is still processing:

```text
collecting
   ↓
ready
   ↓
validation
   ↓
success / failure
```

---

# 3. Failure Detection

ScrapeShield validates scraper output against the expected schema.

For example, suppose the scraper expects:

```json
{
  "price": "£51.77"
}
```

but the scraper returns records where `price` is missing.

ScrapeShield creates a structured failure:

```json
{
  "type": "schema_invalid",
  "message": "Required field 'price' is missing from scraper output.",
  "oldSelector": ".price_color",
  "expectedRecords": 20,
  "actualRecords": 20
}
```

This allows the healing system to reason about the failure instead of simply returning a generic scraping error.

---

# 4. Failure Analysis

The failure analyzer determines:

* Failure type
* Affected field
* Previous selector
* Severity
* Whether the failure is repairable
* Reason for the failure

Example:

```json
{
  "failureType": "schema_invalid",
  "affectedField": "price",
  "oldSelector": ".price_color",
  "severity": "medium",
  "repairable": true,
  "reason": "The scraper returned records, but the required \"price\" field is missing or invalid."
}
```

---

# 5. Automatic Selector Candidate Generation

Once a failure is determined to be repairable, ScrapeShield fetches the current webpage and searches for possible replacement selectors.

For the Books to Scrape example:

```text
Broken selector:
.price_color

Candidate discovered:
.product_price
```

The candidate generator doesn't blindly choose the first matching element.

Candidates are evaluated based on extraction quality.

---

# 6. Candidate Testing & Ranking

Each candidate selector is tested against the live webpage.

ScrapeShield calculates:

| Metric          | Description                                |
| --------------- | ------------------------------------------ |
| `matchCount`    | Number of elements matching selector       |
| `nonEmptyCount` | Number of matched elements containing data |
| `coverage`      | Percentage of useful matches               |
| `score`         | Candidate confidence score                 |
| `valid`         | Whether candidate passes validation        |

Example:

```json
{
  "selector": ".product_price",
  "field": "price",
  "matchCount": 20,
  "nonEmptyCount": 20,
  "coverage": 1,
  "score": 1,
  "valid": true
}
```

In this example:

```text
20 matches
20 non-empty values
100% coverage
100% confidence
```

The highest-ranked valid candidate becomes the recommended repair.

---

# 7. Repair Creation

Once a valid candidate is discovered, ScrapeShield creates a repair record.

Example:

```json
{
  "status": "detected",
  "oldSelector": ".price_color",
  "newSelector": ".product_price",
  "confidence": 1
}
```

The repair remains traceable through:

```text
Scraper
   ↓
Run
   ↓
Failure
   ↓
Repair
   ↓
Version
```

This creates an audit trail for scraper changes.

---

# 8. Versioned Scraper Configuration

Repairs do not overwrite the existing scraper configuration.

Instead, ScrapeShield creates a new scraper version.

Example:

```text
v1.0
 ↓
v1.1
 ↓
v1.2
 ↓
v1.3
```

A repaired selector therefore becomes part of a new version:

```json
{
  "version": "v1.2",
  "selectors": {
    "price": ".product_price"
  }
}
```

This makes scraper configuration changes traceable and reversible.

---

# 9. Active Version Management

Only one scraper version can be active at a time.

Example:

```text
v1.0    FALSE
v1.1    FALSE
v1.2    TRUE
```

When a new version is activated:

1. Existing active versions are deactivated.
2. The new version is activated.
3. The scraper's `currentVersion` is updated.

This prevents multiple configurations from being considered authoritative simultaneously.

---

# 10. Verification Before Recovery

A repaired selector is **not trusted immediately**.

Before considering the repair successful, ScrapeShield verifies the new selector against the live webpage.

Example:

```json
{
  "selector": ".product_price",
  "matchCount": 20,
  "nonEmptyCount": 20,
  "coverage": 1,
  "valid": true
}
```

Verification requires:

```text
matchCount > 0
        AND
nonEmptyCount > 0
        AND
coverage >= 80%
```

If verification succeeds:

```text
Repair → Verified
```

If verification fails:

```text
Repair → Failed
          ↓
Rollback
          ↓
Previous version restored
```

---

# 11. Automatic Rollback

ScrapeShield includes a rollback mechanism for failed repairs.

Example:

```text
v1.0
 ↓
v1.1 deployed
 ↓
verification failed
 ↓
rollback
 ↓
v1.0 restored
```

This protects the scraper from deploying a repair that looks promising but does not actually work.

---

# 12. Real Scraper Retry

This is one of the most important parts of the project.

ScrapeShield doesn't stop after finding a valid selector.

After successful verification, the system performs a **real Bright Data retry** using the repaired configuration.

Example:

```text
Old selector
.price_color
      ↓
Failure
      ↓
Candidate
.product_price
      ↓
Verification
20/20
      ↓
Version deployed
v1.2
      ↓
Real Bright Data retry
      ↓
20 records recovered
```

This proves that the repair works in the actual scraping pipeline rather than only in a local HTML test.

---

# 🧠 Self-Healing Architecture

```text
                       ┌──────────────────────┐
                       │      ScrapeShield    │
                       │      Web Dashboard   │
                       └──────────┬───────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │     Scraper API      │
                       └──────────┬───────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
          ┌──────────────────┐        ┌──────────────────┐
          │ Scraper Executor │        │ Failure Detector │
          └────────┬─────────┘        └────────┬─────────┘
                   │                           │
                   ▼                           ▼
          ┌──────────────────┐        ┌──────────────────┐
          │   Bright Data   │        │ Failure Analyzer │
          └────────┬─────────┘        └────────┬─────────┘
                   │                           │
                   ▼                           ▼
          ┌──────────────────┐        ┌──────────────────┐
          │ Collection Data  │        │ Candidate Engine │
          └────────┬─────────┘        └────────┬─────────┘
                   │                           │
                   ▼                           ▼
          ┌──────────────────┐        ┌──────────────────┐
          │ Output Validator │        │ Candidate Tester │
          └────────┬─────────┘        └────────┬─────────┘
                   │                           │
                   └─────────────┬─────────────┘
                                 ▼
                       ┌──────────────────────┐
                       │   Repair Manager     │
                       └──────────┬───────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │ Version Management   │
                       └──────────┬───────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │ Verification Engine  │
                       └──────────┬───────────┘
                                  │
                         ┌────────┴────────┐
                         ▼                 ▼
                     VERIFIED          FAILED
                         │                 │
                         ▼                 ▼
                  Real Retry           Rollback
                         │
                         ▼
                    Data Recovered
```

---

# 🏗️ Technology Stack

## Frontend

* **Next.js 16**
* **React**
* **TypeScript**
* Modern responsive UI
* Server-rendered and dynamic App Router pages

## Backend

* **Next.js Route Handlers**
* **TypeScript**
* REST-style API architecture
* Modular service layer

## Database

* **PostgreSQL**
* **Drizzle ORM**

## Scraping Infrastructure

* **Bright Data Scraper Studio**
* Bright Data collection APIs
* Live webpage validation using **Cheerio**

## Validation & Healing

* Custom schema validation
* Selector candidate generation
* Candidate scoring
* Repair management
* Version management
* Verification
* Automatic rollback

---

# 🗄️ Database Architecture

ScrapeShield uses several core entities.

```text
scrapers
    │
    ├── scraper_runs
    │       │
    │       └── failures
    │               │
    │               └── repairs
    │
    └── scraper_versions
```

## `scrapers`

Stores the main scraper configuration.

Important fields include:

```text
id
name
url
collectorId
status
healthScore
successRate
currentVersion
isActive
createdAt
updatedAt
```

---

## `scraper_runs`

Tracks every execution.

```text
id
scraperId
brightDataCollectionId
status
recordsFound
durationMs
error
output
startedAt
completedAt
```

---

## `failures`

Stores detected scraper failures.

```text
id
scraperId
runId
type
message
oldSelector
expectedRecords
actualRecords
detectedAt
```

---

## `repairs`

Tracks proposed and approved repairs.

```text
id
scraperId
runId
failureId
status
oldSelector
newSelector
confidence
reason
createdAt
completedAt
```

---

## `scraper_versions`

Stores versioned scraper configurations.

```text
id
scraperId
version
selectors
schema
isActive
createdAt
```

---

# 🔄 End-to-End Healing Flow

Consider this example:

### Initial configuration

```text
Version: v1.0

price → .price_color
```

The website changes.

The selector no longer works.

---

### Step 1 — Failure

```text
.price_color
     ↓
0 valid price values
```

ScrapeShield detects:

```text
schema_invalid
```

---

### Step 2 — Analysis

```text
Affected field:
price

Old selector:
.price_color

Repairable:
true
```

---

### Step 3 — Candidate discovery

ScrapeShield scans the current webpage.

It discovers:

```text
.product_price
```

---

### Step 4 — Candidate testing

```text
Match count:       20
Non-empty count:   20
Coverage:          100%
Score:             100%
Valid:             true
```

---

### Step 5 — Repair

```text
.price_color
      ↓
.product_price
```

---

### Step 6 — Version deployment

```text
v1.0 → v1.1
```

The new configuration becomes active.

---

### Step 7 — Verification

```text
.product_price
      ↓
20 matches
20 valid values
100% coverage
      ↓
VERIFIED
```

---

### Step 8 — Real retry

The scraper is executed again through Bright Data.

Result:

```text
20 records recovered
```

---

### Step 9 — Final state

```text
Status: HEALTHY
Health Score: 100%
Current Version: v1.1
Success Rate: 100%
```

---

# 📊 Example Successful Recovery

The actual tested Books to Scrape scenario produced:

```text
Failure:
.price_color

Replacement:
.product_price

Candidate score:
100%

Coverage:
100%

Verification:
PASSED

Bright Data retry:
SUCCESS

Records recovered:
20
```

The final UI reports:

```text
✓ SCRAPER HEALED & RECOVERED

.price_color → .product_price

Verification: PASSED
Retry: SUCCESS
20 records successfully recovered
```

---

# 📡 API Endpoints

## Scrapers

### Create scraper

```http
POST /api/scrapers
```

### Get scrapers

```http
GET /api/scrapers
```

### Get scraper

```http
GET /api/scrapers/:id
```

---

## Runs

### Create/run scraper

```http
POST /api/runs
```

### Execute run

```http
POST /api/runs/:id/execute
```

### Synchronize Bright Data result

```http
POST /api/runs/:id/sync
```

### Heal failed run

```http
POST /api/runs/:id/heal
```

---

## Failure Analysis

### Analyze failure

```http
POST /api/failures/:id/analyze
```

### Generate candidates

```http
POST /api/failures/:id/candidates
```

### Test candidate

```http
POST /api/failures/:id/candidates/test
```

### Generate repair

```http
POST /api/failures/:id/repair
```

---

## Repairs

### Approve repair

```http
POST /api/repairs/:id/approve
```

### Verify repair

```http
POST /api/repairs/:id/verify
```

---

## Development

### Simulate scraper failure

```http
POST /api/dev/simulate-failure
```

This endpoint is used to demonstrate the self-healing workflow without requiring an actual website structure change.

---

# 📁 Project Structure

```text
scrapeshield/
│
├── app/
│   ├── api/
│   │   ├── bright-data/
│   │   ├── dev/
│   │   ├── failures/
│   │   ├── repairs/
│   │   ├── runs/
│   │   └── scrapers/
│   │
│   ├── dashboard/
│   ├── scrapers/
│   └── page.tsx
│
├── components/
│   ├── scraper-card.tsx
│   ├── scraper-table.tsx
│   └── ...
│
├── lib/
│   ├── bright-data/
│   │   └── client.ts
│   │
│   ├── db/
│   │   ├── client.ts
│   │   ├── schema.ts
│   │   └── queries.ts
│   │
│   ├── healing/
│   │   ├── analyzer.ts
│   │   ├── candidate-generator.ts
│   │   ├── candidate-tester.ts
│   │   ├── healing-service.ts
│   │   ├── repair-service.ts
│   │   ├── approval-service.ts
│   │   └── verification-service.ts
│   │
│   └── validation/
│       └── validate-scraper-output.ts
│
├── drizzle/
├── public/
├── .env.local
├── drizzle.config.ts
├── next.config.ts
├── package.json
└── README.md
```

---

# ⚙️ Getting Started

## Prerequisites

Make sure you have:

* Node.js
* npm
* PostgreSQL
* Bright Data account
* Bright Data Scraper Studio collector

---

## 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd scrapeshield
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment variables

Create:

```text
.env.local
```

Configure the required database and Bright Data credentials.

Example:

```env
DATABASE_URL=your_postgresql_connection_string

BRIGHT_DATA_API_KEY=your_bright_data_api_key
```

> Never commit `.env.local` or API credentials to GitHub.

---

## 4. Setup database

Run your Drizzle migration workflow:

```bash
npm run db:generate
npm run db:migrate
```

If your project uses a different database script configuration, use the corresponding commands defined in `package.json`.

---

## 5. Start development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 🧪 Testing the Self-Healing Workflow

The easiest way to demonstrate ScrapeShield is using the Books to Scrape website.

## Step 1

Create/configure:

```text
Name:
Books to Scrape

URL:
https://books.toscrape.com/
```

Configure the Bright Data collector.

---

## Step 2

Run the scraper.

Expected result:

```text
20 records
```

---

## Step 3

Simulate a selector failure.

The system should detect:

```text
Affected Field:
price

Old Selector:
.price_color

Failure Type:
schema_invalid
```

---

## Step 4

Click:

```text
Heal Scraper
```

ScrapeShield should:

```text
Analyze failure
      ↓
Generate candidates
      ↓
Test candidates
      ↓
Select .product_price
      ↓
Create repair
      ↓
Deploy new version
      ↓
Verify
      ↓
Retry using Bright Data
```

---

## Step 5

Expected final result:

```text
HEALTHY

Health Score: 100%

Verification: PASSED

Retry: SUCCESS

20 records successfully recovered
```

---

# 🔐 Safety & Reliability Principles

ScrapeShield follows several principles to prevent an incorrect repair from silently damaging the scraping pipeline.

### Never trust a candidate blindly

Every replacement selector is tested before deployment.

### Version every repair

Existing configurations are preserved.

### Verify before considering recovery successful

A candidate must satisfy extraction requirements.

### Keep rollback possible

If verification fails, the previous version can be restored.

### Keep an audit trail

Failures and repairs remain associated with scraper runs and versions.

---

# 📈 Health Model

The scraper maintains operational metrics including:

```text
Health Score
Success Rate
Current Version
Latest Run
Records Found
```

A successful recovery updates the scraper to a healthy state.

Example:

```text
Status       → healthy
Health Score → 100
Version      → v1.2
Records      → 20
```

---

# 🎯 Hackathon Value Proposition

ScrapeShield addresses a common problem in web data infrastructure:

> **Scrapers break frequently because websites change.**

Instead of treating every selector failure as a manual maintenance task, ScrapeShield turns scraper recovery into a structured automated process.

### Traditional scraper

```text
Website change
      ↓
Failure
      ↓
Manual debugging
      ↓
Manual selector update
      ↓
Deployment
```

### ScrapeShield

```text
Website change
      ↓
Failure detected
      ↓
Failure analyzed
      ↓
Candidate discovered
      ↓
Candidate tested
      ↓
Repair version created
      ↓
Verification
      ↓
Automatic retry
      ↓
Data recovered
```

The key differentiator is that ScrapeShield doesn't simply **detect** scraper failure.

It attempts to **recover from it**.

---

# 🧩 Design Principles

The project was built around several engineering principles:

### Separation of concerns

Failure detection, candidate generation, candidate testing, repair management, version management, and verification are separated into dedicated modules.

### Database as source of truth

The UI reflects authoritative backend/database state rather than relying solely on local frontend state.

### Explicit state transitions

Scrapers move through meaningful states such as:

```text
running
collecting
success
failed
healing
healthy
```

### Reversible changes

Repairs create versions rather than destroying the previous configuration.

### Validation-driven deployment

A proposed repair must pass verification before being treated as successful.

---

# 🛣️ Future Improvements

The current implementation focuses on the core self-healing workflow.

Potential future improvements include:

* LLM-assisted failure reasoning
* More advanced DOM similarity analysis
* Multi-field simultaneous repairs
* JavaScript-rendered page analysis
* Automatic scheduled scraper monitoring
* More sophisticated candidate scoring
* Historical scraper health analytics
* Repair confidence thresholds
* Human approval workflows
* Notifications for unrecoverable failures
* Distributed scraping workers
* Queue-based execution
* Retry policies and exponential backoff
* More advanced rollback strategies
* Multi-site scraper templates

These are intentionally outside the current core implementation.

---

# 🏆 Current Project Status

## Core Self-Healing Pipeline

| Capability                   | Status |
| ---------------------------- | ------ |
| Scraper management           | ✅      |
| Bright Data integration      | ✅      |
| Scraper execution            | ✅      |
| Collection polling           | ✅      |
| Output validation            | ✅      |
| Failure detection            | ✅      |
| Failure analysis             | ✅      |
| Candidate generation         | ✅      |
| Candidate testing            | ✅      |
| Candidate ranking            | ✅      |
| Repair creation              | ✅      |
| Repair approval              | ✅      |
| Version management           | ✅      |
| Active version switching     | ✅      |
| Verification                 | ✅      |
| Rollback                     | ✅      |
| Real Bright Data retry       | ✅      |
| Health state synchronization | ✅      |
| Recovery UI                  | ✅      |
| Execution history            | ✅      |
| Production build             | ✅      |

---

AI Coding Assistants used: Chatgpt, Antigravity etc.

---

# 🧪 Verified End-to-End Scenario

The complete recovery pipeline has been successfully tested against:

**Books to Scrape**

```text
Target:
https://books.toscrape.com/

Original selector:
.price_color

Failure:
schema_invalid

Affected field:
price

Replacement selector:
.product_price

Candidate matches:
20

Coverage:
100%

Confidence:
100%

Verification:
PASSED

Bright Data retry:
SUCCESS

Recovered records:
20

Final status:
HEALTHY
```

This confirms that the repair isn't only detected locally — the repaired configuration is successfully used during the real scraper retry.

---

# 👨‍💻 Author

**Aditya Deolalikar**

Software Developer | AI & Data Science

Interested in:

* Full-Stack Development
* AI/ML
* Data Engineering
* Web Scraping
* Developer Tools
* Software Architecture

---

# ⭐ Support

If you find ScrapeShield interesting, consider giving the repository a ⭐ on GitHub.

---
