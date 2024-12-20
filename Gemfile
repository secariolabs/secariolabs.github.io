source "https://rubygems.org"

# Use the GitHub Pages gem for compatibility with GitHub Pages
gem "github-pages", group: :jekyll_plugins

# Additional Jekyll plugins
group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.12"         # Atom feed generation
  gem "jekyll-paginate-v2"             # Advanced pagination
  gem "jekyll-sitemap"                 # Generate a sitemap.xml
end

# Dependencies for Windows and JRuby platforms
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"          # Time zone support
  gem "tzinfo-data"                    # Zoneinfo data for non-Unix platforms
end

# JRuby-specific HTTP parser
gem "http_parser.rb", "~> 0.6.0", platforms: [:jruby]
