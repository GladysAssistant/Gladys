### Description

<!-- A short description of the change. Screenshots are always welcome! -->

## Forum

<!--
If this pull request implements a feature requested on the community forum,
paste the topic URL on a single line using this exact format:

Forum: https://community.gladysassistant.com/t/...

This link is what allows the release pipeline to automatically notify the
forum topic when the feature ships.
-->

### Checklist

- [ ] Tests pass: `cd server && npm run coverage` (Codecov requires 100% coverage on changed lines) and Cypress (`npm run cypress:run`) if the UI changed
- [ ] Linter and prettier pass on both front and server (`npm run eslint`, `npm run prettier`)
- [ ] No undocumented breaking change

<!--
More details in the contribution guide: .github/CONTRIBUTING.md
Testing in real life with real devices is always appreciated. An AMD64 preview
Docker image is built automatically for non-draft PRs; for ARM64, comment
/build-arm64 on the PR.
-->
