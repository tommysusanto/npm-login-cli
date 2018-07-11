#!/usr/bin/env node
const child_process =require('child_process')

const registry = process.argv[2]
const username = process.argv[3];
const password = process.argv[4];
const email = process.argv[5];

const childProcess = child_process.spawn('npm', ['login','--registry',`${registry}`])
childProcess.stdout.on('data', function (data) {
    console.log(data.toString())
    if (data.toString()=='Username: '){
        childProcess.stdin.write(`${username}\n`)
    }
    if (data.toString() == 'Password: ') {
        childProcess.stdin.write(`${password}\n`)
    }
    if (data.toString() == 'Email: (this IS public) ') {
        childProcess.stdin.write(`${email}\n`)
    }
});

childProcess.stderr.on('data', function (error) {
    console.log(error.toString())
});

