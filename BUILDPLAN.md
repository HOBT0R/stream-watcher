# Build Pipeline Plan

This document captures the agreed-upon CI/CD pipeline for **Stream Watcher**.

---
## High-level stages
1. **Tests** – run Vitest; fail fast on red tests.
2. **Coverage gate** – enforce minimum percentage thresholds; build stops if they're not met.
3. **Docker build** – build and tag the image only after stages 1–2 succeed.
4. **Version & tag** – derive the semantic version from `package.json`, create a matching Git tag (`vX.Y.Z`), and tag the Docker image (`X.Y.Z` and `latest`).
5. **Publish artifact** – push the image to the registry **and** upload a `*.tar` copy so it can be transferred to an offline server.

---
## Coverage thresholds (Vitest)
Add/ensure the following inside `vitest.config.ts`:
```ts
coverage: {
  reporter: ['text', 'html', 'lcov'],
  all: true, // include un-tested files
  threshold: {
    lines: 80,
    functions: 80,
    branches: 80,
  },
},
```
Vitest exits with a non-zero status if thresholds are not met, allowing CI to gate on coverage.

---
## GitHub Actions workflow (`.github/workflows/build.yml`)
```yaml
name: test-build-release

# Trigger on pushes to main and on version tags (v*.*.*)
on:
  push:
    branches: [main]
    tags:     ['v*.*.*']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests & enforce coverage
        run: npm run test

  build-docker:
    needs: test  # only runs when tests pass
    runs-on: ubuntu-latest
    env:
      IMAGE_NAME: stream-watcher
      REGISTRY: ghcr.io/${{ github.repository_owner }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      # Build static assets
      - run: npm ci
      - run: npm run build
      # Docker build
      - uses: docker/setup-buildx-action@v3
      - name: Derive semver tag
        id: vars
        run: |
          VERSION=$(node -p "require('./package.json').version")
          echo "version=$VERSION" >> $GITHUB_OUTPUT
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.vars.outputs.version }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          outputs: type=docker,dest=/tmp/${{ env.IMAGE_NAME }}.tar
      # Upload tarball artifact
      - uses: actions/upload-artifact@v4
        with:
          name: stream-watcher-docker-tar
          path: /tmp/${{ env.IMAGE_NAME }}.tar
          retention-days: 30
      # Push image to registry
      - name: Log in to registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ secrets.REGISTRY_USER }}
          password: ${{ secrets.REGISTRY_TOKEN }}
      - name: Push image
        run: |
          docker load -i /tmp/${{ env.IMAGE_NAME }}.tar
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.vars.outputs.version }}
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
      # Create Git tag
      - name: Tag repo with v$VERSION
        if: github.ref == 'refs/heads/main'
        env:
          VERSION: ${{ steps.vars.outputs.version }}
        run: |
          git config user.name  "github-actions"
          git config user.email "github-actions@users.noreply.github.com"
          git tag -a "v$VERSION" -m "Release $VERSION"
          git push origin "v$VERSION"
```

---
## Required repository secrets
| Secret name          | Purpose                                  |
|----------------------|-------------------------------------------|
| `REGISTRY_USER`      | Username for Docker registry login        |
| `REGISTRY_TOKEN`     | Password/token for Docker registry        |

---
## Release workflow summary
1. Merge PR → `main` → CI runs.
2. Tests & coverage gate.
3. Build Docker image (`VERSION` from `package.json`).
4. Artifact: `*.tar` + pushed image (`VERSION` & `latest`).
5. Auto-tag commit with `vVERSION`.

Keep this file up-to-date if the pipeline or thresholds change. 