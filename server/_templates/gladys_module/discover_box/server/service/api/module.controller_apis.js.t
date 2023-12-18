---
inject: true
to: "./services/<%= module %>/api/<%= module %>.controller.js"
before: "  return {"
skip_if: "async function discover(req, res) {"
---
  /**
   * @api {get} /api/v1/service/<%= module %>/discover Discover <%= className %> devices
   * @apiName discover
   * @apiGroup <%= className %>
   */
  async function discover(req, res) {
    const response = <%= attributeName %>Handler.discover();
    res.json(response);
  }
  