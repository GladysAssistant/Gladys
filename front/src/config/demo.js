import dayjs from 'dayjs';

const data = {
  'post /api/v1/login': {
    id: '215811c9-c0aa-4148-8a4b-e02892d7446f',
    firstname: 'tony',
    lastname: 'Stark',
    email: 'tony.stark@gladysassistant.com',
    language: 'en',
    birthdate: '2011-02-04',
    role: 'admin',
    created_at: '2019-02-20T04:26:47.811Z',
    updated_at: '2019-02-20T04:26:47.811Z',
    refresh_token:
      '15535ed55088d46b9a01738bfb2b96f982fb16edb2a5241d078775a7db8aa38a8ae59e73f81aa5367b62b1daef8aea5e3b7de4ff66dc8fb00f6ed02b6c3eb14ac68b1716e9cdb9425f88bf2eeb5b8cc3b4eb66913bbd8e5084381dc22fe1ff092c0efd80f2ec766511f03121bdffcc02202a20d5916e6e58c6aed4a84fb9980a99b828c8ded74d17e3c91108f7e50dccb80281720b6b37fe26345371cd2b4a1134abfbc63689814375aee968af15dc24379c7c95200c0c1740817806abfca934ccb4fb183e4c95e19f55a2e4c8a3bb453cf0700a6f7baa7088b24297d212f2ccfc3586093c28e731e9909addbead2b9c095f1a7f8993f4ddd405',
    access_token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOTJiZjk0NDEtYzljMC00YTVmLWI3YmItNGY3NmYwZWM0Yzk1Iiwic2NvcGUiOlsiZGFzaGJvYXJkOndyaXRlIiwiZGFzaGJvYXJkOnJlYWQiXSwic2Vzc2lvbl9pZCI6IjZhOTYyNzk2LTZlMGQtNDRiNC04Y2Y2LWRkMmJhYjhjY2M0ZiIsImlhdCI6MTU1MTA2NzM5MywiZXhwIjoxNTUxMTUzNzkzLCJhdWQiOiJ1c2VyIiwiaXNzIjoiZ2xhZHlzIn0.JfiRsTn4cyARIMElD5DgyFt7xKHPcTNnaMLKznbfVc4'
  },
  'get /api/v1/me': {
    id: '215811c9-c0aa-4148-8a4b-e02892d7446f',
    firstname: 'Tony',
    lastname: 'Stark',
    selector: 'tony',
    email: 'tony.stark@gladysassistant.com',
    language: navigator.language === 'fr' ? 'fr' : 'en',
    birthdate: '2011-02-04',
    role: 'admin',
    created_at: '2019-02-20T04:26:47.811Z',
    updated_at: '2019-02-20T04:26:47.811Z',
    refresh_token:
      '15535ed55088d46b9a01738bfb2b96f982fb16edb2a5241d078775a7db8aa38a8ae59e73f81aa5367b62b1daef8aea5e3b7de4ff66dc8fb00f6ed02b6c3eb14ac68b1716e9cdb9425f88bf2eeb5b8cc3b4eb66913bbd8e5084381dc22fe1ff092c0efd80f2ec766511f03121bdffcc02202a20d5916e6e58c6aed4a84fb9980a99b828c8ded74d17e3c91108f7e50dccb80281720b6b37fe26345371cd2b4a1134abfbc63689814375aee968af15dc24379c7c95200c0c1740817806abfca934ccb4fb183e4c95e19f55a2e4c8a3bb453cf0700a6f7baa7088b24297d212f2ccfc3586093c28e731e9909addbead2b9c095f1a7f8993f4ddd405',
    access_token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOTJiZjk0NDEtYzljMC00YTVmLWI3YmItNGY3NmYwZWM0Yzk1Iiwic2NvcGUiOlsiZGFzaGJvYXJkOndyaXRlIiwiZGFzaGJvYXJkOnJlYWQiXSwic2Vzc2lvbl9pZCI6IjZhOTYyNzk2LTZlMGQtNDRiNC04Y2Y2LWRkMmJhYjhjY2M0ZiIsImlhdCI6MTU1MTA2NzM5MywiZXhwIjoxNTUxMTUzNzkzLCJhdWQiOiJ1c2VyIiwiaXNzIjoiZ2xhZHlzIn0.JfiRsTn4cyARIMElD5DgyFt7xKHPcTNnaMLKznbfVc4'
  },
  'get /api/v1/me/picture':
    'data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAA8AAD/4QN3aHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzEzOCA3OS4xNTk4MjQsIDIwMTYvMDkvMTQtMDE6MDk6MDEgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6MTI2MGJlNWQtZGNmNS00ZjQ4LWFlMDktMGEyMmMyMTk5ODRhIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjA1OEYwOUNGNzU0NzExRTk4QUQyQjRBMzgwQkI2MUUwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjA1OEYwOUNFNzU0NzExRTk4QUQyQjRBMzgwQkI2MUUwIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE3IChXaW5kb3dzKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjhENDY0NEYzRjU2MTExRTZCRDFDRjlEQkVEMTk5NEU3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjhENDY0NEY0RjU2MTExRTZCRDFDRjlEQkVEMTk5NEU3Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpS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',
  'get /api/v1/user?fields=id,firstname,selector,picture,last_latitude,last_longitude,last_altitude,last_accuracy,last_location_changed': [
    {
      firstname: 'Tony',
      last_latitude: 41.93425385676557,
      last_longitude: 12.402756238310928,
      picture:
        'data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAA8AAD/4QN3aHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzEzOCA3OS4xNTk4MjQsIDIwMTYvMDkvMTQtMDE6MDk6MDEgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6MTI2MGJlNWQtZGNmNS00ZjQ4LWFlMDktMGEyMmMyMTk5ODRhIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjA1OEYwOUNGNzU0NzExRTk4QUQyQjRBMzgwQkI2MUUwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjA1OEYwOUNFNzU0NzExRTk4QUQyQjRBMzgwQkI2MUUwIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE3IChXaW5kb3dzKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjhENDY0NEYzRjU2MTExRTZCRDFDRjlEQkVEMTk5NEU3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjhENDY0NEY0RjU2MTExRTZCRDFDRjlEQkVEMTk5NEU3Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpS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'
    }
  ],
  'post /api/v1/access-token': {
    access_token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOTJiZjk0NDEtYzljMC00YTVmLWI3YmItNGY3NmYwZWM0Yzk1Iiwic2NvcGUiOlsiZGFzaGJvYXJkOndyaXRlIiwiZGFzaGJvYXJkOnJlYWQiXSwic2Vzc2lvbl9pZCI6IjZhOTYyNzk2LTZlMGQtNDRiNC04Y2Y2LWRkMmJhYjhjY2M0ZiIsImlhdCI6MTU1MTA2NzM5MywiZXhwIjoxNTUxMTUzNzkzLCJhdWQiOiJ1c2VyIiwiaXNzIjoiZ2xhZHlzIn0.JfiRsTn4cyARIMElD5DgyFt7xKHPcTNnaMLKznbfVc4'
  },
  'post /api/v1/user': {
    id: '215811c9-c0aa-4148-8a4b-e02892d7446f',
    firstname: 'tony',
    lastname: 'Stark',
    email: 'tony.stark@gladysassistant.com',
    language: 'en',
    birthdate: '2011-02-04',
    role: 'admin',
    created_at: '2019-02-20T04:26:47.811Z',
    updated_at: '2019-02-20T04:26:47.811Z',
    refresh_token:
      '15535ed55088d46b9a01738bfb2b96f982fb16edb2a5241d078775a7db8aa38a8ae59e73f81aa5367b62b1daef8aea5e3b7de4ff66dc8fb00f6ed02b6c3eb14ac68b1716e9cdb9425f88bf2eeb5b8cc3b4eb66913bbd8e5084381dc22fe1ff092c0efd80f2ec766511f03121bdffcc02202a20d5916e6e58c6aed4a84fb9980a99b828c8ded74d17e3c91108f7e50dccb80281720b6b37fe26345371cd2b4a1134abfbc63689814375aee968af15dc24379c7c95200c0c1740817806abfca934ccb4fb183e4c95e19f55a2e4c8a3bb453cf0700a6f7baa7088b24297d212f2ccfc3586093c28e731e9909addbead2b9c095f1a7f8993f4ddd405',
    access_token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOTJiZjk0NDEtYzljMC00YTVmLWI3YmItNGY3NmYwZWM0Yzk1Iiwic2NvcGUiOlsiZGFzaGJvYXJkOndyaXRlIiwiZGFzaGJvYXJkOnJlYWQiXSwic2Vzc2lvbl9pZCI6IjZhOTYyNzk2LTZlMGQtNDRiNC04Y2Y2LWRkMmJhYjhjY2M0ZiIsImlhdCI6MTU1MTA2NzM5MywiZXhwIjoxNTUxMTUzNzkzLCJhdWQiOiJ1c2VyIiwiaXNzIjoiZ2xhZHlzIn0.JfiRsTn4cyARIMElD5DgyFt7xKHPcTNnaMLKznbfVc4'
  },
  'patch /api/v1/user': {
    id: '215811c9-c0aa-4148-8a4b-e02892d7446f',
    firstname: 'tony',
    lastname: 'Stark',
    email: 'tony.stark@gladysassistant.com',
    language: 'en',
    birthdate: '2011-02-04',
    role: 'admin',
    created_at: '2019-02-20T04:26:47.811Z',
    updated_at: '2019-02-20T04:26:47.811Z',
    refresh_token:
      '15535ed55088d46b9a01738bfb2b96f982fb16edb2a5241d078775a7db8aa38a8ae59e73f81aa5367b62b1daef8aea5e3b7de4ff66dc8fb00f6ed02b6c3eb14ac68b1716e9cdb9425f88bf2eeb5b8cc3b4eb66913bbd8e5084381dc22fe1ff092c0efd80f2ec766511f03121bdffcc02202a20d5916e6e58c6aed4a84fb9980a99b828c8ded74d17e3c91108f7e50dccb80281720b6b37fe26345371cd2b4a1134abfbc63689814375aee968af15dc24379c7c95200c0c1740817806abfca934ccb4fb183e4c95e19f55a2e4c8a3bb453cf0700a6f7baa7088b24297d212f2ccfc3586093c28e731e9909addbead2b9c095f1a7f8993f4ddd405',
    access_token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOTJiZjk0NDEtYzljMC00YTVmLWI3YmItNGY3NmYwZWM0Yzk1Iiwic2NvcGUiOlsiZGFzaGJvYXJkOndyaXRlIiwiZGFzaGJvYXJkOnJlYWQiXSwic2Vzc2lvbl9pZCI6IjZhOTYyNzk2LTZlMGQtNDRiNC04Y2Y2LWRkMmJhYjhjY2M0ZiIsImlhdCI6MTU1MTA2NzM5MywiZXhwIjoxNTUxMTUzNzkzLCJhdWQiOiJ1c2VyIiwiaXNzIjoiZ2xhZHlzIn0.JfiRsTn4cyARIMElD5DgyFt7xKHPcTNnaMLKznbfVc4'
  },
  'get /api/v1/user?fields=firstname,lastname,role,selector,picture,current_house_id,last_house_changed': [
    {
      firstname: 'Tony',
      lastname: 'Stark',
      role: 'admin',
      selector: 'tony',
      picture:
        'data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAA8AAD/4QN3aHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzEzOCA3OS4xNTk4MjQsIDIwMTYvMDkvMTQtMDE6MDk6MDEgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6MTI2MGJlNWQtZGNmNS00ZjQ4LWFlMDktMGEyMmMyMTk5ODRhIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjA1OEYwOUNGNzU0NzExRTk4QUQyQjRBMzgwQkI2MUUwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjA1OEYwOUNFNzU0NzExRTk4QUQyQjRBMzgwQkI2MUUwIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE3IChXaW5kb3dzKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjhENDY0NEYzRjU2MTExRTZCRDFDRjlEQkVEMTk5NEU3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjhENDY0NEY0RjU2MTExRTZCRDFDRjlEQkVEMTk5NEU3Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpS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',
      current_house_id: '8fe7acf2-f27b-46d4-9f8e-c871ab1e6780',
      last_house_changed: '2021-07-12T07:22:19.014Z'
    },
    {
      firstname: 'Pepper',
      lastname: 'Pots',
      role: 'admin',
      selector: 'pepper',
      picture:
        'data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAA8AAD/4QMfaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzEzOCA3OS4xNTk4MjQsIDIwMTYvMDkvMTQtMDE6MDk6MDEgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjA1OEYwOUQzNzU0NzExRTk4QUQyQjRBMzgwQkI2MUUwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjA1OEYwOUQyNzU0NzExRTk4QUQyQjRBMzgwQkI2MUUwIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE3IE1hY2ludG9zaCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSIxRDA4OTdGQUMxQ0RFMEFBMzRFMTMwQzJBOUY0OUEzRiIgc3RSZWY6ZG9jdW1lbnRJRD0iMUQwODk3RkFDMUNERTBBQTM0RTEzMEMyQTlGNDlBM0YiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAAGBAQEBQQGBQUGCQYFBgkLCAYGCAsMCgoLCgoMEAwM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',
      current_house_id: '',
      last_house_changed: '2021-07-12T07:22:19.014Z'
    }
  ],
  'get /api/v1/dashboard': [
    {
      id: '329897d2-0620-458c-addf-4009ff5bc205',
      name: 'Home',
      type: 'main',
      selector: 'home'
    }
  ],
  'get /api/v1/dashboard/home': {
    id: '329897d2-0620-458c-addf-4009ff5bc205',
    name: 'Home',
    type: 'main',
    selector: 'home',
    boxes: [
      [
        {
          type: 'temperature-in-room',
          room: 'living-room'
        },
        {
          type: 'weather',
          house: 'main-house'
        },
        {
          type: 'camera',
          camera: 'living-room-camera',
          name: 'Garden'
        },
        {
          type: 'devices-in-room',
          room: 'exterior',
          device_features: ['aqi-city']
        },
        {
          type: 'edf-tempo'
        }
      ],
      [
        {
          type: 'devices-in-room',
          room: 'living-room',
          device_features: [
            'main-lamp-binary',
            'tv-lamp-binary',
            'tv-lamp-color',
            'tv-lamp-brightness',
            'mqtt-living-room-switch',
            'mqtt-living-room-dimmer',
            'mqtt-living-room-temp',
            'co-living-room'
          ]
        },
        {
          type: 'devices-in-room',
          room: 'living-room',
          device_features: [
            'main-tv-binary',
            'main-tv-volume',
            'main-tv-channel',
            'main-presence-sensor',
            'main-signal-sensor',
            'air-conditioning',
            'button-click'
          ]
        }
      ],
      [
        {
          type: 'chart',
          device_features: ['temperature-sensor-1'],
          interval: 'last-month',
          unit: 'celsius',
          title: 'Temperature',
          display_variation: true
        },
        {
          type: 'user-presence'
        },
        {
          type: 'devices-in-room',
          room: 'parental-room',
          device_features: [
            'curtain-actions',
            'shutter-actions',
            'shutter-position',
            'thermostat',
            'water-leak',
            'smoke-sensor',
            'light-sensor'
          ]
        }
      ]
    ],
    created_at: '2019-05-15T08:48:20.275Z',
    updated_at: '2019-05-16T06:29:44.767Z'
  },
  'patch /api/v1/dashboard/home': {
    id: '329897d2-0620-458c-addf-4009ff5bc205',
    name: 'Home',
    type: 'main',
    selector: 'home',
    boxes: [
      [
        {
          type: 'weather',
          house: 'main-house'
        },
        {
          type: 'camera',
          camera: 'living-room-camera',
          name: 'Garden'
        }
      ],
      [
        {
          type: 'temperature-in-room',
          room: 'living-room'
        },
        {
          type: 'user-presence'
        },
        {
          type: 'devices-in-room',
          room: 'living-room'
        }
      ],
      [
        {
          type: 'devices-in-room',
          room: 'kitchen'
        }
      ]
    ],
    created_at: '2019-05-15T08:48:20.275Z',
    updated_at: '2019-05-16T06:29:44.767Z'
  },
  'get /api/v1/session/tablet_mode': {
    tablet_mode: false,
    current_house_id: 'house'
  },
  'get /api/v1/house/main-house/weather': {
    temperature: 27.9,
    humidity: 0.99,
    pressure: 1005.09,
    datetime: '2019-05-09T04:27:57.000Z',
    units: 'metric',
    wind_speed: 1.96,
    weather: 'rain',
    house: {
      id: '6a29f33b-e5c9-4b08-9d3f-ced2cab80a87',
      name: 'Main house',
      selector: 'main-house',
      created_at: '2019-02-20T04:26:47.811Z',
      updated_at: '2019-02-20T04:26:47.811Z'
    },
    options: {
      latitude: 12,
      longitude: 12,
      language: 'en'
    },
    hours: [
      {
        temperature: 27.9,
        humidity: 0.99,
        pressure: 1005.09,
        datetime: '2019-05-09T04:27:57.000Z',
        units: 'metric',
        wind_speed: 1.96,
        wind_direction: 1.96,
        weather: 'rain'
      }
    ],
    days: [
      {
        temperature_min: 20.9,
        temperature_max: 27.9,
        humidity: 0.99,
        pressure: 1005.09,
        datetime: '2019-05-09T04:27:57.000Z',
        units: 'metric',
        wind_speed: 1.96,
        wind_direction: 1.96,
        weather: 'rain'
      }
    ]
  },
  'get /api/v1/room/living-room?expand=temperature,devices': {
    id: '1c634ff4-0476-4733-a084-b4a43d649c84',
    name: 'Living Room',
    selector: 'living-room',
    temperature: {
      temperature: 26.5,
      unit: 'celsius'
    }
  },
  'get /api/v1/camera/living-room-camera/image':
    'data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAA1AAD/4QMJaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzEzOCA3OS4xNTk4MjQsIDIwMTYvMDkvMTQtMDE6MDk6MDEgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjRFMTgwODcwNzU0MjExRTk5Nzc5RkZBMTY3OTgyRDBEIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjRFMTgwODZGNzU0MjExRTk5Nzc5RkZBMTY3OTgyRDBEIiB4bXA6Q3JlYXRvclRvb2w9IlZlci4xLjAuMDAwIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9IkYzN0JCRDNCMzkwRTdEQ0NEMkQ5ODI4MDFGNTkwMTZBIiBzdFJlZjpkb2N1bWVudElEPSJGMzdCQkQzQjM5MEU3RENDRDJEOTgyODAxRjU5MDE2QSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pv/tAEhQaG90b3Nob3AgMy4wADhCSU0EBAAAAAAADxwBWgADGyVHHAIAAAIAAgA4QklNBCUAAAAAABD84R+JyLfJeC80YjQHWHfr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mUgIL2HDcptx537RXyPsbduJzXs011UM7MizJx6zmRtwWN4zqF5buI48a4bdu/nP+WppFFHhxAViViAfPc7XbcOFtNOym2l7JnwS+qGaZnjSI3VV1UjVAdTt8vPgKa6zz8nlVy+s5674k8qtY70J2gXsWsON++t9f19PKXaoMSdJXsyqrEbEY6gNb4mGpPZXXfXEZlNfp+fPneiVLynU3IO0ct2psK69W0s4Tb9XS9O6ZFgxWB3ysPPIefcOwV2kc7VlmABJ0A4mqyz8jMeV/Sgub8TUtawmxen7fNJq1JEtPy8jHxEu583JRxrSMPKz5MhuxeQFFw9ARNK9jzJVSqJAlA4LQHbVB20UttAdtAttAttQLbQHbQLbQLbRR20C20B20C20B21AttAdtAttAdtAttFHbRB20UttAdtAttAttAdtELbQHbUC20C20C20Acqi7mNgOdZ22kma1JmuK+o3xcrPMfpWaJQLptUE637eBr43b2bbbZ8PbprJMObyMibFbZFLtYteQjmp107q1JN/MTOFoT408AlVHaS/AG9ral728puNBXHaevDXnkmzMNg2R+4Utdo18ouQNfLY+81j038cLMeVKdlzGX5dP2pHALPzYDdtL2sLc666/s83lm8pB9N5hlURMhhfWQ6+Q+77q30d38nH4Z2mG/h4EGFEEj1NhvdviYjmf4V7JMOVuT5po4l3ObD761lGcWyM59qDbCDxqZXDRxcKKBL2AtqWNWapazeqfUUMF4cTzyc35DwqkjAfJlncvIxZjzNFPU1B6kiV7XmSqlEPC1Q4LRR20C20B21QttAttAdtQLbQLbQLbUB20UdtAttAdtAttAttAdtAttAdtQHbQLbVUdtQLZRB20B20C20UttEHZQLZQHbRS21ELbVC21BjfUz5sUCNj3EZO1yNtrntD8fZXl+xrvcert1WfLleodVeMOzYyDITdGZVPmsLhdOAFr614tr41+Y9Enz8OZRhkTmSclkj1Y3F72v7tK1tPWcJOUCZTpklVnMSX+NQe46DTUV0mks5T2pkmS4ILMxTduZQdu7ne9udT0/BltdMxuo5sscin08Jk2yk/mPD4f1W51x16Zc/wBWrvY6SOJIo1jTREFgCb/aa9OusnhytyrZubFji3xSclH41rKYVIcPIzJBLk3CHgndSTK24XcnJwemwb5mCgDy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',
  'get /api/v1/room/exterior': {
    id: 'af3e166e-64f1-444d-a5fe-90ceaa1fc176',
    name: 'Exterior',
    selector: 'exterior',
    devices: [
      {
        id: 'ed62adc6-b1b6-4a2b-b6d1-8e676d470e10',
        name: 'Air Quality Index',
        selector: 'aq-sensors',
        features: [
          {
            name: 'Air Quality Index',
            selector: 'aqi-city',
            category: 'airquality-sensor',
            type: 'aqi',
            min: 0,
            max: 1000,
            read_only: true,
            unit: 'aqi',
            last_value: 101,
            last_value_changed: '2023-01-23 08:50:06.556 +00:00'
          }
        ]
      }
    ]
  },
  'get /api/v1/room/parental-room': {
    id: '1c634ff4-0476-4733-a084-b4a43d649c84',
    name: 'Parental Room',
    selector: 'parental-room',
    devices: [
      {
        id: 'f131fbf2-445a-4c2c-9426-83abaf534662',
        name: 'Room sensors',
        selector: 'room-sensors',
        features: [
          {
            name: 'Water Leak',
            selector: 'water-leak',
            category: 'leak-sensor',
            type: 'binary',
            min: 0,
            max: 1,
            read_only: true,
            last_value: 1,
            last_value_changed: '2023-01-23 08:50:06.556 +00:00'
          },
          {
            name: 'Smoke sensor',
            selector: 'smoke-sensor',
            category: 'smoke-sensor',
            type: 'binary',
            min: 0,
            max: 1,
            read_only: true,
            last_value: 1,
            last_value_changed: '2023-01-23 08:50:06.556 +00:00'
          },
          {
            name: 'Light sensor',
            selector: 'light-sensor',
            category: 'light-sensor',
            type: 'binary',
            min: 0,
            max: 1,
            read_only: true,
            last_value: 1,
            last_value_changed: '2023-01-23 08:50:06.556 +00:00'
          }
        ]
      },
      {
        id: 'cb3b1a30-d1b6-4624-ac18-e581e3e3b00f',
        name: 'Main curtain',
        selector: 'main-curtain',
        features: [
          {
            name: 'Curtain',
            selector: 'curtain-actions',
            category: 'curtain',
            type: 'state',
            min: -1,
            max: 1,
            read_only: false,
            last_value: 1,
            last_value_changed: '2019-02-12 07:49:07.556 +00:00'
          },
          {
            name: 'Curtain',
            selector: 'curtain-position',
            category: 'curtain',
            type: 'position',
            min: 0,
            max: 100,
            read_only: true,
            last_value: 30,
            last_value_changed: '2019-02-12 07:49:07.556 +00:00'
          }
        ]
      },
      {
        id: '919be7a4-df47-4726-b1c0-7412aed99769',
        name: 'Main shutter',
        selector: 'main-shutter',
        features: [
          {
            name: 'Shutter',
            selector: 'shutter-actions',
            category: 'shutter',
            type: 'state',
            min: -1,
            max: 1,
            read_only: false,
            last_value: 1,
            last_value_changed: '2019-02-12 07:49:07.556 +00:00'
          },
          {
            name: 'Shutter position',
            selector: 'shutter-position',
            category: 'shutter',
            type: 'position',
            min: 0,
            max: 100,
            read_only: true,
            last_value: 30,
            last_value_changed: '2019-02-12 07:49:07.556 +00:00',
            unit: 'percent'
          }
        ]
      },
      {
        id: 'db3e81b4-00d4-4f9b-8aa6-0e50e719a729',
        name: 'Thermostat',
        selector: 'thermostat',
        features: [
          {
            name: 'Thermostat',
            selector: 'thermostat',
            category: 'thermostat',
            type: 'target-temperature',
            min: 0,
            max: 30,
            read_only: false,
            last_value: 19.5,
            last_value_changed: '2022-10-10 07:49:07.556 +00:00',
            unit: 'celsius'
          }
        ]
      }
    ]
  },
  'get /api/v1/room/kitchen': {
    id: 'be6ba391-ebb3-472d-81af-d75d710a8430',
    name: 'Kitchen',
    selector: 'kitchen',
    devices: [
      {
        id: 'adefb484-223e-478a-8330-8fb1b3a20920',
        selector: 'sensor-kitchen',
        features: [
          {
            name: 'Temperature',
            selector: 'temperature-living-room-celsius',
            category: 'temperature-sensor',
            type: 'decimal',
            unit: 'celsius',
            min: -200,
            max: 200,
            read_only: true,
            last_value: 30,
            last_value_changed: '2019-02-12 07:49:07.556 +00:00'
          },
          {
            name: 'Humidity',
            selector: 'temperature-living-room-humidity',
            category: 'humidity-sensor',
            type: 'decimal',
            unit: 'percent',
            min: -200,
            max: 200,
            read_only: true,
            last_value: 70,
            last_value_changed: '2019-02-12 07:49:07.556 +00:00'
          },
          {
            name: 'Co2',
            selector: 'co2-kitchen',
            category: 'co2-sensor',
            type: 'decimal',
            unit: 'ppm',
            min: 0,
            max: 5000,
            read_only: true,
            last_value: 340,
            last_value_changed: '2019-02-12 07:49:07.556 +00:00'
          },
          {
            name: 'Presence',
            selector: 'main-presence-sensor',
            category: 'presence-sensor',
            type: 'push',
            unit: null,
            min: 0,
            max: 1,
            read_only: true,
            last_value: 0,
            last_value_changed: dayjs().add(60, 'second')
          },
          {
            name: 'Signal quality',
            selector: 'main-signal-sensor',
            category: 'signal',
            type: 'integer',
            unit: null,
            min: 0,
            max: 100,
            read_only: true,
            last_value: 82,
            last_value_changed: dayjs().add(60, 'second')
          },
          {
            name: 'Kitchen door',
            selector: 'temperature-living-room-celsius',
            category: 'opening-sensor',
            type: 'binary',
            unit: null,
            min: -200,
            max: 200,
            read_only: true,
            last_value: 0,
            last_value_changed: '2019-02-12 07:49:07.556 +00:00'
          }
        ]
      }
    ]
  },
  'get /api/v1/room/living-room': {
    id: '1c634ff4-0476-4733-a084-b4a43d649c84',
    name: 'Living Room',
    selector: 'living-room',
    devices: [
      {
        id: '20deebe6-57df-4940-afd1-11c189a407c2',
        name: 'TV',
        selector: 'main-tv',
        features: [
          {
            name: 'TV power',
            selector: 'main-tv-binary',
            category: 'television',
            type: 'binary',
            min: 0,
            max: 1,
            read_only: false,
            last_value: 1,
            last_value_changed: '2019-02-12 07:49:07.556 +00:00'
          },
          {
            name: 'TV Volume',
            selector: 'main-tv-volume',
            category: 'television',
            type: 'volume',
            min: 0,
            max: 20,
            read_only: false,
            last_value: 7,
            last_value_changed: '2019-02-12 07:49:07.556 +00:00'
          },
          {
            name: 'TV Channel',
            selector: 'main-tv-channel',
            category: 'television',
            type: 'channel',
            min: 0,
            max: 99,
            read_only: false,
            last_value: 22,
            last_value_changed: '2019-02-12 07:49:07.556 +00:00'
          },
          {
            name: 'Presence',
            selector: 'main-presence-sensor',
            category: 'presence-sensor',
            type: 'push',
            unit: null,
            min: 0,
            max: 1,
            read_only: true,
            last_value: 0,
            last_value_changed: dayjs().add(60, 'second')
          },
          {
            name: 'Signal quality',
            selector: 'main-signal-sensor',
            category: 'signal',
            type: 'integer',
            unit: null,
            min: 0,
            max: 5,
            read_only: true,
            last_value: 4,
            last_value_changed: dayjs().add(60, 'second')
          },
          {
            name: 'Button',
            selector: 'button-click',
            category: 'button',
            type: 'click',
            min: 0,
            max: 6,
            read_only: true,
            last_value: 1,
            last_value_changed: '2019-02-12 07:49:07.556 +00:00'
          }
        ]
      },
      {
        id: 'e9cc8a96-56b8-41b6-ba99-4c200272abf6',
        name: 'Main sensors',
        selector: 'main-sensors',
        features: [
          {
            name: 'CO',
            selector: 'co-living-room',
            category: 'co-sensor',
            type: 'binary',
            min: 0,
            max: 1,
            read_only: true,
            last_value: 1,
            last_value_changed: '2019-02-12 07:49:07.556 +00:00'
          }
        ]
      },
      {
        id: 'b32daa9a-8f77-4394-b4f3-ffea215062d2',
        name: 'Main Lamp',
        selector: 'main-lamp',
        features: [
          {
            name: 'First lamp',
            selector: 'main-lamp-binary',
            category: 'light',
            type: 'binary',
            min: 0,
            max: 1,
            read_only: false,
            last_value: 1,
            last_value_changed: '2019-02-12 07:49:07.556 +00:00'
          },
          {
            name: 'Second lamp ',
            selector: 'secondary-lamp-binary',
            category: 'light',
            type: 'binary',
            min: 0,
            max: 1,
            read_only: false,
            last_value: 1,
            last_value_changed: '2019-02-12 07:49:07.556 +00:00'
          },
          {
            name: 'TV Lamp color',
            selector: 'tv-lamp-color',
            category: 'light',
            type: 'color',
            min: 0,
            max: 16777215,
            read_only: false,
            last_value: 65000,
            last_value_changed: '2019-02-12 07:49:07.556 +00:00'
          },
          {
            name: 'TV Lamp brightness',
            selector: 'tv-lamp-brightness',
            category: 'light',
            type: 'brightness',
            min: 0,
            max: 100,
            read_only: false,
            last_value: 55,
            last_value_changed: '2019-02-12 07:49:07.556 +00:00'
          }
        ]
      },
      {
        id: 'b32daa9a-8f77-4394-b4f3-ffea215062d2',
        name: 'TV Lamp',
        selector: 'tv-lamp',
        features: [
          {
            name: 'TV Lamp feature',
            selector: 'tv-lamp-binary',
            category: 'light',
            type: 'binary',
            min: 0,
            max: 1,
            read_only: false,
            last_value: 1,
            last_value_changed: '2019-02-12 07:49:07.556 +00:00'
          }
        ]
      },
      {
        id: 'adefb484-223e-478a-8330-8fb1b3a20920',
        selector: 'temperature-living-room',
        features: [
          {
            name: 'Temperature',
            selector: 'temperature-living-room-celsius',
            category: 'temperature-sensor',
            type: 'decimal',
            unit: 'celsius',
            min: -200,
            max: 200,
            read_only: true,
            last_value: 27,
            last_value_changed: '2019-02-12 07:49:07.556 +00:00'
          }
        ]
      },
      {
        id: '81d637d2-b7f5-4cc3-a39e-2270fd069ee2',
        selector: 'mqtt-living-room',
        name: 'MQTT device',
        service: {
          name: 'mqtt'
        },
        features: [
          {
            name: 'Temperature',
            selector: 'mqtt-living-room-temp',
            category: 'temperature-sensor',
            type: 'decimal',
            unit: 'celsius',
            min: -200,
            max: 200,
            read_only: true,
            last_value: 27,
            last_value_changed: '2019-02-12 07:49:07.556 +00:00'
          }
        ]
      },
      {
        id: 'db3e81b6-00d4-4f9b-8aa6-0e50e719a729',
        name: 'AC Conditioning',
        selector: 'air-conditioning',
        features: [
          {
            name: 'AC Conditioning',
            selector: 'air-conditioning',
            category: 'air-conditioning',
            type: 'binary',
            min: 0,
            max: 1,
            read_only: false,
            last_value: 1,
            last_value_changed: '2022-10-10 07:49:07.556 +00:00'
          },
          {
            name: 'AC Conditioning',
            selector: 'air-conditioning',
            category: 'air-conditioning',
            type: 'mode',
            min: 0,
            max: 2,
            read_only: false,
            last_value: 1,
            last_value_changed: '2022-10-10 07:49:07.556 +00:00'
          },
          {
            name: 'AC Conditioning',
            selector: 'air-conditioning',
            category: 'air-conditioning',
            type: 'target-temperature',
            min: 0,
            max: 30,
            read_only: false,
            last_value: 24,
            last_value_changed: '2022-10-10 07:49:07.556 +00:00',
            unit: 'celsius'
          }
        ]
      }
    ]
  },
  'post /api/v1/variable/DEVICE_STATE_HISTORY_IN_DAYS': {
    id: '18da1930-abe9-4c99-ab9c-7ddd61aef692',
    name: 'DEVICE_STATE_HISTORY_IN_DAYS',
    value: 90,
    created_at: '2019-02-20T04:26:47.811Z',
    updated_at: '2019-02-20T04:26:47.811Z'
  },
  'post /api/v1/house': {
    id: '6a29f33b-e5c9-4b08-9d3f-ced2cab80a87',
    name: 'My House',
    selector: 'my-house',
    created_at: '2019-02-20T04:26:47.811Z',
    updated_at: '2019-02-20T04:26:47.811Z'
  },
  'post /api/v1/house/my-house/room': {
    id: '1bdc3614-6082-43c3-9e4a-3b00781013a4',
    name: 'My room',
    house_id: '6a29f33b-e5c9-4b08-9d3f-ced2cab80a87',
    created_at: '2019-02-20T04:26:47.811Z',
    updated_at: '2019-02-20T04:26:47.811Z'
  },
  'get /api/v1/room?expand=devices': [
    {
      id: '1c634ff4-0476-4733-a084-b4a43d649c84',
      name: 'Living Room',
      selector: 'living-room',
      devices: [
        {
          id: 'b32daa9a-8f77-4394-b4f3-ffea215062d2',
          name: 'Multi-sensor',
          selector: 'sensors',
          features: [
            {
              name: 'Temperature',
              selector: 'temperature-sensor',
              category: 'temperature-sensor',
              type: 'decimal',
              min: -20,
              max: 255,
              read_only: true,
              last_value: 25,
              unit: 'celsius',
              last_value_changed: '2019-02-12 07:49:07.556 +00:00'
            },
            {
              name: 'Humidity',
              selector: 'humidity-sensor',
              category: 'humidity-sensor',
              type: 'decimal',
              min: 0,
              max: 100,
              read_only: true,
              last_value: 56,
              unit: 'percent',
              last_value_changed: '2019-02-12 07:49:07.556 +00:00'
            },
            {
              name: 'Co2',
              selector: 'co2-sensor',
              category: 'co2-sensor',
              type: 'decimal',
              min: 0,
              max: 5000,
              read_only: true,
              last_value: 410,
              unit: 'ppm',
              last_value_changed: '2019-02-12 07:49:07.556 +00:00'
            },
            {
              name: 'Door',
              selector: 'door-opening-sensor',
              category: 'door-opening-sensor',
              type: 'binary',
              min: 0,
              max: 1,
              read_only: true,
              last_value: 0,
              unit: 'percent',
              last_value_changed: '2019-02-12 07:49:07.556 +00:00'
            },
            {
              name: 'Button',
              selector: 'button-click',
              category: 'button',
              type: 'click',
              min: 0,
              max: 6,
              read_only: true,
              last_value: 1,
              last_value_changed: '2019-02-12 07:49:07.556 +00:00'
            }
          ]
        }
      ]
    },
    {
      id: 'ab42585c-415d-4696-8f4c-ff0283dcb954',
      name: 'Kitchen',
      selector: 'kitchen',
      devices: [
        {
          id: 'b32daa9a-8f77-4394-b4f3-ffea215062d2',
          name: 'Kitchen Light',
          selector: 'sensors',
          features: [
            {
              name: 'Light',
              selector: 'main-lamp-binary',
              category: 'light',
              type: 'binary',
              min: 0,
              max: 100,
              read_only: true,
              last_value: 60,
              unit: ' lux',
              last_value_changed: '2019-02-12 07:49:07.556 +00:00'
            }
          ]
        },
        {
          id: 'f10ae5bc-1da6-484e-b0d0-953ee94e5ccc',
          name: 'Button click',
          selector: 'button-click',
          features: [
            {
              name: 'Remote',
              selector: 'kitchen-button-click',
              category: 'button',
              type: 'click',
              min: 0,
              max: 6,
              read_only: true,
              last_value_changed: '2019-02-12 07:49:07.556 +00:00'
            }
          ]
        },
        {
          id: '284d8f68-220c-45fd-a73a-eccb547aff24',
          name: 'Sensor',
          selector: 'humidity-sensor',
          features: [
            {
              name: 'Humidity',
              selector: 'kitchen-humidity-sensor',
              category: 'humidity-sensor',
              type: 'decimal',
              min: 0,
              max: 100,
              read_only: true,
              last_value: 74,
              unit: 'percent',
              last_value_changed: '2019-02-12 07:49:07.556 +00:00'
            }
          ]
        },
        {
          id: '284d8f68-220c-45fd-a73a-eccb547aff24',
          name: 'Window sensor',
          selector: 'opening-sensor',
          features: [
            {
              name: 'Window',
              selector: 'kitchen-opening-sensor',
              category: 'opening-sensor',
              type: 'binary',
              min: 0,
              max: 1,
              read_only: true,
              last_value: 1,
              last_value_changed: '2019-02-12 07:49:07.556 +00:00'
            }
          ]
        }
      ]
    },
    {
      id: 'af3e166e-64f1-444d-a5fe-90ceaa1fc176',
      name: 'Exterior',
      selector: 'exterior',
      devices: [
        {
          id: 'ed62adc6-b1b6-4a2b-b6d1-8e676d470e10',
          name: 'Air Quality Index',
          selector: 'aq-sensors',
          features: [
            {
              name: 'Air Quality Index',
              selector: 'aqi-city',
              category: 'airquality-sensor',
              type: 'aqi',
              min: 0,
              max: 1000,
              read_only: true,
              unit: 'aqi',
              last_value: 101,
              last_value_changed: '2023-01-23 08:50:06.556 +00:00'
            }
          ]
        }
      ]
    }
  ],
  'post /api/v1/light/main-lamp/on': {
    type: 'light.turn-on',
    device: 'main-lamp',
    status: 'pending'
  },
  'get /api/v1/service/philips-hue/bridge': [
    {
      name: 'Philips hue',
      ipaddress: '192.168.2.245'
    }
  ],
  'get /api/v1/message': [
    {
      id: '247b1dd0-6fab-47a8-a9c8-1405deae0ae8',
      sender_id: null,
      receiver_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      text: "It's a clear day today. Temperature outside is 26°C.",
      is_read: true,
      created_at: dayjs()
        .subtract(1, 'hour')
        .toISOString()
    },
    {
      id: '247b1dd0-6fab-47a8-a9c8-1405deae0ae8',
      sender_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      receiver_id: null,
      text: "What's the weather like?",
      is_read: true,
      created_at: dayjs()
        .subtract(1, 'hour')
        .subtract(1, 'seconds')
        .toISOString()
    },
    {
      id: '247b1dd0-6fab-47a8-a9c8-1405deae0ae8',
      sender_id: null,
      receiver_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      text: "It's 24°C in the kitchen.",
      is_read: true,
      created_at: dayjs()
        .subtract(1, 'hour')
        .subtract(2, 'seconds')
        .toISOString()
    },
    {
      id: '247b1dd0-6fab-47a8-a9c8-1405deae0ae8',
      sender_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      receiver_id: null,
      text: "What's the temperature in the kitchen?",
      is_read: true,
      created_at: dayjs()
        .subtract(1, 'hour')
        .subtract(3, 'seconds')
        .toISOString()
    }
  ],
  'post /api/v1/message': {
    id: '247b1dd0-6fab-47a8-a9c8-1405deae0ae8',
    sender_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    receiver_id: null,
    text: 'What time is it ?',
    is_read: true,
    created_at: '2019-02-12T07:49:07.556Z'
  },
  'get /api/v1/scene': [
    {
      id: '5f515235-2a00-45f7-993f-cb24b463feec',
      selector: 'wake-up',
      icon: 'fe fe-bell',
      active: true,
      name: 'Wake Up',
      description: "Tony's wake up scene"
    }
  ],
  'get /api/v1/user': [
    {
      id: 'd84ced32-d937-4cf6-a32e-105ffb584226',
      firstname: 'Tony',
      lastname: 'Stark',
      selector: 'tony',
      role: 'admin'
    },
    {
      id: '2a16e6bb-34a8-46b9-90d3-275e4d059b41',
      firstname: 'Pepper',
      lastname: 'Pots',
      selector: 'pepper',
      role: 'user'
    }
  ],
  'get /api/v1/user/tony': {
    id: 'd84ced32-d937-4cf6-a32e-105ffb584226',
    firstname: 'Tony',
    lastname: 'Stark',
    selector: 'tony',
    email: 'tony.stark@gladysassistant.com',
    birthdate: '2011-02-04',
    language: 'en',
    role: 'admin'
  },
  'get /api/v1/user/pepper': {
    id: 'd84ced32-d937-4cf6-a32e-105ffb584226',
    firstname: 'Pepper',
    lastname: 'Pots',
    selector: 'pepper',
    email: 'pepper.pots@gladysassistant.com',
    birthdate: '2011-02-04',
    language: 'en',
    role: 'admin'
  },
  'get /api/v1/scene/wake-up': {
    id: '5f515235-2a00-45f7-993f-cb24b463feec',
    selector: 'wake-up',
    icon: 'fe fe-bell',
    active: true,
    name: 'Wake Up',
    triggers: [
      {
        type: 'device.new-state',
        device_feature: 'main-lamp-binary',
        operator: '=',
        value: 1
      },
      {
        type: 'device.new-state',
        device_feature: 'button-click',
        operator: '=',
        value: 2
      }
    ],
    actions: [
      [
        {
          type: 'delay',
          value: 2,
          unit: 'seconds'
        }
      ],
      [
        {
          type: 'light.turn-on',
          devices: ['light']
        }
      ]
    ]
  },
  'get /api/v1/service/zwave/status': {
    connected: true,
    scanInProgress: false,
    ready: true
  },
  'get /api/v1/service/zwave/node': [
    {
      name: 'ZME_UZB1 USB Stick',
      features: [],
      params: [],
      ready: true,
      rawZwaveNode: {
        id: 1,
        manufacturer: 'Z-Wave.Me',
        manufacturerid: '0x0115',
        product: 'ZME_UZB1 USB Stick',
        producttype: '0x0400',
        productid: '0x0001',
        type: 'Static PC Controller',
        classes: []
      }
    }
  ],
  'get /api/v1/service/zwave/neighbor': [
    {
      id: '1',
      manufacturer: 'Z-Wave.Me',
      product: 'ZME_UZB1 USB Stick',
      neighbors: [2, 3, 4, 5, 6, 7, 8, 10]
    },
    {
      id: '2',
      manufacturer: '',
      product: '',
      neighbors: []
    },
    {
      id: '3',
      manufacturer: '',
      product: '',
      neighbors: []
    },
    {
      id: '4',
      manufacturer: '',
      product: '',
      neighbors: []
    },
    {
      id: '5',
      manufacturer: '',
      product: '',
      neighbors: []
    },
    {
      id: '6',
      manufacturer: '',
      product: '',
      neighbors: []
    },
    {
      id: '7',
      manufacturer: '',
      product: '',
      neighbors: []
    },
    {
      id: '8',
      manufacturer: '',
      product: '',
      neighbors: []
    },
    {
      id: '10',
      manufacturer: 'FIBARO System',
      product: 'FGMS001-ZW5 Motion Sensor',
      neighbors: [1]
    }
  ],
  'get /api/v1/service/usb/port': [
    {
      comPath: '/dev/ttyUSB0',
      comVID: '0658',
      comName: '0200'
    },
    {
      comPath: '/dev/ttyUSB1',
      comVID: '0478',
      comName: '0910'
    }
  ],
  'get /api/v1/area': [
    {
      id: '20b4f1f0-989b-4a94-b0d4-c042137da6b5',
      name: 'My house',
      radius: 1000,
      color: '#3498db',
      latitude: 41.89154462447053,
      longitude: 12.49828345229836
    },
    {
      id: 'f7312c0d-2eac-4e89-9c78-0428e06a39f4',
      name: 'My work',
      radius: 2000,
      color: '#f1c40f',
      latitude: 41.93425385676557,
      longitude: 12.402756238310928
    }
  ],
  'get /api/v1/house': [
    {
      id: '23c40ffe-e1b5-4130-b8df-c56ff92ceee5',
      name: 'My House',
      selector: 'my-house',
      latitude: 41.89154462447053,
      longitude: 12.49828345229836,
      rooms: [
        {
          id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
          name: 'Living Room',
          selector: 'living-room'
        },
        {
          id: 'f99ab22a-e6a8-4756-b1fe-4d19dc8c8620',
          name: 'Kitchen',
          selector: 'kitchen'
        },
        {
          id: '01ad196a-020d-4828-a7b6-41bde8496823',
          name: 'Garden',
          selector: 'garden'
        }
      ]
    }
  ],
  'get /api/v1/service/zwave/device': [
    {
      id: 'fbedb47f-4d25-4381-8923-2633b23192a0',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      name: 'Fibaro Motion Sensor',
      selector: 'zwave:1234',
      external_id: 'test-sensor-external',
      should_poll: false,
      poll_frequency: null,
      created_at: '2019-02-12T07:49:07.556Z',
      updated_at: '2019-02-12T07:49:07.556Z',
      features: [
        {
          name: 'Temperature',
          selector: 'test-temperature',
          category: 'temperature-sensor',
          type: 'decimal'
        },
        {
          name: 'Motion',
          selector: 'test-motion',
          category: 'motion-sensor',
          type: 'binary'
        },
        {
          name: 'Battery',
          selector: 'test-battery',
          category: 'battery',
          type: 'integer',
          last_value: '92'
        },
        {
          name: 'Lux',
          selector: 'test-light',
          category: 'light-sensor',
          type: 'integer'
        }
      ],
      room: {
        id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
        name: 'Living Room',
        selector: 'living-room'
      }
    }
  ],
  'get /api/v1/service/broadlink': {
    id: 'a810b8db-6d04-4697-bed3-c4b72c996279'
  },
  'get /api/v1/service/broadlink/peripheral': [
    {
      address: '210.248.100.245',
      mac: '4bf75cf0fdbb',
      name: 'MP1',
      device: {
        name: 'MP1',
        external_id: 'broadlink:1cee8bf16731',
        selector: 'broadlink:1cee8bf16731',
        model: 'MP1',
        service_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
        created_at: '2019-02-12T07:49:07.556Z',
        should_poll: true,
        poll_frequency: 60000,
        features: [
          {
            name: 'MP1 1',
            category: 'switch',
            type: 'binary',
            external_id: 'broadlink:0',
            selector: 'broadlink:0',
            min: 0,
            max: 1,
            read_only: false,
            has_feedback: true
          },
          {
            name: 'MP1 2',
            category: 'switch',
            type: 'binary',
            external_id: 'broadlink:1',
            selector: 'broadlink:1',
            min: 0,
            max: 1,
            read_only: false,
            has_feedback: true
          },
          {
            name: 'MP1 3',
            category: 'switch',
            type: 'binary',
            external_id: 'broadlink:2',
            selector: 'broadlink:2',
            min: 0,
            max: 1,
            read_only: false,
            has_feedback: true
          },
          {
            name: 'MP1 4',
            category: 'switch',
            type: 'binary',
            external_id: 'broadlink:3',
            selector: 'broadlink:3',
            min: 0,
            max: 1,
            read_only: false,
            has_feedback: true
          }
        ]
      }
    },
    {
      address: '227.154.146.114',
      name: 'SP2',
      mac: '7396e6541fb0',
      canLearn: false,
      device: {
        external_id: 'broadlink:7396e6541fb0',
        selector: 'broadlink:7396e6541fb0',
        model: 'SP2',
        name: 'SP2',
        service_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
        should_poll: true,
        poll_frequency: 60000,
        features: [
          {
            name: 'SP2',
            category: 'switch',
            type: 'binary',
            external_id: 'broadlink:0',
            selector: 'broadlink:0',
            min: 0,
            max: 1,
            read_only: false,
            has_feedback: true
          }
        ]
      }
    },
    {
      address: '220.156.58.18',
      name: 'RM3 Pro Plus',
      mac: '1cee8bf16731',
      canLearn: true
    }
  ],
  'get /api/v1/service/broadlink/device': [
    {
      id: 'fbedb47f-4d25-4381-8923-2633b23192a0',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      name: 'TV Remote',
      selector: 'broadlink-fbedb47f-4d25-4381-8923-2633b23192a0',
      external_id: 'broadlink:fbedb47f-4d25-4381-8923-2633b23192a0',
      should_poll: false,
      poll_frequency: null,
      model: 'television',
      created_at: '2019-02-12T07:49:07.556Z',
      updated_at: '2019-02-12T07:49:07.556Z',
      room: {
        id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
        name: 'Living Room',
        selector: 'living-room'
      }
    },
    {
      id: '197018ef-5110-4e3d-9022-cecb85fce5cb',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      name: 'LED remote',
      selector: 'broadlink-197018ef-5110-4e3d-9022-cecb85fce5cb',
      external_id: 'broadlink:197018ef-5110-4e3d-9022-cecb85fce5cb',
      should_poll: false,
      poll_frequency: null,
      model: 'light',
      created_at: '2019-02-12T07:49:07.556Z',
      updated_at: '2019-02-12T07:49:07.556Z',
      room: {
        id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
        name: 'Living Room',
        selector: 'living-room'
      }
    },
    {
      id: '1e5412c3-a6b7-4c5f-aede-20c40adbd85d',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      name: 'SP2',
      selector: 'broadlink-1e5412c3-a6b7-4c5f-aede-20c40adbd85d',
      external_id: 'broadlink:1e5412c3-a6b7-4c5f-aede-20c40adbd85d',
      should_poll: false,
      poll_frequency: null,
      model: 'sp2',
      created_at: '2019-02-12T07:49:07.556Z',
      updated_at: '2019-02-12T07:49:07.556Z',
      room: {
        id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
        name: 'Living Room',
        selector: 'living-room'
      },
      features: [
        {
          name: 'sp2',
          category: 'switch',
          type: 'binary',
          external_id: 'broadlink:0',
          selector: 'broadlink-0',
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: true
        }
      ]
    }
  ],
  'get /api/v1/device/broadlink-197018ef-5110-4e3d-9022-cecb85fce5cb': {
    id: '197018ef-5110-4e3d-9022-cecb85fce5cb',
    service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
    room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
    name: 'LED remote',
    model: 'light',
    selector: 'broadlink-197018ef-5110-4e3d-9022-cecb85fce5cb',
    external_id: 'broadlink:197018ef-5110-4e3d-9022-cecb85fce5cb',
    should_poll: false,
    poll_frequency: null,
    created_at: '2019-02-12T07:49:07.556Z',
    updated_at: '2019-02-12T07:49:07.556Z',
    features: [
      {
        id: 'db05402f-8795-4942-903e-351716ee04f9',
        name: 'Power ON',
        external_id: 'broadlink:197018ef-5110-4e3d-9022-cecb85fce5cb:binary',
        selector: 'broadlink-197018ef-5110-4e3d-9022-cecb85fce5cb-binary',
        category: 'light',
        type: 'binary'
      }
    ],
    params: [
      {
        name: 'peripheral',
        value: '1cee8bf16731'
      },
      {
        name: 'code_binary-0',
        value: 'POWER_OFF'
      },
      {
        name: 'code_binary-1',
        value: 'POWER_ON'
      }
    ]
  },
  'get /api/v1/device/broadlink-fbedb47f-4d25-4381-8923-2633b23192a0': {
    id: 'fbedb47f-4d25-4381-8923-2633b23192a0',
    service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
    room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
    name: 'TV Remote',
    model: 'television',
    selector: 'broadlink-fbedb47f-4d25-4381-8923-2633b23192a0',
    external_id: 'broadlink:fbedb47f-4d25-4381-8923-2633b23192a0',
    should_poll: false,
    poll_frequency: null,
    created_at: '2019-02-12T07:49:07.556Z',
    updated_at: '2019-02-12T07:49:07.556Z',
    features: [
      {
        id: '22d37c48-6805-4118-ba1c-fa44052c2d3c',
        name: 'Power',
        external_id: 'broadlink:fbedb47f-4d25-4381-8923-2633b23192a0:binary',
        selector: 'broadlink-fbedb47f-4d25-4381-8923-2633b23192a0-binary',
        category: 'television',
        type: 'binary'
      },
      {
        id: '1667855b-a58d-4a8c-9ac6-c40c2a544db8',
        name: 'Source',
        external_id: 'broadlink:fbedb47f-4d25-4381-8923-2633b23192a0:source',
        selector: 'broadlink-fbedb47f-4d25-4381-8923-2633b23192a0-source',
        category: 'television',
        type: 'source'
      },
      {
        id: '8d8a9fb1-dbd0-4f31-bbc7-8ffebf1e9f93',
        name: 'Channel',
        external_id: 'broadlink:fbedb47f-4d25-4381-8923-2633b23192a0:channel',
        selector: 'broadlink-fbedb47f-4d25-4381-8923-2633b23192a0-channel',
        category: 'television',
        type: 'channel'
      }
    ],
    params: [
      {
        name: 'code_binary-1',
        value: 'POWER'
      },
      {
        name: 'code_source',
        value: 'SOURCE'
      },
      {
        name: 'code_channel-0',
        value: 'CHANNEL_0'
      },
      {
        name: 'code_channel-1',
        value: 'CHANNEL_1'
      },
      {
        name: 'code_channel-2',
        value: 'CHANNEL_2'
      },
      {
        name: 'code_channel-3',
        value: 'CHANNEL_3'
      },
      {
        name: 'code_channel-4',
        value: 'CHANNEL_4'
      },
      {
        name: 'code_channel-5',
        value: 'CHANNEL_5'
      },
      {
        name: 'code_channel-6',
        value: 'CHANNEL_6'
      }
    ],
    room: {
      id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      name: 'Living Room',
      selector: 'living-room'
    }
  },
  'post /api/v1/service/broadlink/learn': {},
  'post /api/v1/service/broadlink/learn/cancel': {},
  'get /api/v1/service/mqtt': {},
  'get /api/v1/service/mqtt/status': {
    configured: true,
    connected: true
  },
  'get /api/v1/service/mqtt/config': {
    useEmbeddedBroker: true,
    dockerBased: true,
    networkModeValid: true,
    brokerContainerAvailable: false
  },
  'get /api/v1/service/zigbee2mqtt': {},
  'get /api/v1/service/zigbee2mqtt/permit_join': true,
  'get /api/v1/service/zigbee2mqtt/device': [
    {
      name: 'Aqara Sensor',
      external_id: 'zigbee2mqtt:0x00158d0005828ece',
      selector: 'zigbee2mqtt-0x00158d0005828ece',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      model: 'WSDCGQ11LM',
      params: [
        {
          name: 'model',
          value: 'WSDCGQ11LM'
        }
      ],
      features: [
        {
          category: 'pressure-sensor',
          external_id: 'zigbee2mqtt:0x00158d0005828ece:pressure-sensor:decimal:pressure',
          name: 'Pressure Sensor',
          read_only: true,
          selector: 'zigbee2mqtt:0x00158d0005828ece:pressure-sensor:decimal:pressure',
          type: 'decimal'
        }
      ]
    }
  ],
  'get /api/v1/service/zigbee2mqtt/discovered': [
    {
      name: 'Aqara Sensor',
      external_id: 'zigbee2mqtt:0x00158d0005828ece',
      selector: 'zigbee2mqtt-0x00158d0005828ece',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      model: 'WSDCGQ11LM',
      updatable: true,
      created_at: '2019-02-12T07:49:07.556Z',
      params: [
        {
          name: 'model',
          value: 'WSDCGQ11LM'
        }
      ],
      features: [
        {
          category: 'pressure-sensor',
          external_id: 'zigbee2mqtt:0x00158d0005828ece:pressure-sensor:decimal:pressure',
          name: 'Pressure Sensor',
          read_only: true,
          selector: 'zigbee2mqtt:0x00158d0005828ece:pressure-sensor:decimal:pressure',
          type: 'decimal'
        }
      ]
    },
    {
      model: 'WXKG01LM',
      name: '0x00158d00033e88d5',
      service_id: 'f87b7af2-ca8e-44fc-b754-444354b42fee',
      should_poll: false,
      external_id: 'zigbee2mqtt:0x00158d00033e88d5',
      features: [
        {
          category: 'battery',
          external_id: 'zigbee2mqtt:0x00158d00033e88d5:battery:integer:battery',
          has_feedback: false,
          max: 100,
          min: 0,
          name: 'Battery',
          read_only: true,
          selector: 'zigbee2mqtt-0x00158d00033e88d5-battery-integer-battery',
          type: 'integer',
          unit: 'percent'
        },
        {
          category: 'button',
          external_id: 'zigbee2mqtt:0x00158d00033e88d5:button:click:action',
          has_feedback: false,
          max: 7,
          min: 0,
          name: 'Action',
          read_only: true,
          selector: 'zigbee2mqtt-0x00158d00033e88d5-button-click-action',
          type: 'click',
          unit: null
        },
        {
          category: 'switch',
          external_id: 'zigbee2mqtt:0x00158d00033e88d5:switch:voltage:voltage',
          has_feedback: false,
          max: 10000,
          min: 0,
          name: 'Voltage',
          read_only: true,
          selector: 'zigbee2mqtt-0x00158d00033e88d5-switch-voltage-voltage',
          type: 'voltage',
          unit: 'millivolt'
        }
      ]
    },
    {
      name: 'Unsupported device',
      external_id: 'zigbee2mqtt:0x00158d0005828ece',
      selector: 'zigbee2mqtt-0x00158d0005828ece',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      features: [
        {
          category: 'battery',
          name: 'Pressure Sensor',
          read_only: true,
          type: 'decimal'
        }
      ]
    }
  ],
  'get /api/v1/service/zigbee2mqtt/setup': {
    ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0',
    ZIGBEE_DONGLE_NAME: 'Electrolama zig-a-zig-ah! (zzh!)',
    Z2M_TCP_PORT: '59801'
  },
  'post /api/v1/service/zigbee2mqtt/setup': {
    ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB1',
    ZIGBEE_DONGLE_NAME: 'RaspBee',
    Z2M_TCP_PORT: '12000'
  },
  'get /api/v1/service/zigbee2mqtt/adapter': [
    'ConBee',
    'ConBee II',
    'RaspBee',
    'RaspBee II',
    'SONOFF Zigbee 3.0 USB Dongle Plus ZBDongle-P',
    "Slaesh's CC2652RB stick",
    'SMLIGHT CC2652P Zigbee USB Adapter SLZB-02',
    'SMLIGHT SLZB-06 Zigbee ethernet USB POE WiFi LAN adapter',
    'SMLIGHT Zigbee LAN Adapter CC2652P Model SLZB-05',
    'Vision CC2538+CC2592 Dongle(VS203)',
    'Vision CC2652 dongle',
    'XGG Gateway',
    'XGG 52PZ2MGateway',
    'ZigStar LAN Coordinator',
    'ZigStar PoE Coordinator',
    'ZigStar Stick v4',
    'ZigStar ZigiHAT PoE'
  ],
  'get /api/v1/service/zigbee2mqtt/status': {
    usbConfigured: true,
    mqttExist: true,
    mqttRunning: true,
    zigbee2mqttExist: true,
    zigbee2mqttRunning: true,
    gladysConnected: true,
    zigbee2mqttConnected: true,
    z2mEnabled: true,
    dockerBased: true,
    networkModeValid: true
  },
  'get /api/v1/service/tasmota': {},
  'get /api/v1/service/tasmota/device': [
    {
      name: 'Switch',
      external_id: 'tasmota:sonoff-basic',
      selector: 'tasmota-sonoff-basic',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      model: 'sonoff-basic',
      features: [
        {
          category: 'switch',
          type: 'binary'
        }
      ]
    },
    {
      name: 'Switch',
      external_id: 'tasmota:192.168.1.1',
      selector: 'tasmota-192-168-1-1',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443e',
      features: [
        {
          category: 'switch',
          type: 'binary'
        }
      ],
      params: [
        {
          name: 'protocol',
          value: 'http'
        }
      ]
    }
  ],
  'get /api/v1/device/tasmota-sonoff-basic': {
    name: 'Switch',
    external_id: 'tasmota:sonoff-basic',
    selector: 'sonoff-basic',
    room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
    model: 'sonoff-basic',
    features: [
      {
        category: 'switch',
        type: 'binary',
        name: 'Switch'
      }
    ]
  },
  'get /api/v1/device/zigbee2mqtt-0x00158d0005828ece': {
    name: 'Aqara Sensor',
    external_id: 'zigbee2mqtt-0x00158d0005828ece',
    selector: 'zigbee2mqtt-0x00158d0005828ece',
    room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
    model: 'zigbee2mqtt-0x00158d0005828ece',
    features: [
      {
        category: 'switch',
        type: 'binary',
        name: 'Switch'
      }
    ]
  },
  'get /api/v1/device/tasmota-192-168-1-1': {
    name: 'Switch',
    external_id: 'tasmota:sonoff-basic',
    selector: 'sonoff-basic',
    room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
    model: 'sonoff-basic',
    features: [
      {
        category: 'switch',
        type: 'binary',
        name: 'Switch'
      }
    ]
  },
  'get /api/v1/service/tasmota/discover/mqtt': [
    {
      name: 'Sonoff Basic Kitchen',
      external_id: 'tasmota:sonoff-basic',
      created_at: '2019-02-12T07:49:07.556Z',
      model: 'sonoff-basic',
      features: [
        {
          category: 'switch',
          type: 'binary'
        }
      ]
    },
    {
      name: 'Sonoff Pow Kitchen',
      external_id: 'tasmota:sonoff-pow',
      model: 'sonoff-pow',
      features: [
        {
          category: 'switch',
          type: 'binary'
        }
      ]
    },
    {
      name: 'Sonoff Mini Outside',
      external_id: 'tasmota:sonoff-mini',
      model: 'sonoff-basic',
      created_at: '2019-02-12T07:49:07.556Z',
      updatable: true,
      features: [
        {
          category: 'switch',
          type: 'binary'
        }
      ]
    }
  ],
  'get /api/v1/service/tasmota/discover/http': [
    {
      name: 'Sonoff Basic Kitchen',
      external_id: 'tasmota:192.168.1.1',
      created_at: '2019-02-12T07:49:07.556Z',
      model: 'sonoff-basic',
      features: [
        {
          category: 'switch',
          type: 'binary'
        }
      ],
      params: [
        {
          name: 'protocol',
          value: 'http'
        }
      ]
    },
    {
      name: 'Sonoff Pow Kitchen',
      external_id: 'tasmota:192.168.1.2',
      model: 'sonoff-pow',
      features: [
        {
          category: 'switch',
          type: 'binary'
        }
      ],
      params: [
        {
          name: 'protocol',
          value: 'http'
        }
      ]
    },
    {
      name: 'Sonoff Mini Outside',
      external_id: 'tasmota:192.168.1.3',
      model: 'sonoff-basic',
      created_at: '2019-02-12T07:49:07.556Z',
      updatable: true,
      features: [
        {
          category: 'switch',
          type: 'binary'
        }
      ],
      params: [
        {
          name: 'protocol',
          value: 'http'
        }
      ]
    },
    {
      name: '192.168.1.3',
      external_id: 'tasmota:192.168.1.3',
      created_at: '2019-02-12T07:49:07.556Z',
      needAuthentication: true,
      features: [
        {
          category: 'switch',
          type: 'binary'
        }
      ],
      params: [
        {
          name: 'protocol',
          value: 'http'
        }
      ]
    }
  ],
  'get /api/v1/service/rtsp-camera/device': [
    {
      id: 'c2204fdc-c22f-4fc9-b7d7-c862f3c514c7',
      name: 'Kitchen Camera',
      params: [
        {
          name: 'CAMERA_URL',
          value: 'http://camera-url'
        },
        {
          name: 'CAMERA_ROTATION',
          value: '0'
        }
      ]
    }
  ],
  'get /api/v1/service/rtsp-camera': {
    id: 'aa7d6284-6b80-4e78-9e08-a4122207edcd'
  },
  'post /api/v1/service/rtsp-camera/camera/test':
    'data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAA1AAD/4QMJaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzEzOCA3OS4xNTk4MjQsIDIwMTYvMDkvMTQtMDE6MDk6MDEgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjRFMTgwODcwNzU0MjExRTk5Nzc5RkZBMTY3OTgyRDBEIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjRFMTgwODZGNzU0MjExRTk5Nzc5RkZBMTY3OTgyRDBEIiB4bXA6Q3JlYXRvclRvb2w9IlZlci4xLjAuMDAwIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9IkYzN0JCRDNCMzkwRTdEQ0NEMkQ5ODI4MDFGNTkwMTZBIiBzdFJlZjpkb2N1bWVudElEPSJGMzdCQkQzQjM5MEU3RENDRDJEOTgyODAxRjU5MDE2QSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pv/tAEhQaG90b3Nob3AgMy4wADhCSU0EBAAAAAAADxwBWgADGyVHHAIAAAIAAgA4QklNBCUAAAAAABD84R+JyLfJeC80YjQHWHfr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mUgIL2HDcptx537RXyPsbduJzXs011UM7MizJx6zmRtwWN4zqF5buI48a4bdu/nP+WppFFHhxAViViAfPc7XbcOFtNOym2l7JnwS+qGaZnjSI3VV1UjVAdTt8vPgKa6zz8nlVy+s5674k8qtY70J2gXsWsON++t9f19PKXaoMSdJXsyqrEbEY6gNb4mGpPZXXfXEZlNfp+fPneiVLynU3IO0ct2psK69W0s4Tb9XS9O6ZFgxWB3ysPPIefcOwV2kc7VlmABJ0A4mqyz8jMeV/Sgub8TUtawmxen7fNJq1JEtPy8jHxEu583JRxrSMPKz5MhuxeQFFw9ARNK9jzJVSqJAlA4LQHbVB20UttAdtAttAttQLbQHbQLbQLbRR20C20B20C20B21AttAdtAttAdtAttFHbRB20UttAdtAttAttAdtELbQHbUC20C20C20Acqi7mNgOdZ22kma1JmuK+o3xcrPMfpWaJQLptUE637eBr43b2bbbZ8PbprJMObyMibFbZFLtYteQjmp107q1JN/MTOFoT408AlVHaS/AG9ral728puNBXHaevDXnkmzMNg2R+4Utdo18ouQNfLY+81j038cLMeVKdlzGX5dP2pHALPzYDdtL2sLc666/s83lm8pB9N5hlURMhhfWQ6+Q+77q30d38nH4Z2mG/h4EGFEEj1NhvdviYjmf4V7JMOVuT5po4l3ObD761lGcWyM59qDbCDxqZXDRxcKKBL2AtqWNWapazeqfUUMF4cTzyc35DwqkjAfJlncvIxZjzNFPU1B6kiV7XmSqlEPC1Q4LRR20C20B21QttAttAdtQLbQLbQLbUB20UdtAttAdtAttAttAdtAttAdtQHbQLbVUdtQLZRB20B20C20UttEHZQLZQHbRS21ELbVC21BjfUz5sUCNj3EZO1yNtrntD8fZXl+xrvcert1WfLleodVeMOzYyDITdGZVPmsLhdOAFr614tr41+Y9Enz8OZRhkTmSclkj1Y3F72v7tK1tPWcJOUCZTpklVnMSX+NQe46DTUV0mks5T2pkmS4ILMxTduZQdu7ne9udT0/BltdMxuo5sscin08Jk2yk/mPD4f1W51x16Zc/wBWrvY6SOJIo1jTREFgCb/aa9OusnhytyrZubFji3xSclH41rKYVIcPIzJBLk3CHgndSTK24XcnJwemwb5mCgDy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',
  'get /api/v1/gateway/status': {
    configured: true,
    connected: true
  },
  'get /api/v1/gateway/backup': [
    {
      id: '99fac564-0844-44f6-866b-2b8dcf0d76eb',
      path: 'https://url-backup',
      size: 2024000100,
      created_at: dayjs().subtract(1, 'day'),
      updated_at: dayjs().subtract(1, 'day'),
      is_deleted: false
    },
    {
      id: '99fac564-0844-44f6-866b-2b8dcf0d76eb',
      path: 'https://url-backup',
      size: 1127680,
      created_at: dayjs().subtract(2, 'day'),
      updated_at: dayjs().subtract(2, 'day'),
      is_deleted: false
    },
    {
      id: '210460b2-c9a8-4891-9cca-464c3e19bfbb',
      path: 'https://url-backup',
      size: 1013680,
      created_at: dayjs().subtract(3, 'day'),
      updated_at: dayjs().subtract(3, 'day'),
      is_deleted: false
    }
  ],
  'get /api/v1/variable/GLADYS_GATEWAY_BACKUP_KEY': {
    value: 'ad793dc660683701703409f97fd1d2f9j86610467839e12a0107c0409ec7240bb'
  },
  'get /api/v1/gateway/instance/key': {
    rsa_fingerprint: '33:ab:6d:4c:2d:5e:43:26:2c:48:25:63:54:c9:2f:e1:76:97:60:ea:9b:fa:63:f4:03:78:99:09:27:1b:d8:14',
    ecdsa_fingerprint: '42:b0:74:47:b5:60:14:a0:37:94:db:83:2d:de:a4:51:58:ad:6f:c9:6e:6f:0b:54:82:d1:f3:bf:cf:99:6c:3f'
  },
  'get /api/v1/gateway/key': [
    {
      id: 'b2594fc0-9812-477c-ba8f-6059a91d6932',
      name: 'Pepper Pots',
      rsa_public_key: 'fa:f9:5b:80:69:8d:c3:d7:4b:cc:33:7b:5d:ba:98:9b:17:22:76:f8:f3:79:db:6b:b8:53:37:ec:2a:cf:18:fd',
      ecdsa_public_key:
        'cf:df:75:79:a0:93:74:f4:e2:d7:b8:74:ab:67:7b:80:6e:57:1d:ef:bc:38:5d:70:8b:cf:dd:ba:88:c8:d6:f4',
      gladys_4_user_id: null,
      connected: true,
      accepted: true
    },
    {
      id: 'adf4f481-1b19-4796-bab3-fbabfc4775d5',
      name: 'Tony Stark',
      rsa_public_key: '51:89:e6:91:4f:da:f8:d6:b6:f6:1e:15:54:c4:c0:fd:cc:69:70:81:d4:a8:ea:26:8b:02:4b:b9:ff:97:64:1a',
      ecdsa_public_key:
        '2e:e9:ee:a0:b3:22:46:62:f8:22:9b:52:9d:f4:3f:65:70:62:59:76:d1:85:ad:3b:9f:65:4e:61:4c:26:89:7e',
      gladys_4_user_id: null,
      connected: true,
      accepted: true
    }
  ],
  'get /api/v1/ping': {},
  'get /api/v1/system/info': {
    hostname: 'Raspberry Pi 4',
    type: 'Linux',
    platform: 'linux',
    arch: 'x64',
    release: '18.5.0',
    uptime: 662555,
    loadavg: [1.908203125, 3.01513671875, 3.64013671875],
    totalmem: 17179869184,
    freemem: 492482560,
    cpus: [
      {
        model: 'Intel(R) Core(TM) i7-6567U CPU @ 3.30GHz',
        speed: 3300,
        times: {
          user: 34606730,
          nice: 0,
          sys: 24855850,
          idle: 100527470,
          irq: 0
        }
      },
      {
        model: 'Intel(R) Core(TM) i7-6567U CPU @ 3.30GHz',
        speed: 3300,
        times: {
          user: 22568450,
          nice: 0,
          sys: 10605290,
          idle: 126800520,
          irq: 0
        }
      },
      {
        model: 'Intel(R) Core(TM) i7-6567U CPU @ 3.30GHz',
        speed: 3300,
        times: {
          user: 34765800,
          nice: 0,
          sys: 20890230,
          idle: 104318270,
          irq: 0
        }
      },
      {
        model: 'Intel(R) Core(TM) i7-6567U CPU @ 3.30GHz',
        speed: 3300,
        times: {
          user: 18691910,
          nice: 0,
          sys: 8683980,
          idle: 132598350,
          irq: 0
        }
      }
    ],
    network_interfaces: {},
    nodejs_version: 'v10.15.2',
    gladys_version: 'v4.0.0',
    is_docker: false,
    new_release_available: false
  },
  'get /api/v1/system/disk': {
    filesystem: '/dev/disk1s1',
    size: 499313172480,
    used: 464613756928,
    available: 28587036672,
    capacity: 0.953000005,
    mountpoint: '/'
  },
  'get /api/v1/system/container': [
    {
      name: '/gladys',
      state: 'running',
      id: '9e5f09775f897624deb1eb2ec8688c1b300d81bc3727fc71ae3290d3d8f71fa9',
      created_at: 1561506899
    }
  ],
  'get /api/v1/service': [
    {
      id: '27c96cfe-98ce-437b-a83f-5b13e0605203',
      pod_id: null,
      name: 'example',
      selector: 'example',
      version: '0.1.0',
      has_message_feature: false,
      status: 'LOADING',
      created_at: '2020-04-11T18:41:40.051Z',
      updated_at: '2020-10-18T10:13:22.365Z'
    },
    {
      id: '40262062-2e71-412c-8da0-70bd03f03b90',
      pod_id: null,
      name: 'philips-hue',
      selector: 'philips-hue',
      version: '0.1.0',
      has_message_feature: false,
      status: 'RUNNING',
      created_at: '2020-04-11T18:41:40.052Z',
      updated_at: '2020-10-30T07:44:07.731Z'
    },
    {
      id: '4cd73c14-a929-4af0-a5e2-baed35802224',
      pod_id: null,
      name: 'rtsp-camera',
      selector: 'rtsp-camera',
      version: '0.1.0',
      has_message_feature: false,
      status: 'RUNNING',
      created_at: '2020-04-11T18:41:40.053Z',
      updated_at: '2020-10-30T07:44:07.694Z'
    },
    {
      id: '0c27de72-ced7-4f7f-8950-473b9e904e71',
      pod_id: null,
      name: 'telegram',
      selector: 'telegram',
      version: '0.1.0',
      has_message_feature: true,
      status: 'RUNNING',
      created_at: '2020-04-11T18:41:40.053Z',
      updated_at: '2020-10-30T07:44:07.518Z'
    },
    {
      id: '09a3e250-940a-4f52-8595-e6268ffd7198',
      pod_id: null,
      name: 'usb',
      selector: 'usb',
      version: '0.1.0',
      has_message_feature: false,
      status: 'RUNNING',
      created_at: '2020-04-11T18:41:40.053Z',
      updated_at: '2020-10-30T07:44:07.660Z'
    },
    {
      id: '366fd9d7-bfbf-4c13-bd8c-4cc777799142',
      pod_id: null,
      name: 'xiaomi',
      selector: 'xiaomi',
      version: '0.1.0',
      has_message_feature: false,
      status: 'RUNNING',
      created_at: '2020-04-11T18:41:40.055Z',
      updated_at: '2020-10-30T07:44:07.474Z'
    },
    {
      id: '3772bbf5-b1d7-441f-9bd4-ef94920e31cd',
      pod_id: null,
      name: 'zwave',
      selector: 'zwave',
      version: '0.1.0',
      has_message_feature: false,
      status: 'RUNNING',
      created_at: '2020-04-11T18:41:40.056Z',
      updated_at: '2020-10-30T07:44:07.594Z'
    },
    {
      id: '7355bc7f-4109-40ba-819f-fb03f91969b0',
      pod_id: null,
      name: 'tasmota',
      selector: 'tasmota',
      version: '0.1.0',
      has_message_feature: false,
      status: 'RUNNING',
      created_at: '2020-04-11T18:41:40.056Z',
      updated_at: '2020-10-30T07:44:07.627Z'
    },
    {
      id: '2e0bc58b-11e2-4176-8ad3-9ebc8cdd2318',
      pod_id: null,
      name: 'mqtt',
      selector: 'mqtt',
      version: '0.1.0',
      has_message_feature: false,
      status: 'ERROR',
      created_at: '2020-04-11T18:41:40.057Z',
      updated_at: '2020-10-30T07:44:07.785Z'
    },
    {
      id: 'd97ba3fa-872f-4ecc-879f-46c55a2930c6',
      pod_id: null,
      name: 'google-actions',
      selector: 'google-actions',
      version: '0.1.0',
      has_message_feature: false,
      status: 'UNKNOWN',
      created_at: '2020-04-11T18:41:40.111Z',
      updated_at: '2020-04-11T18:41:40.111Z'
    },
    {
      id: '6d3c7a63-e4b8-4650-bcd3-50cf42b2996f',
      pod_id: null,
      name: 'caldav',
      selector: 'caldav',
      version: '0.1.0',
      has_message_feature: false,
      status: 'RUNNING',
      created_at: '2020-04-16T19:38:21.885Z',
      updated_at: '2020-10-30T07:44:07.558Z'
    },
    {
      id: '39a278e9-66da-47cb-bdaa-264ba6418091',
      pod_id: null,
      name: 'openweather',
      selector: 'openweather',
      version: '0.1.0',
      has_message_feature: false,
      status: 'RUNNING',
      created_at: '2020-08-19T13:04:57.309Z',
      updated_at: '2020-10-30T07:44:07.814Z'
    },
    {
      id: '9682e167-e07f-4823-bd31-a60f957842e0',
      pod_id: null,
      name: 'broadlink',
      selector: 'broadlink',
      version: '0.1.0',
      has_message_feature: false,
      status: 'UNKNOWN',
      created_at: '2020-08-30T15:55:19.467Z',
      updated_at: '2020-08-30T15:55:19.467Z'
    },
    {
      id: 'd6ea610f-1e33-4c08-89a3-1c8be2cc45f9',
      pod_id: null,
      name: 'bluetooth',
      selector: 'bluetooth',
      version: '0.1.0',
      has_message_feature: false,
      status: 'LOADING',
      created_at: '2020-09-02T12:35:32.763Z',
      updated_at: '2020-10-18T09:28:14.935Z'
    },
    {
      id: 'c9fe2705-35dc-417b-b6fc-c4bbb9c69886',
      pod_id: null,
      name: 'tp-link',
      selector: 'tp-link',
      version: '0.1.0',
      has_message_feature: false,
      status: 'RUNNING',
      created_at: '2020-11-11T18:41:40.052Z',
      updated_at: '2020-11-28T07:44:07.731Z'
    },
    {
      id: 'd1af258c-2016-4dc9-b0cc-d2e92dd2fcec',
      pod_id: null,
      name: 'lan-manager',
      selector: 'lan-manager',
      version: '0.1.0',
      has_message_feature: false,
      status: 'UNKNOWN',
      created_at: '2023-01-05T08:27:19.567Z',
      updated_at: '2023-01-05T08:27:19.567Z'
    }
  ],
  'get /api/v1/session': [
    {
      id: '4b249694-661b-4c48-afb5-924bbedcee63',
      token_type: 'refresh_token',
      scope: ['dashboard:write', 'dashboard:read'],
      valid_until: '2019-07-26T01:00:50.137Z',
      last_seen: null,
      revoked: false,
      useragent:
        'Mozilla/5.0 (Linux; Android 6.0.1; SHIELD Tablet K1 Build/MRA58K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/55.0.2883.91 Safari/537.36',
      created_at: '2019-06-26T01:00:50.138Z',
      updated_at: '2019-06-26T01:00:50.138Z'
    },
    {
      id: '2367a8cf-47a8-4db7-83b0-f89c2c6c34ac',
      token_type: 'refresh_token',
      scope: ['dashboard:write', 'dashboard:read'],
      valid_until: '2019-07-26T00:29:00.783Z',
      last_seen: null,
      revoked: false,
      useragent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1',
      created_at: '2019-06-26T00:29:00.783Z',
      updated_at: '2019-06-26T00:29:00.783Z'
    },
    {
      id: '2367a8cf-47a8-4db7-83b0-f89c2c6c34ac',
      token_type: 'refresh_token',
      scope: ['dashboard:write', 'dashboard:read'],
      valid_until: '2019-07-26T00:29:00.783Z',
      last_seen: null,
      revoked: false,
      useragent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246',
      created_at: '2019-06-26T00:29:00.783Z',
      updated_at: '2019-06-26T00:29:00.783Z'
    },
    {
      id: '2367a8cf-47a8-4db7-83b0-f89c2c6c34ac',
      token_type: 'refresh_token',
      scope: ['dashboard:write', 'dashboard:read'],
      valid_until: '2019-07-26T00:29:00.783Z',
      last_seen: null,
      revoked: false,
      created_at: '2019-06-26T00:29:00.783Z',
      updated_at: '2019-06-26T00:29:00.783Z'
    }
  ],
  'get /api/v1/setup': {
    account_configured: true
  },
  'get /api/v1/service/lan-manager/device': [
    {
      id: '6dbd067a-efdd-428e-8c1b-cb792255eae2',
      service_id: 'd1af258c-2016-4dc9-b0cc-d2e92dd2fcec',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      name: 'Media server',
      selector: 'lan-00B0D063C226',
      external_id: 'lan-00B0D063C226',
      should_poll: false,
      poll_frequency: null,
      created_at: '2023-01-05T08:28:09.567Z',
      updated_at: '2023-01-05T08:28:09.567Z',
      features: [
        {
          name: 'Presence',
          selector: 'lan-presence-sensor',
          category: 'presence-sensor',
          type: 'push',
          unit: null,
          min: 0,
          max: 1,
          read_only: true,
          last_value: 0,
          last_value_changed: dayjs().add(60, 'second')
        }
      ],
      room: {
        id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
        name: 'Living Room',
        selector: 'living-room'
      },
      params: [
        {
          name: 'DEVICE_MAC',
          value: '00:B0:D0:63:C2:26'
        },
        {
          name: 'DEVICE_NAME',
          value: 'media.lan'
        },
        {
          name: 'MANUFACTURER',
          value: 'Bob and co.'
        }
      ]
    }
  ],
  'get /api/v1/service/lan-manager/status': {
    scanning: false
  },
  'get /api/v1/service/lan-manager/config': {
    presenceScanner: {
      frequency: 120000,
      status: 'enabled'
    },
    ipMasks: [
      {
        mask: '192.168.1.1/24',
        name: 'eth0',
        networkInterface: true,
        enabled: false
      },
      {
        mask: '192.168.0.1/10',
        name: 'Custom',
        enabled: true
      }
    ]
  },
  'get /api/v1/service/lan-manager/discover': [
    {
      id: '6dbd067a-efdd-428e-8c1b-cb792255eae2',
      ip: '192.168.1.22',
      service_id: 'd1af258c-2016-4dc9-b0cc-d2e92dd2fcec',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      name: 'Media server',
      selector: 'lan-00B0D063C226',
      external_id: 'lan-00B0D063C226',
      should_poll: false,
      poll_frequency: null,
      created_at: '2023-01-05T08:28:09.567Z',
      updated_at: '2023-01-05T08:28:09.567Z',
      features: [
        {
          name: 'Presence',
          selector: 'lan-presence-sensor',
          category: 'presence-sensor',
          type: 'push',
          unit: null,
          min: 0,
          max: 1,
          read_only: true,
          last_value: 0,
          last_value_changed: dayjs().add(60, 'second')
        }
      ],
      params: [
        {
          name: 'DEVICE_MAC',
          value: '00:B0:D0:63:C2:26'
        },
        {
          name: 'DEVICE_NAME',
          value: 'media.lan'
        },
        {
          name: 'MANUFACTURER',
          value: 'Bob and co.'
        }
      ]
    },
    {
      service_id: 'd1af258c-2016-4dc9-b0cc-d2e92dd2fcec',
      name: 'New device',
      ip: '192.168.1.10',
      can_save: true,
      selector: 'lan-12B0D063C226',
      external_id: 'lan-12B0D063C226',
      should_poll: false,
      poll_frequency: null,
      features: [
        {
          name: 'Presence',
          selector: 'lan-presence-sensor',
          category: 'presence-sensor',
          type: 'push',
          unit: null,
          min: 0,
          max: 1,
          read_only: true,
          last_value: 0,
          last_value_changed: dayjs().add(60, 'second')
        }
      ],
      params: [
        {
          name: 'DEVICE_MAC',
          value: '12:B0:D0:63:C2:26'
        },
        {
          name: 'DEVICE_NAME',
          value: 'device.lan'
        }
      ]
    },
    {
      service_id: 'd1af258c-2016-4dc9-b0cc-d2e92dd2fcec',
      name: 'Random MAC device',
      ip: '192.168.1.100',
      can_save: false,
      selector: 'lan-A2B0D063C226',
      external_id: 'lan-A2B0D063C226',
      should_poll: false,
      poll_frequency: null,
      features: [
        {
          name: 'Presence',
          selector: 'lan-presence-sensor',
          category: 'presence-sensor',
          type: 'push',
          unit: null,
          min: 0,
          max: 1,
          read_only: true,
          last_value: 0,
          last_value_changed: dayjs().add(60, 'second')
        }
      ],
      params: [
        {
          name: 'DEVICE_MAC',
          value: 'A2:B0:D0:63:C2:26'
        },
        {
          name: 'DEVICE_NAME',
          value: 'random.lan'
        }
      ]
    }
  ],
  'get /api/v1/service/xiaomi/sensor': [
    {
      name: 'Xiaomi Temperature',
      external_id: 'xiaomi:1234',
      selector: 'xiaomi:1234',
      features: [
        {
          name: 'Temperature',
          selector: 'xiaomi:12344:temperature',
          external_id: 'xiaomi:12344:temperature',
          category: 'temperature-sensor',
          type: 'decimal',
          unit: 'celsius',
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: -20,
          max: 60
        },
        {
          name: 'Humidity',
          selector: 'xiaomi:12344:humidity',
          external_id: 'xiaomi:12344:humidity',
          category: 'humidity-sensor',
          type: 'decimal',
          unit: 'percent',
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 100
        },
        {
          name: 'Battery',
          selector: 'xiaomi:12344:battery',
          external_id: 'xiaomi:12344:battery',
          category: 'battery',
          type: 'integer',
          unit: 'percent',
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 100
        }
      ]
    }
  ],
  'get /api/v1/service/xiaomi/device': [
    {
      id: 'e5317b24-28e1-4839-9879-0bb7a3102e98',
      name: 'Xiaomi Temperature',
      external_id: 'xiaomi:1234',
      selector: 'xiaomi:1234',
      room_id: 'f99ab22a-e6a8-4756-b1fe-4d19dc8c8620',
      service_id: '70cb1e17-3b17-4886-83ab-45b00a9e03b1',
      features: [
        {
          name: 'Temperature',
          selector: 'xiaomi:12344:temperature',
          external_id: 'xiaomi:12344:temperature',
          category: 'temperature-sensor',
          type: 'decimal',
          unit: 'celsius',
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: -20,
          max: 60
        },
        {
          name: 'Humidity',
          selector: 'xiaomi:12344:humidity',
          external_id: 'xiaomi:12344:humidity',
          category: 'humidity-sensor',
          type: 'decimal',
          unit: 'percent',
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 100
        },
        {
          name: 'Battery',
          selector: 'xiaomi:12344:battery',
          external_id: 'xiaomi:12344:battery',
          category: 'battery',
          type: 'integer',
          unit: 'percent',
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 100
        }
      ]
    }
  ],
  'get /api/v1/device?device_feature_selectors=aqi-city': [
    {
      id: 'ed62adc6-b1b6-4a2b-b6d1-8e676d470e10',
      name: 'Air Quality Index',
      selector: 'aq-sensors',
      features: [
        {
          name: 'Air Quality Index',
          selector: 'aqi-city',
          category: 'airquality-sensor',
          type: 'aqi',
          min: 0,
          max: 1000,
          read_only: true,
          unit: 'aqi',
          last_value: 101,
          last_value_changed: '2023-01-23 08:50:06.556 +00:00'
        }
      ]
    }
  ],
  'get /api/v1/device?device_feature_selectors=main-tv-binary,main-tv-volume,main-tv-channel,main-presence-sensor,main-signal-sensor,air-conditioning,button-click': [
    {
      id: '20deebe6-57df-4940-afd1-11c189a407c2',
      name: 'TV',
      selector: 'main-tv',
      features: [
        {
          name: 'TV power',
          selector: 'main-tv-binary',
          category: 'television',
          type: 'binary',
          min: 0,
          max: 1,
          read_only: false,
          last_value: 1,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        },
        {
          name: 'TV Volume',
          selector: 'main-tv-volume',
          category: 'television',
          type: 'volume',
          min: 0,
          max: 20,
          read_only: false,
          last_value: 7,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        },
        {
          name: 'TV Channel',
          selector: 'main-tv-channel',
          category: 'television',
          type: 'channel',
          min: 0,
          max: 99,
          read_only: false,
          last_value: 22,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        },
        {
          name: 'Presence',
          selector: 'main-presence-sensor',
          category: 'presence-sensor',
          type: 'push',
          unit: null,
          min: 0,
          max: 1,
          read_only: true,
          last_value: 0,
          last_value_changed: dayjs().add(60, 'second')
        },
        {
          name: 'Signal quality',
          selector: 'main-signal-sensor',
          category: 'signal',
          type: 'integer',
          unit: null,
          min: 0,
          max: 5,
          read_only: true,
          last_value: 4,
          last_value_changed: dayjs().add(60, 'second')
        },
        {
          name: 'Button',
          selector: 'button-click',
          category: 'button',
          type: 'click',
          min: 0,
          max: 6,
          read_only: true,
          last_value: 1,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        }
      ]
    },
    {
      id: 'e9cc8a96-56b8-41b6-ba99-4c200272abf6',
      name: 'Main sensors',
      selector: 'main-sensors',
      features: [
        {
          name: 'CO',
          selector: 'co-living-room',
          category: 'co-sensor',
          type: 'binary',
          min: 0,
          max: 1,
          read_only: true,
          last_value: 1,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        }
      ]
    },
    {
      id: 'b32daa9a-8f77-4394-b4f3-ffea215062d2',
      name: 'Main Lamp',
      selector: 'main-lamp',
      features: [
        {
          name: 'First lamp',
          selector: 'main-lamp-binary',
          category: 'light',
          type: 'binary',
          min: 0,
          max: 1,
          read_only: false,
          last_value: 1,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        },
        {
          name: 'Second lamp ',
          selector: 'secondary-lamp-binary',
          category: 'light',
          type: 'binary',
          min: 0,
          max: 1,
          read_only: false,
          last_value: 1,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        },
        {
          name: 'TV Lamp color',
          selector: 'tv-lamp-color',
          category: 'light',
          type: 'color',
          min: 0,
          max: 16777215,
          read_only: false,
          last_value: 65000,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        },
        {
          name: 'TV Lamp brightness',
          selector: 'tv-lamp-brightness',
          category: 'light',
          type: 'brightness',
          min: 0,
          max: 100,
          read_only: false,
          last_value: 55,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        }
      ]
    },
    {
      id: 'b32daa9a-8f77-4394-b4f3-ffea215062d2',
      name: 'TV Lamp',
      selector: 'tv-lamp',
      features: [
        {
          name: 'TV Lamp feature',
          selector: 'tv-lamp-binary',
          category: 'light',
          type: 'binary',
          min: 0,
          max: 1,
          read_only: false,
          last_value: 1,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        }
      ]
    },
    {
      id: 'adefb484-223e-478a-8330-8fb1b3a20920',
      selector: 'temperature-living-room',
      features: [
        {
          name: 'Temperature',
          selector: 'temperature-living-room-celsius',
          category: 'temperature-sensor',
          type: 'decimal',
          unit: 'celsius',
          min: -200,
          max: 200,
          read_only: true,
          last_value: 27,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        }
      ]
    },
    {
      id: '81d637d2-b7f5-4cc3-a39e-2270fd069ee2',
      selector: 'mqtt-living-room',
      name: 'MQTT device',
      service: {
        name: 'mqtt'
      },
      features: [
        {
          name: 'Temperature',
          selector: 'mqtt-living-room-temp',
          category: 'temperature-sensor',
          type: 'decimal',
          unit: 'celsius',
          min: -200,
          max: 200,
          read_only: true,
          last_value: 27,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        }
      ]
    },
    {
      id: 'db3e81b6-00d4-4f9b-8aa6-0e50e719a729',
      name: 'AC Conditioning',
      selector: 'air-conditioning',
      features: [
        {
          name: 'AC Conditioning',
          selector: 'air-conditioning',
          category: 'air-conditioning',
          type: 'binary',
          min: 0,
          max: 1,
          read_only: false,
          last_value: 1,
          last_value_changed: '2022-10-10 07:49:07.556 +00:00'
        },
        {
          name: 'AC Conditioning',
          selector: 'air-conditioning',
          category: 'air-conditioning',
          type: 'mode',
          min: 0,
          max: 2,
          read_only: false,
          last_value: 1,
          last_value_changed: '2022-10-10 07:49:07.556 +00:00'
        },
        {
          name: 'AC Conditioning',
          selector: 'air-conditioning',
          category: 'air-conditioning',
          type: 'target-temperature',
          min: 0,
          max: 30,
          read_only: false,
          last_value: 24,
          last_value_changed: '2022-10-10 07:49:07.556 +00:00',
          unit: 'celsius'
        }
      ]
    }
  ],
  'get /api/v1/device?device_feature_selectors=curtain-actions,shutter-actions,shutter-position,thermostat,water-leak,smoke-sensor,light-sensor': [
    {
      id: 'f131fbf2-445a-4c2c-9426-83abaf534662',
      name: 'Room sensors',
      selector: 'room-sensors',
      features: [
        {
          name: 'Water Leak',
          selector: 'water-leak',
          category: 'leak-sensor',
          type: 'binary',
          min: 0,
          max: 1,
          read_only: true,
          last_value: 1,
          last_value_changed: '2023-01-23 08:50:06.556 +00:00'
        },
        {
          name: 'Smoke sensor',
          selector: 'smoke-sensor',
          category: 'smoke-sensor',
          type: 'binary',
          min: 0,
          max: 1,
          read_only: true,
          last_value: 1,
          last_value_changed: '2023-01-23 08:50:06.556 +00:00'
        },
        {
          name: 'Light sensor',
          selector: 'light-sensor',
          category: 'light-sensor',
          type: 'binary',
          min: 0,
          max: 1,
          read_only: true,
          last_value: 1,
          last_value_changed: '2023-01-23 08:50:06.556 +00:00'
        }
      ]
    },
    {
      id: 'cb3b1a30-d1b6-4624-ac18-e581e3e3b00f',
      name: 'Main curtain',
      selector: 'main-curtain',
      features: [
        {
          name: 'Curtain',
          selector: 'curtain-actions',
          category: 'curtain',
          type: 'state',
          min: -1,
          max: 1,
          read_only: false,
          last_value: 1,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        },
        {
          name: 'Curtain',
          selector: 'curtain-position',
          category: 'curtain',
          type: 'position',
          min: 0,
          max: 100,
          read_only: true,
          last_value: 30,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        }
      ]
    },
    {
      id: '919be7a4-df47-4726-b1c0-7412aed99769',
      name: 'Main shutter',
      selector: 'main-shutter',
      features: [
        {
          name: 'Shutter',
          selector: 'shutter-actions',
          category: 'shutter',
          type: 'state',
          min: -1,
          max: 1,
          read_only: false,
          last_value: 1,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        },
        {
          name: 'Shutter position',
          selector: 'shutter-position',
          category: 'shutter',
          type: 'position',
          min: 0,
          max: 100,
          read_only: true,
          last_value: 30,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00',
          unit: 'percent'
        }
      ]
    },
    {
      id: 'db3e81b4-00d4-4f9b-8aa6-0e50e719a729',
      name: 'Thermostat',
      selector: 'thermostat',
      features: [
        {
          name: 'Thermostat',
          selector: 'thermostat',
          category: 'thermostat',
          type: 'target-temperature',
          min: 0,
          max: 30,
          read_only: false,
          last_value: 19.5,
          last_value_changed: '2022-10-10 07:49:07.556 +00:00',
          unit: 'celsius'
        }
      ]
    }
  ],
  'get /api/v1/device?device_feature_selectors=main-lamp-binary,tv-lamp-binary,tv-lamp-color,tv-lamp-brightness,mqtt-living-room-switch,mqtt-living-room-dimmer,mqtt-living-room-temp,co-living-room': [
    {
      id: '20deebe6-57df-4940-afd1-11c189a407c2',
      name: 'TV',
      selector: 'main-tv',
      features: [
        {
          name: 'TV power',
          selector: 'main-tv-binary',
          category: 'television',
          type: 'binary',
          min: 0,
          max: 1,
          read_only: false,
          last_value: 1,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        },
        {
          name: 'TV Volume',
          selector: 'main-tv-volume',
          category: 'television',
          type: 'volume',
          min: 0,
          max: 20,
          read_only: false,
          last_value: 7,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        },
        {
          name: 'TV Channel',
          selector: 'main-tv-channel',
          category: 'television',
          type: 'channel',
          min: 0,
          max: 99,
          read_only: false,
          last_value: 22,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        },
        {
          name: 'Presence',
          selector: 'main-presence-sensor',
          category: 'presence-sensor',
          type: 'push',
          unit: null,
          min: 0,
          max: 1,
          read_only: true,
          last_value: 0,
          last_value_changed: dayjs().add(60, 'second')
        },
        {
          name: 'Signal quality',
          selector: 'main-signal-sensor',
          category: 'signal',
          type: 'integer',
          unit: null,
          min: 0,
          max: 5,
          read_only: true,
          last_value: 4,
          last_value_changed: dayjs().add(60, 'second')
        },
        {
          name: 'Button',
          selector: 'button-click',
          category: 'button',
          type: 'click',
          min: 0,
          max: 6,
          read_only: true,
          last_value: 1,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        }
      ]
    },
    {
      id: 'e9cc8a96-56b8-41b6-ba99-4c200272abf6',
      name: 'Main sensors',
      selector: 'main-sensors',
      features: [
        {
          name: 'CO',
          selector: 'co-living-room',
          category: 'co-sensor',
          type: 'binary',
          min: 0,
          max: 1,
          read_only: true,
          last_value: 1,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        }
      ]
    },
    {
      id: 'b32daa9a-8f77-4394-b4f3-ffea215062d2',
      name: 'Main Lamp',
      selector: 'main-lamp',
      features: [
        {
          name: 'First lamp',
          selector: 'main-lamp-binary',
          category: 'light',
          type: 'binary',
          min: 0,
          max: 1,
          read_only: false,
          last_value: 1,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        },
        {
          name: 'Second lamp ',
          selector: 'secondary-lamp-binary',
          category: 'light',
          type: 'binary',
          min: 0,
          max: 1,
          read_only: false,
          last_value: 1,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        },
        {
          name: 'TV Lamp color',
          selector: 'tv-lamp-color',
          category: 'light',
          type: 'color',
          min: 0,
          max: 16777215,
          read_only: false,
          last_value: 65000,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        },
        {
          name: 'TV Lamp brightness',
          selector: 'tv-lamp-brightness',
          category: 'light',
          type: 'brightness',
          min: 0,
          max: 100,
          read_only: false,
          last_value: 55,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        }
      ]
    },
    {
      id: 'b32daa9a-8f77-4394-b4f3-ffea215062d2',
      name: 'TV Lamp',
      selector: 'tv-lamp',
      features: [
        {
          name: 'TV Lamp feature',
          selector: 'tv-lamp-binary',
          category: 'light',
          type: 'binary',
          min: 0,
          max: 1,
          read_only: false,
          last_value: 1,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        }
      ]
    },
    {
      id: 'adefb484-223e-478a-8330-8fb1b3a20920',
      selector: 'temperature-living-room',
      features: [
        {
          name: 'Temperature',
          selector: 'temperature-living-room-celsius',
          category: 'temperature-sensor',
          type: 'decimal',
          unit: 'celsius',
          min: -200,
          max: 200,
          read_only: true,
          last_value: 27,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        }
      ]
    },
    {
      id: '81d637d2-b7f5-4cc3-a39e-2270fd069ee2',
      selector: 'mqtt-living-room',
      name: 'MQTT device',
      service: {
        name: 'mqtt'
      },
      features: [
        {
          name: 'Temperature',
          selector: 'mqtt-living-room-temp',
          category: 'temperature-sensor',
          type: 'decimal',
          unit: 'celsius',
          min: -200,
          max: 200,
          read_only: true,
          last_value: 27,
          last_value_changed: '2019-02-12 07:49:07.556 +00:00'
        }
      ]
    },
    {
      id: 'db3e81b6-00d4-4f9b-8aa6-0e50e719a729',
      name: 'AC Conditioning',
      selector: 'air-conditioning',
      features: [
        {
          name: 'AC Conditioning',
          selector: 'air-conditioning',
          category: 'air-conditioning',
          type: 'binary',
          min: 0,
          max: 1,
          read_only: false,
          last_value: 1,
          last_value_changed: '2022-10-10 07:49:07.556 +00:00'
        },
        {
          name: 'AC Conditioning',
          selector: 'air-conditioning',
          category: 'air-conditioning',
          type: 'mode',
          min: 0,
          max: 2,
          read_only: false,
          last_value: 1,
          last_value_changed: '2022-10-10 07:49:07.556 +00:00'
        },
        {
          name: 'AC Conditioning',
          selector: 'air-conditioning',
          category: 'air-conditioning',
          type: 'target-temperature',
          min: 0,
          max: 30,
          read_only: false,
          last_value: 24,
          last_value_changed: '2022-10-10 07:49:07.556 +00:00',
          unit: 'celsius'
        }
      ]
    }
  ],
  'get /api/v1/service/xiaomi': {
    id: '70cb1e17-3b17-4886-83ab-45b00a9e03b1',
    name: 'Xiaomi',
    selector: 'xiaomi'
  },
  'get /api/v1/device/zwave:1234': {
    id: 'fbedb47f-4d25-4381-8923-2633b23192a0',
    service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
    room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
    name: 'Fibaro Motion Sensor',
    selector: 'zwave:1234',
    external_id: 'test-sensor-external',
    should_poll: false,
    poll_frequency: null,
    created_at: '2019-02-12T07:49:07.556Z',
    updated_at: '2019-02-12T07:49:07.556Z',
    features: [
      {
        name: 'Temperature',
        external_id: 'zwave:1234:temperature',
        selector: 'test-temperature',
        category: 'temperature-sensor',
        unit: 'celsius',
        type: 'decimal'
      },
      {
        name: 'Motion',
        selector: 'test-motion',
        external_id: 'zwave:1234:temperature',
        category: 'motion-sensor',
        type: 'binary'
      },
      {
        name: 'Battery',
        selector: 'test-battery',
        external_id: 'zwave:1234:temperature',
        category: 'battery',
        type: 'integer',
        last_value: '92'
      },
      {
        name: 'Lux',
        selector: 'test-light',
        external_id: 'zwave:1234:temperature',
        category: 'light-sensor',
        type: 'integer'
      }
    ],
    room: {
      id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      name: 'Living Room',
      selector: 'living-room'
    }
  },
  'get /api/v1/service/zwave': {
    id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
    name: 'Zwave',
    selector: 'zwave'
  },
  'get /api/v1/device/xiaomi:1234': {
    id: 'e5317b24-28e1-4839-9879-0bb7a3102e98',
    name: 'Xiaomi Temperature',
    external_id: 'xiaomi:1234',
    selector: 'xiaomi:1234',
    room_id: 'f99ab22a-e6a8-4756-b1fe-4d19dc8c8620',
    service_id: '70cb1e17-3b17-4886-83ab-45b00a9e03b1',
    features: [
      {
        name: 'Temperature',
        selector: 'xiaomi:12344:temperature',
        external_id: 'xiaomi:12344:temperature',
        category: 'temperature-sensor',
        type: 'decimal',
        unit: 'celsius',
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: -20,
        max: 60
      },
      {
        name: 'Humidity',
        selector: 'xiaomi:12344:humidity',
        external_id: 'xiaomi:12344:humidity',
        category: 'humidity-sensor',
        type: 'decimal',
        unit: 'percent',
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 100
      },
      {
        name: 'Battery',
        selector: 'xiaomi:12344:battery',
        external_id: 'xiaomi:12344:battery',
        category: 'battery',
        type: 'integer',
        unit: 'percent',
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 100
      }
    ]
  },
  'get /api/v1/service/philips-hue': {
    id: '1147bdef-0c95-40f1-a7ef-922ebcad7d0e',
    name: 'Philips Hue',
    selector: 'philips-hue'
  },
  'get /api/v1/service/philips-hue/light': [
    {
      id: '1',
      name: 'New Lamp',
      model: 'LCT007',
      external_id: 'philips-hue:4'
    },
    {
      id: '2',
      name: 'Living room lamp',
      model: 'LCT007',
      external_id: 'philips-hue:5'
    }
  ],
  'get /api/v1/service/philips-hue/device': [
    {
      id: '1',
      name: 'Lounge Living Color',
      model: 'LCT007',
      external_id: 'philips-hue:1',
      features: [
        {
          name: 'On/Off',
          category: 'light',
          type: 'binary',
          min: 0,
          max: 1
        },
        {
          name: 'Color',
          category: 'light',
          type: 'color',
          min: 0,
          max: 1
        }
      ]
    },
    {
      id: '2',
      name: 'Right Bedside',
      type: 'Extended color light',
      model: 'LCT001',
      external_id: 'philips-hue:2',
      features: [
        {
          name: 'On/Off',
          category: 'light',
          type: 'binary',
          min: 0,
          max: 1
        },
        {
          name: 'Color',
          category: 'light',
          type: 'color',
          min: 0,
          max: 1
        }
      ]
    },
    {
      id: '3',
      name: 'Left Bedside',
      type: 'Extended color light',
      model: 'LCT001',
      external_id: 'philips-hue:3',
      features: [
        {
          name: 'On/Off',
          category: 'light',
          type: 'binary',
          min: 0,
          max: 1
        },
        {
          name: 'Color',
          category: 'light',
          type: 'color',
          min: 0,
          max: 1
        }
      ]
    }
  ],
  'get /api/v1/service/bluetooth': {
    id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
    name: 'bluetooth',
    enabled: true
  },
  'get /api/v1/service/bluetooth/config': {
    presenceScanner: {
      status: 'enabled',
      frequency: 60000
    }
  },
  'get /api/v1/service/bluetooth/device': [
    {
      id: 'fbedb47f-4d25-4381-8923-2633b23192a0',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      name: 'Nut Smart Tracker',
      selector: 'bluetooth-sensor',
      external_id: 'test-sensor-external',
      should_poll: false,
      poll_frequency: null,
      created_at: '2019-02-12T07:49:07.556Z',
      updated_at: '2019-02-12T07:49:07.556Z',
      features: [
        {
          name: 'Battery',
          selector: 'test-battery',
          category: 'battery',
          type: 'integer',
          last_value: '12'
        }
      ],
      room: {
        id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
        name: 'Living Room',
        selector: 'living-room'
      }
    }
  ],
  'get /api/v1/device/bluetooth-sensor': {
    id: 'fbedb47f-4d25-4381-8923-2633b23192a0',
    service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
    room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
    name: 'Nut Smart Tracker',
    selector: 'bluetooth-sensor',
    external_id: 'bluetooth:external',
    should_poll: false,
    poll_frequency: null,
    created_at: '2019-02-12T07:49:07.556Z',
    updated_at: '2019-02-12T07:49:07.556Z',
    features: [
      {
        name: 'Battery',
        selector: 'test-battery',
        category: 'battery',
        type: 'integer',
        last_value: '12'
      }
    ],
    room: {
      id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      name: 'Living Room',
      selector: 'living-room'
    }
  },
  'get /api/v1/service/bluetooth/status': {
    ready: true
  },
  'get /api/v1/service/bluetooth/peripheral': [
    {
      name: 'BLE Device 1',
      external_id: 'bluetooth:0011223341',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      selector: 'bluetooth-0011223341',
      features: [],
      params: [
        {
          name: 'loaded',
          value: false
        }
      ]
    },
    {
      name: 'SML c9',
      model: 'smlc9',
      external_id: 'bluetooth:0011223342',
      selector: 'bluetooth-0011223342',
      features: [],
      params: [
        {
          name: 'loaded',
          value: true
        },
        {
          name: 'manufacturer',
          value: 'AwoX'
        }
      ]
    },
    {
      name: 'Peanut temperature',
      external_id: 'bluetooth:0011223343',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996278',
      service: {
        name: 'peanut'
      },
      selector: 'bluetooth-0011223343',
      params: [
        {
          name: 'loaded',
          value: true
        },
        {
          name: 'manufacturer',
          value: 'Peanut'
        }
      ],
      features: [
        {
          name: 'Battery',
          category: 'battery',
          type: 'integer',
          unit: 'percent',
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 100
        },
        {
          name: 'Temperature',
          category: 'temperature-sensor',
          type: 'decimal',
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: -100,
          max: 250
        }
      ]
    }
  ],
  'get /api/v1/service/bluetooth/peripheral/bluetooth-0011223341': {
    name: 'BLE Device 1',
    external_id: 'bluetooth:0011223341',
    selector: 'bluetooth-0011223341',
    features: [],
    params: [
      {
        name: 'loaded',
        value: false
      }
    ]
  },
  'get /api/v1/service/bluetooth/peripheral/bluetooth-0011223342': {
    name: 'SML c9',
    model: 'smlc9',
    external_id: 'bluetooth:0011223342',
    selector: 'bluetooth-0011223342',
    features: [],
    params: [
      {
        name: 'loaded',
        value: true
      },
      {
        name: 'manufacturer',
        value: 'AwoX'
      }
    ]
  },
  'get /api/v1/service/bluetooth/peripheral/bluetooth-0011223343': {
    name: 'Peanut temperature',
    external_id: 'bluetooth:0011223343',
    selector: 'bluetooth-0011223343',
    params: [
      {
        name: 'loaded',
        value: true
      },
      {
        name: 'manufacturer',
        value: 'Peanut'
      }
    ],
    features: [
      {
        name: 'Battery',
        category: 'battery',
        type: 'integer',
        unit: 'percent',
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 100
      },
      {
        name: 'Temperature',
        category: 'temperature-sensor',
        type: 'decimal',
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: -100,
        max: 250
      }
    ]
  },
  'get /api/v1/service/ewelink': {
    id: '45c792a5-051b-4e6f-b746-2dd4c77d9d31',
    name: 'ewelink',
    selector: 'ewelink'
  },
  'get /api/v1/service/ewelink/device': [
    {
      id: '28e8ad03-70a8-431f-93cb-df916019c509',
      room_id: '568981d0-1a4d-40ea-af97-dd4037d2b344',
      name: 'Switch 1',
      selector: 'ewelink-1000768322-0',
      model: 'MINI',
      external_id: 'ewelink:1000768322:0',
      should_poll: true,
      poll_frequency: 60000,
      features: [
        {
          id: '6f8172ed-37e5-4785-94ad-ec33706a31f3',
          device_id: '28e8ad03-70a8-431f-93cb-df916019c509',
          name: 'Switch 1 On/Off',
          selector: 'ewelink-1000768322-0-binary',
          external_id: 'ewelink:1000768322:0:binary',
          category: 'switch',
          type: 'binary',
          read_only: false,
          has_feedback: false,
          min: 0,
          max: 1
        }
      ],
      params: [
        {
          id: '5e1ef948-305b-44c5-bb78-78952b1f5cb2',
          device_id: '28e8ad03-70a8-431f-93cb-df916019c509',
          name: 'IP_ADDRESS',
          value: '0.0.0.1'
        },
        {
          id: 'f3a6f3fa-a7b0-4968-b9fd-2e492ced2274',
          device_id: '28e8ad03-70a8-431f-93cb-df916019c509',
          name: 'FIRMWARE',
          value: '3.3.0'
        },
        {
          name: 'ONLINE',
          value: '1'
        }
      ],
      room: {
        id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
        name: 'Living Room',
        selector: 'living-room'
      },
      service: {
        id: '45c792a5-051b-4e6f-b746-2dd4c77d9d31',
        name: 'ewelink',
        selector: 'ewelink'
      }
    }
  ],
  'get /api/v1/service/ewelink/discover': [
    {
      service_id: '45c792a5-051b-4e6f-b746-2dd4c77d9d31',
      name: 'Switch 2',
      model: 'Basic',
      external_id: 'ewelink:10004636bf:0',
      selector: 'ewelink:10004636bf:0',
      should_poll: true,
      poll_frequency: 60000,
      features: [
        {
          name: 'Switch 2 On/Off',
          external_id: 'ewelink:10004636bf:0:binary',
          selector: 'ewelink:10004636bf:0:binary',
          category: 'switch',
          type: 'binary',
          read_only: false,
          has_feedback: false,
          min: 0,
          max: 1
        }
      ],
      params: [
        {
          name: 'IP_ADDRESS',
          value: '0.0.0.2'
        },
        {
          name: 'FIRMWARE',
          value: '3.2.1'
        },
        {
          name: 'ONLINE',
          value: '1'
        }
      ]
    }
  ],
  'get /api/v1/service/tp-link': {
    id: 'c9fe2705-35dc-417b-b6fc-c4bbb9c69886',
    pod_id: null,
    name: 'tp-link',
    selector: 'tp-link',
    version: '0.1.0',
    has_message_feature: false,
    status: 'RUNNING',
    created_at: '2020-11-11T18:41:40.052Z',
    updated_at: '2020-11-28T07:44:07.731Z'
  },
  'get /api/v1/service/tp-link/device': [
    {
      id: '1',
      name: 'Plug Coffee Machine',
      model: 'HS100',
      external_id: 'tp-link-1',
      features: [
        {
          name: 'On/Off',
          category: 'switch',
          type: 'binary',
          min: 0,
          max: 1
        }
      ]
    },
    {
      id: '2',
      name: 'Light Swimming Pool',
      model: 'LB100',
      external_id: 'tp-link-2',
      features: [
        {
          name: 'On/Off',
          category: 'light',
          type: 'binary',
          min: 0,
          max: 1
        }
      ]
    }
  ],
  'get /api/v1/service/tp-link/scan': [
    {
      id: '3',
      name: 'Plug TV Dock',
      model: 'HS100',
      external_id: 'tp-link-3',
      features: [
        {
          name: 'On/Off',
          category: 'switch',
          type: 'binary',
          min: 0,
          max: 1
        }
      ]
    },
    {
      id: '4',
      name: 'Light Bedroom',
      model: 'LB100',
      external_id: 'tp-link-4',
      features: [
        {
          name: 'On/Off',
          category: 'light',
          type: 'binary',
          min: 0,
          max: 1
        }
      ]
    }
  ],
  'get /api/v1/device_feature/aggregated_states?interval=43200&max_states=100&device_features=temperature-sensor-1': [
    {
      device: {
        name: 'Kitchen temperature'
      },
      deviceFeature: {
        name: 'Kitchen temperature'
      },
      values: [
        { created_at: dayjs().toISOString(), value: 28 },
        {
          created_at: dayjs()
            .subtract(1, 'day')
            .toISOString(),
          value: 33
        },
        {
          created_at: dayjs()
            .subtract(2, 'day')
            .toISOString(),
          value: 44
        },
        {
          created_at: dayjs()
            .subtract(3, 'day')
            .toISOString(),
          value: 28
        },
        {
          created_at: dayjs()
            .subtract(4, 'day')
            .toISOString(),
          value: 36
        },
        {
          created_at: dayjs()
            .subtract(5, 'day')
            .toISOString(),
          value: 24
        },
        {
          created_at: dayjs()
            .subtract(5, 'day')
            .toISOString(),
          value: 65
        },
        {
          created_at: dayjs()
            .subtract(6, 'day')
            .toISOString(),
          value: 31
        },
        {
          created_at: dayjs()
            .subtract(7, 'day')
            .toISOString(),
          value: 37
        },
        {
          created_at: dayjs()
            .subtract(8, 'day')
            .toISOString(),
          value: 39
        },
        {
          created_at: dayjs()
            .subtract(9, 'day')
            .toISOString(),
          value: 62
        },
        {
          created_at: dayjs()
            .subtract(10, 'day')
            .toISOString(),
          value: 51
        },
        {
          created_at: dayjs()
            .subtract(11, 'day')
            .toISOString(),
          value: 35
        },
        {
          created_at: dayjs()
            .subtract(12, 'day')
            .toISOString(),
          value: 41
        },
        {
          created_at: dayjs()
            .subtract(13, 'day')
            .toISOString(),
          value: 35
        },
        {
          created_at: dayjs()
            .subtract(14, 'day')
            .toISOString(),
          value: 27
        },
        {
          created_at: dayjs()
            .subtract(15, 'day')
            .toISOString(),
          value: 93
        },
        {
          created_at: dayjs()
            .subtract(16, 'day')
            .toISOString(),
          value: 53
        },
        {
          created_at: dayjs()
            .subtract(17, 'day')
            .toISOString(),
          value: 61
        },
        {
          created_at: dayjs()
            .subtract(18, 'day')
            .toISOString(),
          value: 27
        },
        {
          created_at: dayjs()
            .subtract(19, 'day')
            .toISOString(),
          value: 54
        },
        {
          created_at: dayjs()
            .subtract(20, 'day')
            .toISOString(),
          value: 43
        },
        {
          created_at: dayjs()
            .subtract(21, 'day')
            .toISOString(),
          value: 19
        },
        {
          created_at: dayjs()
            .subtract(22, 'day')
            .toISOString(),
          value: 46
        },
        {
          created_at: dayjs()
            .subtract(23, 'day')
            .toISOString(),
          value: 39
        },
        {
          created_at: dayjs()
            .subtract(24, 'day')
            .toISOString(),
          value: 62
        },
        {
          created_at: dayjs()
            .subtract(25, 'day')
            .toISOString(),
          value: 51
        },
        {
          created_at: dayjs()
            .subtract(26, 'day')
            .toISOString(),
          value: 35
        },
        {
          created_at: dayjs()
            .subtract(27, 'day')
            .toISOString(),
          value: 41
        },
        {
          created_at: dayjs()
            .subtract(28, 'day')
            .toISOString(),
          value: 33
        }
      ]
    }
  ],
  'get /api/v1/job': [
    {
      id: 'f69252f4-1216-4021-8fc0-83234da71a4a',
      type: 'monthly-device-state-aggregate',
      status: 'success',
      progress: 100,
      data: {},
      created_at: dayjs()
        .subtract(1, 'hour')
        .toISOString()
    },
    {
      id: 'b2d590aa-40d7-435a-910a-cf370dde06a9',
      type: 'daily-device-state-aggregate',
      status: 'success',
      progress: 98,
      data: {},
      created_at: dayjs()
        .subtract(1, 'hour')
        .toISOString()
    },
    {
      id: 'd1e7ee47-229c-4b9f-bbaa-201db860cc25',
      type: 'hourly-device-state-aggregate',
      status: 'success',
      progress: 100,
      data: {},
      created_at: dayjs()
        .subtract(1, 'hour')
        .toISOString()
    },
    {
      id: '06411e01-a909-4531-9246-2e935c16ba69',
      type: 'monthly-device-state-aggregate',
      status: 'success',
      progress: 100,
      data: {},
      created_at: dayjs()
        .subtract(2, 'hour')
        .toISOString()
    },
    {
      id: '10469873-569a-4dfb-b35c-4468c26542a4',
      type: 'daily-device-state-aggregate',
      status: 'success',
      progress: 100,
      data: {},
      created_at: dayjs()
        .subtract(2, 'hour')
        .toISOString()
    },
    {
      id: '5307b306-8d95-41e3-9ec6-a5c29d386c9b',
      type: 'hourly-device-state-aggregate',
      status: 'success',
      progress: 100,
      data: {},
      created_at: dayjs()
        .subtract(2, 'hour')
        .toISOString()
    },
    {
      id: 'c3da516f-3565-4b00-be82-ddd00fe39a12',
      type: 'monthly-device-state-aggregate',
      status: 'success',
      progress: 100,
      data: {},
      created_at: dayjs()
        .subtract(3, 'hour')
        .toISOString()
    },
    {
      id: '5ca896b5-e810-48f5-bfb6-f3039a6776c5',
      type: 'daily-device-state-aggregate',
      status: 'success',
      progress: 100,
      data: {},
      created_at: dayjs()
        .subtract(3, 'hour')
        .toISOString()
    },
    {
      id: 'ae916efe-6209-49cb-a2fc-323f3ab5f91d',
      type: 'hourly-device-state-aggregate',
      status: 'success',
      progress: 100,
      data: {},
      created_at: dayjs()
        .subtract(3, 'hour')
        .toISOString()
    }
  ],
  'get /api/v1/service/sonos/device': [
    {
      id: 'c0e21639-4fe9-4d1c-ad65-33255d21bf0d',
      name: 'Sonos Speaker',
      external_id: 'sonos:uuid',
      features: [
        {
          name: 'Sonos Play',
          category: 'music',
          type: 'play',
          min: 1,
          max: 1
        }
      ]
    }
  ],
  'get /api/v1/service/sonos/discover': [
    {
      name: 'Sonos Speaker',
      external_id: 'sonos:uuid',
      features: [
        {
          name: 'Sonos Play',
          category: 'music',
          type: 'play',
          min: 1,
          max: 1
        }
      ]
    },
    {
      name: 'Sonos Speaker',
      external_id: 'sonos:another_uuid',
      features: [
        {
          name: 'Sonos Play',
          category: 'music',
          type: 'play',
          min: 1,
          max: 1
        }
      ]
    }
  ],
  'get /api/v1/service/edf-tempo/state': {
    today_peak_state: 'blue',
    tomorrow_peak_state: 'blue',
    current_hour_peak_state: 'peak-hour'
  }
};

export default data;
