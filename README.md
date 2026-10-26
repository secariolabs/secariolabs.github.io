# Secario Labs Website (Jekyll / GitHub Pages)

Official production codebase for [secariolabs.com](https://secariolabs.com).

## Overview & Architecture

- **Static Site Generator**: Jekyll `~> 4.3.4`
- **Hosting / CI**: GitHub Pages automated deployment via `.github/workflows/jekyll-action.yml`
- **Design System**: Dark technical slate theme (`#121316`), elevated card surfaces (`#18191f`), crisp high-contrast typography (`#ffffff` headings, `#e2e8f0` body), softened brand red accents (`#921f20`, `#c93b3b`, `#e04f4f`), and modern light textured sections (`modern-light-mesh.jpg`).
- **Headquarters**: Sofia, Bulgaria (`Metro City Business Center, Sofia 1712, Bulgaria`).
- **Core Functionalities**:
  - **Single Consolidated Services Page** (`/services/`): Unified 4-pillar catalog (Offensive Security, Blue Team & MDR, Cloud & DevOps Operations, Information Security & ISO 27001). `/defence/` cleanly redirects to `/services/#defensive`.
  - **Discovery Call Booking**: Integrated Microsoft 365 calendar modal (`[data-open-modal]`) and direct booking buttons linked to `site.data.global.booking_url`.
  - **Inquiry & Scoping Form**: Integrated with GetForm (`https://getform.io/f/bqoodwyb`) and client-side Pristine validation.
  - **Blog & Technical Articles**: Paginated research feed with code block syntax highlighting (Prism.js) and click-to-zoom image lightboxes.
  - **Promo Banner**: 15% quote discount banner with persistent dismissal state (`localStorage`).

---

## Local Development & Testing

### Prerequisites
- **Ruby** `3.1+` with Bundler (`gem install bundler`)
- **Node.js** `20+` and npm (for image optimization & asset pipeline)

### Installation
```bash
# Install Ruby dependencies
bundle install

# Install npm tools
npm install
```

### Running Locally
```bash
# Start the Jekyll development server
bundle exec jekyll serve --livereload
```
Visit `http://localhost:4000` in your web browser.

### Building for Production
```bash
bundle exec jekyll build --config _config.yml,_config.production.yml
gulp go
```

---

## Deploying to GitHub Pages

This repository is pre-configured with `.github/workflows/jekyll-action.yml`.
When you push the contents of this folder to the `main` branch of your GitHub repository:
1. GitHub Actions automatically installs Ruby 3.1 and Node 20.
2. Runs `bundle exec jekyll build --config _config.yml,_config.production.yml`.
3. Optimizes web images via Gulp.
4. Deploys the built site artifact directly to GitHub Pages.

---

## Content Authoring

### Blog Posts
Store new Markdown posts in `_posts/` with the filename format `YYYY-MM-DD-title.md`:
```markdown
---
layout: post
title: "Article Title"
date: YYYY-MM-DD
tags: ["Offensive Security", "Research"]
excerpt: "Short 1-2 sentence preview for search and index feeds."
---

Your content in Markdown...
```

### Global Site Configuration
- `_data/global.yml`: Site title, meta description, booking URL, office location, contact phone, email, social media links.
- `_data/navigation.yml`: Header navigation items.
