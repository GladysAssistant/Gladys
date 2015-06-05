'use strict';

module.exports = {
    
    folderName: 'example',
    // Inject Boxs in dashboard
    // dashboadBoxs is an array of dashboardBox 
    dashboardBoxs: [{
        title: 'Example',
        // the name of your Angular Controller for this box (put an empty string if you don't use angular)
        ngController: '',
        file : 'box.ejs',
        icon: 'fa fa-code',
        type: ''
    }],
    // link assets to project
    linkAssets: true
};