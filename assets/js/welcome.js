var theater = theaterJS({ locale: 'en' });
theater.addActor('gladystext', {
    accuracy: 0.9, speed: 1,
    minSpeed: {
        erase: 90,
        type: 80
    }
});

theater
.addScene('gladystext:Hi !')
.addScene(800)
.addScene(-5)
.addScene('I\'m Gladys.')
.addScene(900) 
.addScene(-13) 
.addScene('I\'m your smart assistant !')
.addScene(1000)
.addScene(theater.replay);