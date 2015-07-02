/**
 * Created by jaumard on 11/05/2015.
 */
module.exports = {
    /**
     * Can be overrided on ExampleController.js file on your sails server
     * @param req
     * @param res
     */
    test: function (req, res) {
        console.log("test method on ExampleController");
        res.json('ok');
    }
};