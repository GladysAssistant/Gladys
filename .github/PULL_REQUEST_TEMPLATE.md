### Description

<!-- A short description of the change. Screenshots are always welcome! -->

### Related request

<!--
If this pull request answers a forum topic or a GitHub issue, please link it
here (strongly recommended): keep the matching line below and fill it in.
This link is what ties the PR to its topic and lets the release automations
run (announcing the release on the forum topic and closing the topic / issue
when the feature ships). Without it, those automations cannot happen.

- Feature requested on the community forum: paste the topic URL on a single
  line using this exact format (the release pipeline parses it):

  Forum: https://community.gladysassistant.com/t/...

- Bug or feature tracked in a GitHub issue: use a closing keyword so GitHub
  links the issue and closes it when the PR is merged:

  Closes #1234
-->

### Checklist

- [ ] If a forum topic or GitHub issue exists, the description links it (`Forum: https://community.gladysassistant.com/t/...` or `Closes #...`)
- [ ] Tests pass: `cd server && npm run coverage` (Codecov requires 100% coverage on changed lines) and Cypress (`npm run cypress:run`) if the UI changed
- [ ] Linter and prettier pass on both front and server (`npm run eslint`, `npm run prettier`)
- [ ] No undocumented breaking change

<!--
More details in the contribution guide: .github/CONTRIBUTING.md
Testing in real life with real devices is always appreciated. An AMD64 preview
Docker image is built automatically for non-draft PRs; for ARM64, comment
/build-arm64 on the PR.
-->
