---
inject: true
to: ../front/src/routes/integration/all/<%= module %>/<%= className %>Page.js
after: "</Link>"
skip_if: "integration.<%= module %>.deviceTab"
---
                  
                  <Link
                    href="/dashboard/integration/device/<%= module %>"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-link" />
                    </span>
                    <Text id="integration.<%= module %>.deviceTab" />
                  </Link>