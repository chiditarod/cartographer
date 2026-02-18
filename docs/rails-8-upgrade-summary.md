# Cartographer: Ruby 2.5.9/Rails 5.2 → Ruby 3.4.8/Rails 8.0 Upgrade

**Completed:** 2026-02-17 | **Branch:** `db/ruby` | **Tests:** 80 pass, 76.82% coverage

## Upgrade Path

```
Ruby 2.5.9/Rails 5.2 → 2.7.8/5.2 → 2.7.8/6.0 → 2.7.8/6.1 → 3.1.7/6.1
→ 3.1.7/7.0 → 3.1.7/7.1 → 3.2.9/7.1 → 3.2.9/7.2 → 3.3.10/7.2 → 3.3.10/8.0 → 3.4.8/8.0
```

12 commits, each green. Leapfrog pattern: bump Ruby to max for current Rails, then bump Rails, repeat.

## Lessons Learned

**Logger gem vs Rails 6.0:** The `logger` gem (1.7.0) redefines the `Logger` constant before Rails boots, breaking `ActiveSupport::LoggerThreadSafeLevel`. Fix: add `require 'logger'` in `config/boot.rb` before bootsnap. Pinning logger versions doesn't help.

**Gemfile.lock — nuke it at each major step.** Running `bundle update` with tight cross-version constraints hangs. Deleting `Gemfile.lock` and running fresh `bundle install` is faster and more reliable.

**Join tables without primary keys (Rails 6.0+):** `destroy`/`delete` on HABTM join records fails with `PG::SyntaxError` on `"table".""`. Use `Model.where(conditions).delete_all` instead.

**CoffeeScript + Sprockets 4:** Sprockets 4 auto-registers a CoffeeScript processor at boot. Even empty `.coffee` files cause `LoadError` if the processor gem is missing. Add `gem 'coffee-script'` or delete all `.coffee` files.

**Puma + Rack 3 (Rails 7.1+):** Puma 5 is incompatible with Rack 3. Must upgrade to Puma 6+.

**Enum syntax (Rails 7.2+):** `enum distance_unit: {...}` → `enum :distance_unit, {...}` (positional arg).

**Config renames across versions:**
- `config.cache_classes` → `config.enable_reloading` (inverse)
- `config.fixture_path` → `config.fixture_paths` (array)
- `show_exceptions = false` → `show_exceptions = :rescuable`

**Ruby 3.0 keyword args:** Fix all Ruby 2.7 deprecation warnings first — they become hard errors in 3.0. We skipped 3.0 entirely (jumped 2.7.8 → 3.1.7) since Rails 6.1 supports both.

**Ruby 3.4 frozen strings:** Add `# frozen_string_literal: true` to all `.rb` files proactively. No runtime breakage in this codebase but it's the direction Ruby is heading.

**Bundler version conflicts:** If the system has bundler 4.x installed alongside 2.x, older Rubies fail. Use `gem uninstall bundler -v <version>` to remove the incompatible one.

## Key Changes Made

| Area | Change |
|------|--------|
| Test coverage | 48% → 77% (added Race, Distances, RouteGenerator, request, job specs) |
| Gems removed | chromedriver-helper, spring, spring-watcher-listen, codeclimate-test-reporter, coffee-rails |
| Gems added | webdrivers, coffee-script, sprockets-rails |
| Config | `load_defaults 8.0`, `autoload_lib`, `enable_reloading`, `:rescuable` |
| All .rb files | `# frozen_string_literal: true` |
| Platforms | `:mingw/:x64_mingw` → `:windows` |

## Remaining Technical Debt

- `google_maps_service` (0.4.2) — unmaintained, may need replacement
- `turbolinks` — consider migrating to Turbo (Hotwire)
- `bootstrap` 4.4.1 — consider upgrading to 5.x
- `uglifier` + `coffee-script` — replace with modern JS pipeline
- `webdrivers` — deprecated; Selenium 4.11+ manages drivers natively
- Sprockets → consider Propshaft or import maps
