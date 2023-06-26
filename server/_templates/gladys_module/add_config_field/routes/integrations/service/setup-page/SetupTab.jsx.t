---
inject: true
to: ../front/src/routes/integration/all/<%= module %>/setup-page/SetupTab.jsx
after: "<form id=\"<%= attributeName %>SetupForm\">"
skip_if: "<div class=\"form-group\" id=\"<%= fieldAttributeName %>Field\">"
---
              
              <div class="form-group" id="<%= fieldAttributeName %>Field">
                <label for="<%= attributeName %><%= fieldClassName %>" class="form-label">
                  <Text id={`integration.<%= module %>.setup.<%= fieldAttributeName %>Label`} />
                </label>
                <Localizer>
                  <input
                    name="<%= attributeName %><%= fieldClassName %>"
                    placeholder={<Text id="integration.<%= module %>.setup.<%= fieldAttributeName %>Placeholder" />}
                    value={props.<%= attributeName %><%= fieldClassName %>}
                    class="form-control"
                    onInput={props.updateConfiguration}
                  />
                </Localizer>
              </div>
