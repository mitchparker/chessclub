const cron = require('node-cron');
const express = require('express');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const fs = require('fs');
const myTeam = 'shp-chess-club';
let mbrs = null;
let mbrHistory = [];
let ratingPromises = [];
let fullData = [];
let delay = 0;
const delayIncrement = 1000;

app = express();

cron.schedule('* * * * * *', function (){
    console.log('test');

});


cron.schedule('0 0 * * *', function () {
    getTeamMembers().then((users) => {

    

        for (let i = 0; i < users.length; i++) {
            delay = 1000 * i;
            // console.log(ret[i]['member']);//getMemberRating(ret[i]['id'], i)
    
            let thismember = users[i]['id'];
    
            ratingPromises.push(new Promise(async function (resolve) {
                await new Promise(res => setTimeout(res, delay));
    
                let result = await new Promise(r => {
    
    
                    if (mbrHistory[thismember] != null) {
                        resolve(mbrHistory[thismember]);
                        return;
                    }
                    console.log('before sleep');
                    sleep(1000);
                    // console.log('after sleep');
    
    
                    var xhttp = new XMLHttpRequest();
                    xhttp.open("GET", "https://lichess.org/api/user/" + thismember + "/rating-history", true);
                    xhttp.onload = function () {
                        if (this.readyState == 4 && this.status == 200) {
                            var rText = JSON.parse(xhttp.responseText);
                            mbrHistory[thismember] = {
                                member: thismember,
                                history: rText
                            };
                            console.log('before resolve');
                            resolve(mbrHistory[thismember]);
                        }
                    };
                    xhttp.onerror = () => {
                        reject({
                            status: xhttp.status,
                            statusText: xhttp.statusText
                        });
                    };
                    xhttp.send();
                });
                resolve(result);
    
            }));
        }
    
    
        Promise.all(ratingPromises).then((e) => {
            console.log(e);
            let data = JSON.stringify(e);
            fs.writeFileSync('member-data.json', data);
        });
        // console.log(ret);
    });
    
    
})

function ndjsonToArray(ret) {
    let retArray = ret.split('\n');
    ret = [];
    for (let mbr of retArray) {
        if (mbr.length > 2) ret.push(JSON.parse(mbr));
    }
    return ret;
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

var getTeamMembers = function (team) {
    return new Promise((resolve, reject) => {
        var xhttp = new XMLHttpRequest();
        xhttp.open("GET", "https://lichess.org/api/team/" + myTeam + "/users", true);
        xhttp.onload = function () {
            if (this.readyState == 4 && this.status == 200) {
                // console.log(xhttp.responseText);
                // let ret = JSON.parse(xhttp.responseText);
                let ret = ndjsonToArray(xhttp.responseText);
                resolve(ret);
            }
        };
        xhttp.onerror = () => {
            reject({
                status: xhttp.status,
                statusTest: xhttp.statusText
            });
        };
        xhttp.send();
    });
}

var getMemberRating = (member, idx) => {
    return new Promise(async function (resolve) {
        // only fetch from lichess API if we don't already have that member's history



        if (mbrHistory[member] != null) {
            resolve(mbrHistory[member]);
            return;
        }
        console.log('before sleep');
        sleep(1000);
        // console.log('after sleep');


        var xhttp = new XMLHttpRequest();
        xhttp.open("GET", "https://lichess.org/api/user/" + member + "/rating-history", true);
        xhttp.onload = function () {
            if (this.readyState == 4 && this.status == 200) {
                var ret = JSON.parse(xhttp.responseText);
                mbrHistory[member] = {
                    member: member,
                    history: ret
                };
                console.log('before resolve');
                resolve(mbrHistory[member]);
            }
        };
        xhttp.onerror = () => {
            reject({
                status: xhttp.status,
                statusText: xhttp.statusText
            });
        };
        xhttp.send();
    });
}

console.log('Running');