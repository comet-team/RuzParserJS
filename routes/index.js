var express = require('express');
var request = require('request')
var router = express.Router();

async function getGroupId(group_name) {
    let url = encodeURI('https://ruz.hse.ru/api/search?term=' + group_name + '&type=group');
    let search = new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            resolve(JSON.parse(body));
        });
    });
    let groups_list = await(search);
    for (let i = 0; i < groups_list.length; ++i) {
        if (groups_list[i].label === group_name) {
            return groups_list[i].id;
        }
    }
    return '0';
}

async function getWeekSchedule(group_id) {
    let url = encodeURI('https://ruz.hse.ru/api/schedule/group/' + group_id + '?start=2022.09.19&finish=2022.09.25&lng=1');
    let schedule = new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            resolve(JSON.parse(body));
        });
    });
    return await (schedule);
}

async function sendData(schedule, chat_id) {
    let url = 'http://74f8-217-150-192-102.ngrok.io/notify';
    let data = {
        "schedule": schedule,
        "chat_id": chat_id
    };
    let send = new Promise((resolve, reject) => {
        request.post(url, JSON.stringify(data), (error, response) => {
            resolve(response.statusCode);
        });
    });
    return await (send);
}

function parseSchedule(schedule_raw) {
    let schedule = "";
    schedule += 'Пять ближайших пар:\n';
    for (let i = 0; i < 5; ++i) {
        schedule += 'Пара в ' + schedule_raw[i].beginLesson + ':\n';
        schedule += '  ' + schedule_raw[i].discipline + ' ';
        schedule += 'в ' + schedule_raw[i].auditorium + '.\n';
    }
    return schedule;
}

async function helper(group_name, chat_id) {
    let group_id = await getGroupId(group_name);
    let schedule_raw = await getWeekSchedule(group_id);
    let schedule = parseSchedule(schedule_raw);
    let send = await sendData(schedule, chat_id);
    console.log(send);
}

router.get('/', function(req, res, next) {
    let group_name = req.query.group_name;
    let chat_id = req.query.chat_id;
    helper(group_name, chat_id).then((response) => {
        res.status(200).send('');
    });
});

module.exports = router;
