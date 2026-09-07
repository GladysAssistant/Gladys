### Description

<!-- A short description of the change. Screenshots are always welcome! -->

### Related request (required)

<!--
Every pull request must link the request it answers. Keep ONE of the two lines
below (delete the other) and fill it in. Without this link, the PR cannot be
tied to its topic and the release automations (announcing the release on the
forum topic and closing the topic / issue when the feature ships) cannot run.

- Feature requested on the community forum: paste the topic URL on a single
  line using this exact format (the release pipeline parses it):

  Forum: https://community.gladysassistant.com/t/...

- Bug or feature tracked in a GitHub issue: use a closing keyword so GitHub
  links the issue and closes it when the PR is merged:

  Closes #1234
-->

### Checklist

- [ ] The description links the forum topic (`Forum: https://community.gladysassistant.com/t/...`) or the GitHub issue (`Closes #...`)
- [ ] Tests pass: `cd server && npm run coverage` (Codecov requires 100% coverage on changed lines) and Cypress (`npm run cypress:run`) if the UI changed
- [ ] Linter and prettier pass on both front and server (`npm run eslint`, `npm run prettier`)
- [ ] No undocumented breaking change

<!--
More details in the contribution guide: .github/CONTRIBUTING.md
Testing in real life with real devices is always appreciated. An AMD64 preview
Docker image is built automatically for non-draft PRs; for ARM64, comment
/build-arm64 on the PR.
-->
