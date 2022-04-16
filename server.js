const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
mongoose.connect('mongodb+srv://stu105:p251976-@csci2720.m2qbq.mongodb.net/stu105');
const db = mongoose.connection;
const PORT = 3000;
const cors = require('cors');
app.use(cors());

//Upon connection failure
db.on('error', console.error.bind(console,'Connection error:'));

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.json());

//Upon opening the database successfully
db.once('open', function () {
    console.log("Connection is open...");

    const LocationSchema = mongoose.Schema({
        locId: {
            type: Number,
            required: true,
            unique: true
        },
        name: {
            type: String,
            required: true
        },
        quota: {
            type: Number
        }
    });

    const Location = mongoose.model('Location', LocationSchema);

    const EventSchema = mongoose.Schema({
        eventId: {
            type: Number,
            required: true,
            unique: true
        },
        name: {
            type: String,
            required: true
        },
        loc: {
            type: Object
        },
        quota: {
            type: Number
        }
    });

    const Event = mongoose.model('Event', EventSchema);
    
    //Q1: look up the event with the given event ID from the database
    //Done
    app.get('/event/:eventId', (req,res) => {
        Event.findOne(
            {eventId: req.params['eventId']},
            'eventId name loc quota', (err,e) => {
                if (err || e == null){
                    res.status(404).send("Event Id not found");
                }  
                else
                    res.send(`{<br>\n"eventId": ${e.eventId},<br>\n"name": "${e.name}",<br>\n"loc":<br>\n{<br>\n"locId": ${e.loc.locId},<br>\n"name": "${e.loc.name}"<br>\n},<br>\n"quota": ${e.quota}<br>\n}`);
            }
        );
    });

    //Q2: use the parameters submitted in the HTTP request body to create a new event in the database
    //Done
    app.post('/event', (req,res) => {
        console.log(req);
        Location.findOne({locId: req.body['locId']}, (err, loc) => {
            if(err)
                res.status(404).send("error in finding location");
            if (loc === null)
                res.status(404).send("no such location, please enter a valid location ID");
            else if(req.body['quota'] > loc.quota){
                    res.status(400).send("You have inputted a quota larger than the location can hold, please try again");
                }
            else{
                let maxId = -1;
                Event.find({}, (err, eventList) => {
                    if (eventList.length === 0) {
                        maxId = 0;
                        Event.create({
                            eventId: maxId,
                            name: req.body['name'],
                            loc: loc,
                            quota: req.body['quota']
                        } , (err,e) => {
                            if (err)
                                res.status(500).send("Error in creating event");
                            else
                                res.status(201).send(`{<br>\n"eventId": ${e.eventId},<br>\n"name": "${e.name}",<br>\n"loc":<br>\n{<br>\n"locId": ${e.loc.locId},<br>\n"name": "${e.loc.name}"<br>\n},<br>\n"quota": ${e.quota}<br>\n}`);
                        });
                    }
                    else{
                        eventList.sort((a,b) => b.eventId - a.eventId);
                        maxId = eventList[0].eventId;
                        maxId++;
                        Event.create({
                            eventId: maxId,
                            name: req.body['name'],
                            loc: loc,
                            quota: req.body['quota']
                        } , (err,e) => {
                            if (err)
                                res.status(500).send("Error in creating event");
                            else
                                res.status(201).send(`{<br>\n"eventId": ${e.eventId},<br>\n"name": "${e.name}",<br>\n"loc":<br>\n{<br>\n"locId": ${e.loc.locId},<br>\n"name": "${e.loc.name}"<br>\n},<br>\n"quota": ${e.quota}<br>\n}`);
                        });
                    }
                });
            }
        });
    });

    //Q3 Remove one event from database
    //Done
    app.delete('/event/:eventId', (req,res) => {
        Event.findOne({eventId: req.params['eventId']}, (err, event) => {
            if (err) res.status(404).send("Event you try to delete is not found.");
            else {
                Event.deleteOne({eventId: event.eventId}, (err) => {
                    if (err) res.status(500).send("Delete request failed");
                    else res.status(204).send("The event has been deleted.");
                })
            }
        })
    });

    //Q4: get all events
    //Done
    app.get('/event', (req, res) => {
        Event.find({}, (err, event) => {
            if (err) res.status(500).send("Error in finding the list of events");
            else {
                let response = '[<br>\n';
                event.forEach(item => response = response + `{<br>\n"eventId": ${item.eventId},<br>\n"name": "${item.name}",<br>\n"loc":<br>\n{<br>\n"locId": ${item.loc.locId},<br>\n"name": "${item.loc.name}"<br>\n},<br>\n"quota": ${item.quota}<br>\n}<br>\n,<br>\n`);
                response = response.substring(0, response.length - 6);
                response = response + ']';
                res.status(200).send(response);
            }
        });
    });

    //Q5: Show detail for a specific location ID
    //Done
    app.get('/loc/:locationId', (req, res) => {
        Location.findOne({locId: req.params['locationId']}, (err, loc) => {
            if (err) 
                res.status(500).send("Error in finding the location");
            else if 
                (loc == null) res.status(404).send("We cannot find the location with the ID you provided.");
            else 
                res.status(200).send(`{<br>\n"locId": ${loc.locId},<br>\n"name": "${loc.name}",<br>\n"quota": ${loc.quota}<br>\n}`);
        })
    });

    //Q6 and Q7: get all locations and locations that has quota larger than query
    //Done
    app.get('/loc', (req, res) => {
        if (req.query.quota === undefined){
            Location.find({}, (err, loc) => {
                if(err)
                    res.status(500).send("Error in finding the list of locations");
                else
                    {
                        let response = '[<br>\n';
                        loc.forEach(item => response = response + `{<br>\n"locId": ${item.locId},<br>\n"name": "${item.name}",<br>\n"quota": ${item.quota}<br>\n}<br>\n,<br>\n`);
                        response = response.substring(0, response.length - 6);
                        response = response + ']';
                        res.status(200).send(response);
                    }
            });
        }
        else {
            Location.find({quota:{$gte: req.query.quota}}, (err, loc) => {
                if (err)
                    res.status(500).send("error in finding the list of location with the given quota");
                else if (loc.length === 0) {
                    res.status(200).send('[]');
                }
                else {
                    let response = '[<br>\n';
                    loc.forEach(item => response = response + `{<br>\n"locId": ${item.locId},<br>\n"name": "${item.name}",<br>\n"quota": ${item.quota}<br>\n}<br>\n,<br>\n`);
                    response = response.substring(0, response.length - 6);
                    response = response + ']';
                    res.status(200).send(response);
                }
            })
        }
    });

    //Request for finding the event with the specified event ID
    app.post('/findEvent', (req, res) => {
        Event.findOne({eventId: req.body['eventId']}, (err, event) => {
            if (err)
                res.status(500).send("Cannot find event with this event ID");
            else if (!event){
                console.log("yo");
                res.status(404).send("There is no event with this event ID");
            }
            else {
                res.send({message: `{\n"eventId": ${event.eventId},\n"name": "${event.name}",\n"loc":\n{\n"locId": ${event.loc.locId},\n"name": "${event.loc.name}"\n},\n"quota": ${event.quota}\n}`});
            } 
        })
    });

    //Q8: Put request to change the event details
    app.put('/event/:eventId', (req, res) => {   
        Event.findOne({eventId: req.params['eventId']}, (err, event) => {
            console.log(event);
            let originalName = event.name;
            let originalLocId = event.loc.locId;
            let originalQuota = event.quota;
            let newLoc = '';
            if (req.body['locId'] != '') {
                Location.findOne({locId: req.body['locId']}, (err, requestLoc) => {
                    newLoc = requestLoc;
                });
            }
            Location.findOne({locId: originalLocId}, (err, originalLoc) => {
                if (err)
                    res.status(404).send("Location not found");
                else {
                    Event.findOneAndUpdate({eventId: req.params['eventId']},
                    {
                        $set: {
                            name: req.body['name']!=''?req.body['name']:originalName,
                            quota: req.body['quota']!=''?req.body['quota']:originalQuota,
                            loc: newLoc!=''?newLoc:originalLoc,
                        }
                    },
                    {new: true},
                    (err, updatedEvent) => {
                        console.log(updatedEvent);
                        if(err)
                            res.send("An error occurred when trying to update the event.");
                        else {
                            res.status(201).send(`{\n"eventId": ${updatedEvent.eventId},\n"name": "${updatedEvent.name}",\n"loc":\n{\n"locId": ${updatedEvent.loc.locId},\n"name": "${updatedEvent.loc.name}"\n},\n"quota": ${updatedEvent.quota}\n}`);
                        }
                    });
                }
                
            });
        });
    });

    //create location /createLoc/locId/1/name/CUHK/quota/100
    app.post('/createLoc', (req, res) => {
         Location.findOne({locId: req.body['locId']}, (err, location) => {
             if (err){
                 res.send('error in finding location');
             }
             else if (location != null){
                 res.send("There is already such a location Id");
             }
             else {
                res.send(req.body['locId']);
                Location.create({
                    locId: req.body['locId'],
                    name: req.body['name'],
                    quota: req.body['quota']
                }, (err, newLocation) => {
                    if (err){
                        console.log(err);
                        console.log(newLocation['locId']);
                        res.send('location cannot be created');
                    }
                    else
                        res.send(`new location created with locId: ${newLocation.locId}`);
                })
             }
         })
    })

    //clear all events
    app.delete('/clearEvent', (req, res) => {
        Event.deleteMany({}, (err, list) => {
            res.send("All events deleted");
        });
    });
    app.get('/clearEvent', (req, res) => {
        Event.deleteMany({}, (err, list) => {
            res.send("All events deleted");
        });
    });

    //clear all locations
    app.delete('/clearLoc', (req, res) => {
        Location.remove({}, (err, list) => {
            res.send("All locations deleted");
        });
    });
    app.get('/clearLoc', (req, res) => {
        Location.remove({}, (err, list) => {
            res.send("All locations deleted");
        });
    });


    app.all('/*', (req,res) => {
        res.send("Hello world!");
    });
    
})

app.listen(PORT, function(err){
    if (err) console.log(err);
    console.log("Server listening on PORT", PORT);
});