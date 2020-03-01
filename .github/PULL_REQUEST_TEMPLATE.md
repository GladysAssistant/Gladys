### Pull Request check-list

To ensure your Pull Request can be accepted as fast as possible, make sure to review and check all of these items:

- [ ] If your changes affects code, did your write the tests?
- [ ] Are tests passing? (`npm test` on both front/server)
- [ ] Is the linter passing? (`npm run eslint` on both front/server)
- [ ] Did you run prettier? (`npm run prettier` on both front/server)
- [ ] If you are adding a new features/services, did you run integration comparator? (`npm run compare-integrations` on front)
- [ ] If your changes modify the API (REST or Node.js), did you modify the API documentation? (Documentation is based on comments in code)
- [ ] If you are adding a new features/services which needs explanation, did you modify the user documentation? See [the GitHub repo](https://github.com/GladysAssistant/gladys-4-docs) and the [website](https://documentation.gladysassistant.com).
- [ ] Did you add fake requests data for the demo mode (`front/src/config/demo.json`) so that the demo website is working without a backend? (if needed) See [https://demo.gladysassistant.com](https://demo.gladysassistant.com).

NOTE: these things are not required to open a PR and can be done afterwards / while the PR is open.

### Description of change

Please provide a description of the change here. It's always best with screenshots, so don't hesitate to add some!
