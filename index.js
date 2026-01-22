#!/usr/bin/env node
const child_process = require('child_process')

const args = process.argv.slice(2)

const USAGE = `
npm-login-cli - Automate npm login for CI/CD pipelines

Usage:
  npm-login-cli <registry> <username> <password> <email> [timeout]

Arguments:
  registry   Registry URL (e.g., https://registry.npmjs.org)
  username   npm username
  password   npm password
  email      Email address (will be public)
  timeout    Kill process after ms (default: 5000)

Examples:
  npm-login-cli https://registry.npmjs.org myuser mypass user@example.com
  npm-login-cli http://localhost:4873 admin admin admin@local.dev 10000
`.trim()

// Handle --help / -h
if (args.includes('--help') || args.includes('-h')) {
    console.log(USAGE)
    process.exit(0)
}

// Validate required arguments
if (args.length < 4) {
    console.error('Error: Missing required arguments\n')
    console.error(USAGE)
    process.exit(1)
}

const registry = args[0]
const username = args[1]
const password = args[2]
const email = args[3]
const timeout = parseInt(args[4], 10) || 5000

// Validate registry URL format
try {
    const url = new URL(registry)
    if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol')
    }
} catch (e) {
    console.error(`Error: Invalid registry URL "${registry}"`)
    console.error('Registry must be a valid HTTP or HTTPS URL')
    process.exit(1)
}

const windowsEnvironment = process.platform === 'win32'
const cmd = windowsEnvironment ? 'npm.cmd' : 'npm'

const childProcess = child_process.spawn(cmd, ['login', '--registry', registry])

let timeoutId = null

childProcess.stdout.on('data', function (data) {
    const output = data.toString()
    console.log(output)

    if (output === 'Username: ') {
        childProcess.stdin.write(username + '\n')
    }
    if (output === 'Password: ') {
        childProcess.stdin.write(password + '\n')
    }
    if (output === 'Email: (this IS public) ') {
        childProcess.stdin.write(email + '\n')
    }

    // Reset timeout on each data event, only keep one active
    if (timeoutId) {
        clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
        try {
            if (windowsEnvironment) {
                child_process.exec('taskkill /pid ' + childProcess.pid + ' /T /F')
            } else {
                childProcess.kill()
            }
        } catch (e) {
            console.error('Cannot kill process:', e.message)
        }
    }, timeout)
})

childProcess.stderr.on('data', function (error) {
    console.error(error.toString())
})

childProcess.on('error', function (error) {
    console.error('Failed to start npm login:', error.message)
    process.exit(1)
})

childProcess.on('close', function (code) {
    if (timeoutId) {
        clearTimeout(timeoutId)
    }
    process.exit(code || 0)
})
