# Contributing to Gladys

We’re thrilled to have you here! 🎉  
Open-source thrives when passionate people like you get involved — whether you're fixing bugs, adding features, or just sharing ideas. Thank you!

Here’s how you can contribute to Gladys:

- 🐞 Report bugs
- 💬 Discuss improvements or architecture
- 🔧 Submit bug fixes or improvements
- ✨ Propose new features
- 🤝 Become a long-term contributor or maintainer

---

## 💻 We Use GitHub for Everything

Gladys is fully managed on [GitHub](https://github.com/gladysassistant/Gladys).  
We use it to:

- Host the code
- Track bugs
- Collaborate on pull requests

---

## 🛠️ Set Up Your Development Environment

Ready to contribute code? Start by setting up your local dev environment:

- [MacOS/Linux setup guide](https://gladysassistant.com/docs/dev/setup-development-environment-mac-linux/)
- [Windows setup guide](https://gladysassistant.com/docs/dev/setup-development-environment-windows/)

---

## 🚀 Before Submitting a Pull Request

We recommend starting with a quick discussion on the Gladys forum to make sure your idea aligns with ongoing development:

🌐 [Forum](https://community.gladysassistant.com/)

Then, follow our guide:

👉 [How to contribute a new service](https://gladysassistant.com/docs/dev/developing-a-service/)

> ⚠️ If your PR adds new **device categories or types** (`DEVICE_FEATURE_CATEGORIES` / `DEVICE_FEATURE_TYPES`), read the [device feature categories design & review criteria](../docs/specs/device-feature-categories.md) first: categories must describe generic capabilities (never a specific brand) and align with mature standards like Matter and Zigbee.
>
> 💡 As soon as you have some code, feel free to open a **Draft Pull Request**. This allows the team to follow your progress and provide early feedback.

---

## 🏷️ Labels & Forum Link

Most labels are applied automatically, you don't need to set them yourself:

- `type:feature` / `type:fix` / `type:chore` — set automatically when the PR is opened (you can pre-set one manually, it won't be overwritten)
- `area:*` (server, front, integration, ai, infra) — set automatically from the files changed
- `risk:high` / `needs:human-review` — set by the automated review

Labels for contributors: look for [`good first issue`](https://github.com/gladysassistant/Gladys/labels/good%20first%20issue) and [`help wanted`](https://github.com/gladysassistant/Gladys/labels/help%20wanted) to find issues to work on.

If your PR implements a forum request, add a line `Forum: https://community.gladysassistant.com/t/...` in the PR description (see the PR template): the release pipeline uses it to notify the forum topic when the feature ships.

---

## 🤖 Automated review

An automated review runs on your PR as soon as you open it. A draft PR waits until you mark it **ready for review**.

Two cases do not get that automatic review: PRs authored by `dependabot[bot]` or `renovate[bot]`, and PRs from contributors whose first contribution has not been merged yet. **If this is your first PR here, just ask for a review in a comment** (see below) or wait for a maintainer — nothing is wrong with your PR.

To ask for a new review after pushing changes, comment on the PR:

```
/cursor review
```

`/cursor-review` works too, and the command is case-insensitive. It has to start its own line — anything you write after it on the same line is ignored, and quoting someone else's command (`> /cursor review`) never triggers a review.

The command works for the PR author and for repository owners, organization members and collaborators. The bot reacts to your comment with 👀 when the request is accepted, 🚀 once the review has been started, and 👎 if you are not allowed to ask for one. Maintainers can also add the `needs:cursor-review` label, which triggers the same thing.

---

## 📜 Licensing

All contributions to Gladys are submitted under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0).  
By submitting a pull request, you agree to license your code under the same terms.

---

## 🐛 Reporting Bugs

We use [GitHub Issues](https://github.com/gladysassistant/Gladys/issues) to track bugs.

To report a bug:

1. Head over to the [issues tab](https://github.com/gladysassistant/Gladys/issues)
2. Click on **New Issue**
3. Describe the problem clearly
4. Hit submit — that’s it!

---

Thanks again for helping us make Gladys better ❤️
