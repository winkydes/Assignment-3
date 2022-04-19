// Student Name: Lam Wai To Keith
// SID: 1155133260

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
            type: mongoose.Schema.Types.ObjectId, ref: 'Location',
        },
        quota: {
            type: Number
        }
    });

    const Event = mongoose.model('Event', EventSchema);
    
    //Q1: look up the event with the given event ID from the database
    //Done and checked
    app.get('/event/:eventId', (req,res) => {
        Event.findOne({eventId: req.params['eventId']}).populate('loc').exec((err,e) => {
            if (err || e == null){
                res.status(404).set('Content-Type', 'text/plain').send("Event Id not found");
            }
            else
                res.status(201).set('Content-Type', 'text/plain').send(`{\n"eventId": ${e.eventId},\n"name": "${e.name}",\n"loc":\n{\n"locId": ${e.loc.locId},\n"name": "${e.loc.name}"\n},\n"quota": ${e.quota}\n}`);
        });
    });

    //Q2: use the parameters submitted in the HTTP request body to create a new event in the database
    //Done and checked
    app.post('/event', (req,res) => {
        Location.findOne({locId: req.body['locId']}, (err, loc) => {
            if(err)
                res.status(404).set('Content-Type', 'text/plain').send("error in finding location");
            if (loc === null)
                res.status(404).set('Content-Type', 'text/plain').send("no such location, please enter a valid location ID");
            else if(req.body['quota'] > loc.quota){
                    res.status(400).set('Content-Type', 'text/plain').send("You have inputted a quota larger than the location can hold, please try again");
                }
            else{
                let maxId = -1;
                Event.find({}).populate('loc').exec((err, eventList) => {
                    if (eventList.length === 0) {
                        maxId = 0;
                        Event.create({
                            eventId: maxId,
                            name: req.body['name'],
                            loc: loc,
                            quota: req.body['quota']
                        } , (err,e) => {
                            if (err)
                                res.status(500).set('Content-Type', 'text/plain').send("Error in creating event");
                            else
                                res.status(201).set('Content-Type', 'text/plain').set('Location', `http://localhost:3000/event/${e.eventId}`).send(`{\n"eventId": ${e.eventId},\n"name": "${e.name}",\n"loc":\n{\n"locId": ${e.loc.locId},\n"name": "${e.loc.name}"\n},\n"quota": ${e.quota}\n}`);
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
                                res.status(500).set('Content-Type', 'text/plain').send("Error in creating event");
                            else
                                res.status(201).set('Content-Type', 'text/plain').set('Location', `http://localhost:3000/event/${e.eventId}`).send(`{\n"eventId": ${e.eventId},\n"name": "${e.name}",\n"loc":\n{\n"locId": ${e.loc.locId},\n"name": "${e.loc.name}"\n},\n"quota": ${e.quota}\n}`);
                        });
                    }
                });
            }
        });
    });

    //Q3 Remove one event from database
    //Done and checked
    app.delete('/event/:eventId', (req,res) => {
        Event.findOne({eventId: req.params['eventId']}, (err, event) => {
            if (err || event === null) res.status(404).send("Event you try to delete is not found.");
            else {
                Event.deleteOne({eventId: event.eventId}).exec(res.status(204).set('Content-Type', 'text/plain').send("The event has been deleted."));
            }
        })
    });

    //Q4: get all events
    //Done and checked
    app.get('/event', (req, res) => {
        Event.find({}).populate('loc').exec((err, event) => {
            if (err) res.status(500).send("Error in finding the list of events");
            else {
                let response = '[\n';
                event.forEach(item => response = response + `{\n"eventId": ${item.eventId},\n"name": "${item.name}",\n"loc":\n{\n"locId": ${item.loc.locId},\n"name": "${item.loc.name}"\n},\n"quota": ${item.quota}\n}\n,\n`);
                response = response.substring(0, response.length - 2);
                response = response + ']';
                res.status(200).set('Content-Type', 'text/plain').send(response);
            }
        });
    });

    //Q5: Show detail for a specific location ID
    //Done and checked
    app.get('/loc/:locationId', (req, res) => {
        Location.findOne({locId: req.params['locationId']}, (err, loc) => {
            if (err) 
                res.status(500).set('Content-Type', 'text/plain').send("Error in finding the location");
            else if 
                (loc == null) res.status(404).set('Content-Type', 'text/plain').send("We cannot find the location with the ID you provided.");
            else 
                res.status(200).set('Content-Type', 'text/plain').send(`{\n"locId": ${loc.locId},\n"name": "${loc.name}",\n"quota": ${loc.quota}\n}`);
        })
    });

    //Q6 and Q7: get all locations and locations that has quota larger than query
    //Done and checked
    app.get('/loc', (req, res) => {
        if (req.query.quota === undefined){
            Location.find({}, (err, loc) => {
                if(err)
                    res.status(500).set('Content-Type', 'text/plain').send("Error in finding the list of locations");
                else
                    {
                        let response = '[\n';
                        loc.forEach(item => response = response + `{\n"locId": ${item.locId},\n"name": "${item.name}",\n"quota": ${item.quota}\n}\n,\n`);
                        response = response.substring(0, response.length - 2);
                        response = response + ']';
                        res.status(200).set('Content-Type', 'text/plain').send(response);
                    }
            });
        }
        else {
            Location.find({quota:{$gte: req.query.quota}}, (err, loc) => {
                if (err)
                    res.status(500).set('Content-Type', 'text/plain').send("error in finding the list of location with the given quota");
                else {
                    let response = '[\n';
                    loc.forEach(item => response = response + `{\n"locId": ${item.locId},\n"name": "${item.name}",\n"quota": ${item.quota}\n}\n,\n`);
                    if (loc.length == 0) response = response.substring(0, response.length - 1);
                    else response = response.substring(0, response.length - 2);
                    response = response + ']';
                    res.status(200).set('Content-Type', 'text/plain').send(response);
                }
            })
        }
    });

    //Request for finding the event with the specified event ID
    //Done and checked
    app.post('/findEvent', (req, res) => {
        Event.findOne({eventId: req.body['eventId']}).populate('loc').exec((err, event) => {
            if (err)
                res.status(500).set('Content-Type', 'text/plain').send("Cannot find event with this event ID");
            else if (!event){
                res.status(404).set('Content-Type', 'text/plain').send("There is no event with this event ID");
            }
            else {
                res.send({message: `{\n"eventId": ${event.eventId},\n"name": "${event.name}",\n"loc":\n{\n"locId": ${event.loc.locId},\n"name": "${event.loc.name}"\n},\n"quota": ${event.quota}\n}`});
            }
        });
    });

    //Q8: Put request to change the event details
    //Done and checked
    app.put('/event/:eventId', (req, res) => {   
        Event.findOne({eventId: req.params['eventId']}).populate('loc').exec((err, event) => {
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
                    {new: true}).populate('loc').exec((err, updatedEvent) => {
                        if(err)
                            res.set('Content-Type', 'text/plain').send("An error occurred when trying to update the event.");
                        else {
                            res.status(201).set('Content-Type', 'text/plain').send(`{\n"eventId": ${updatedEvent.eventId},\n"name": "${updatedEvent.name}",\n"loc":\n{\n"locId": ${updatedEvent.loc.locId},\n"name": "${updatedEvent.loc.name}"\n},\n"quota": ${updatedEvent.quota}\n}`);
                        }
                    });
                }
                
            });
        });
    });

    //The methods below are for testing only

    //create location
    app.post('/createLoc', (req, res) => {
         Location.findOne({locId: req.body['locId']}, (err, location) => {
             if (err){
                 res.send('error in finding location');
             }
             else if (location != null){
                 res.send("There is already such a location Id");
             }
             else {
                Location.create({
                    locId: req.body['locId'],
                    name: req.body['name'],
                    quota: req.body['quota']
                }, (err, newLocation) => {
                    if (err){
                        console.log(err);
                        res.send('location cannot be created');
                    }
                    else
                        res.send(`new location created with locId: ${newLocation.locId}`);
                })
             }
         })
    })

    //clear all events
    app.get('/clearEvent', (req, res) => {
        Event.deleteMany({}, (err, list) => {
            res.send("All events deleted");
        });
    });

    //clear all locations
    app.get('/clearLoc', (req, res) => {
        Location.deleteMany({}, (err, list) => {
            res.send("All locations deleted");
        });
    });


    //handle other routes
    app.all('/*', (req,res) => {
        res.send("Hello world!");
    });
    
})

app.listen(PORT, function(err){
    if (err) console.log(err);
    console.log("Server listening on PORT", PORT);
});